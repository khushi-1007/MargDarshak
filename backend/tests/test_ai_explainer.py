from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from app.schemas.ai import GroundedExplanationRequest, RouteDecisionFacts
from app.services.ai.explainer import AIExplainer, AIExplainerService, DeterministicAIProvider, SarvamAIProvider


@pytest.fixture
def sample_facts():
    return RouteDecisionFacts(
        trigger="VEHICLE_BREAKDOWN",
        vehicle_unavailable="V03",
        affected_orders=["ORD101", "ORD102"],
        candidate_vehicles=["V01", "V04"],
        selected_vehicle="V04",
        selection_reasons=[
            "sufficient_capacity",
            "within_driver_hours",
            "time_window_feasible",
            "lowest_incremental_cost"
        ],
        cost_delta=180.0,
        distance_delta_km=4.2,
        eta_delta_minutes=6.0,
        sla_violations_added=0
    )


@pytest.mark.asyncio
async def test_deterministic_ai_explainer_directly(sample_facts):
    provider = DeterministicAIProvider()
    res = await provider.explain(sample_facts, question="Why was Order ORD101 assigned to V04?")

    assert res.explanation is not None
    assert "V04" in res.explanation
    assert "V03" in res.explanation
    assert "180.00" in res.explanation or "180" in res.explanation
    assert "4.2" in res.explanation
    assert "sufficient remaining payload capacity" in res.explanation
    assert res.engine == "MargDarshak Deterministic Explainer"
    assert res.confidence == 1.0


@pytest.mark.asyncio
async def test_explainer_key_absent_uses_deterministic_fallback(sample_facts):
    # When api_key is explicitly empty
    explainer = AIExplainer(api_key="")
    assert explainer.sarvam_provider is None

    req = GroundedExplanationRequest(question="Why was V04 chosen?", facts=sample_facts)
    res = await explainer.explain(req)

    assert res.engine == "MargDarshak Deterministic Explainer"
    assert "V04" in res.explanation
    # Grounded facts remain unchanged
    assert res.grounded_facts == sample_facts


@pytest.mark.asyncio
async def test_explainer_key_present_initializes_sarvam_provider(sample_facts):
    explainer = AIExplainer(api_key="mock_secret_key_12345", model="sarvam-105b-conversations")
    assert explainer.sarvam_provider is not None
    assert explainer.sarvam_provider.api_key == "mock_secret_key_12345"
    assert explainer.sarvam_provider.model == "sarvam-105b-conversations"


@pytest.mark.asyncio
async def test_sarvam_api_success_mocked(sample_facts):
    explainer = AIExplainer(api_key="mock_secret_key_12345", model="sarvam-105b-conversations")

    mock_choice = MagicMock()
    mock_choice.message.content = "Order ORD101 was reassigned to V04 due to V03 engine failure with 0 SLA breaches."
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(return_value=mock_response)
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why V04?", facts=sample_facts)
        res = await explainer.explain(req)

        assert res.engine == "Sarvam AI (sarvam-105b-conversations)"
        assert res.explanation == "Order ORD101 was reassigned to V04 due to V03 engine failure with 0 SLA breaches."
        assert res.grounded_facts == sample_facts


@pytest.mark.asyncio
async def test_sarvam_api_failure_falls_back_to_deterministic(sample_facts, caplog):
    secret_key = "mock_secret_key_abcdef"
    explainer = AIExplainer(api_key=secret_key, model="sarvam-105b-conversations")

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(side_effect=RuntimeError("Sarvam service 503 unavailable"))
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why V04?", facts=sample_facts)
        res = await explainer.explain(req)

        # Graceful fallback to deterministic engine
        assert res.engine == "MargDarshak Deterministic Explainer"
        assert "V04" in res.explanation

        # Verify secret key is NEVER printed in logs
        assert secret_key not in caplog.text


@pytest.mark.asyncio
async def test_sarvam_timeout_falls_back_to_deterministic(sample_facts):
    explainer = AIExplainer(api_key="mock_key", model="sarvam-105b-conversations")

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(side_effect=TimeoutError("Request timed out after 10s"))
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why V04?", facts=sample_facts)
        res = await explainer.explain(req)

        assert res.engine == "MargDarshak Deterministic Explainer"
        assert "V04" in res.explanation


@pytest.mark.asyncio
async def test_sarvam_malformed_empty_response_falls_back(sample_facts):
    explainer = AIExplainer(api_key="mock_key", model="sarvam-105b-conversations")

    mock_choice = MagicMock()
    mock_choice.message.content = ""  # Empty content
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(return_value=mock_response)
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why V04?", facts=sample_facts)
        res = await explainer.explain(req)

        assert res.engine == "MargDarshak Deterministic Explainer"
        assert "V04" in res.explanation


@pytest.mark.asyncio
async def test_sarvam_null_choices_falls_back(sample_facts):
    explainer = AIExplainer(api_key="mock_key", model="sarvam-105b-conversations")

    mock_response = MagicMock()
    mock_response.choices = []  # No choices

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(return_value=mock_response)
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why V04?", facts=sample_facts)
        res = await explainer.explain(req)

        assert res.engine == "MargDarshak Deterministic Explainer"
        assert "V04" in res.explanation


@pytest.mark.asyncio
async def test_ai_provider_failure_does_not_break_facts_contract(sample_facts):
    # Ensure facts model remains strictly immutable and uncorrupted
    original_dump = sample_facts.model_dump()
    explainer = AIExplainer(api_key="broken_key")

    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(side_effect=Exception("Critical crash in external API"))
        mock_sarvam_cls.return_value = mock_instance

        req = GroundedExplanationRequest(question="Why was this route planned?", facts=sample_facts)
        res = await explainer.explain(req)

        assert res.grounded_facts.model_dump() == original_dump
        assert res.explanation is not None
        assert len(res.explanation) > 20


@pytest.mark.asyncio
async def test_optimisation_workflow_independent_of_ai_provider(sample_facts):
    # Demonstrate that AI explainer crash cannot affect solver or factual decisions
    explainer_crashed = AIExplainer(api_key="crashing_key")
    with patch("sarvamai.AsyncSarvamAI") as mock_sarvam_cls:
        mock_instance = MagicMock()
        mock_instance.chat.completions = AsyncMock(side_effect=Exception("Total provider outage"))
        mock_sarvam_cls.return_value = mock_instance

        # Even with an unhandled network failure in Sarvam AI, explain() never raises
        res = await explainer_crashed.explain(GroundedExplanationRequest(facts=sample_facts))
        assert res.engine == "MargDarshak Deterministic Explainer"
        assert res.grounded_facts.cost_delta == 180.0
        assert res.grounded_facts.selected_vehicle == "V04"
