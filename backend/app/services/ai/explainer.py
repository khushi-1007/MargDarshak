import json
from typing import Optional
from app.config import settings
from app.core.logging import logger
from app.schemas.ai import GroundedExplanationRequest, GroundedExplanationResponse, RouteDecisionFacts


class DeterministicAIProvider:
    """
    Deterministic Grounded Explainer.
    100% reliable rule-based explanation with zero external dependencies.
    Directly formats provided RouteDecisionFacts into structured natural language.
    """

    async def explain(self, facts: RouteDecisionFacts, question: Optional[str] = None) -> GroundedExplanationResponse:
        explanation_text = self._format_facts(facts, question)
        return GroundedExplanationResponse(
            explanation=explanation_text,
            grounded_facts=facts,
            engine="MargDarshak Deterministic Explainer",
            confidence=1.0
        )

    def _format_facts(self, facts: RouteDecisionFacts, question: Optional[str] = None) -> str:
        parts = []

        if facts.trigger == "VEHICLE_BREAKDOWN":
            parts.append(
                f"Following the breakdown of vehicle {facts.vehicle_unavailable or 'assigned unit'}, "
                f"{len(facts.affected_orders)} active orders ({', '.join(facts.affected_orders)}) required emergency reassignment."
            )
        elif facts.trigger == "CASCADING_BREAKDOWN":
            parts.append(
                f"A secondary cascading failure occurred with vehicle {facts.vehicle_unavailable or 'assigned unit'}. "
                f"Fleet capacity was dynamically re-evaluated across remaining operational units."
            )
        elif facts.trigger == "TRAFFIC":
            parts.append(
                "A traffic congestion event triggered route re-optimisation to protect committed delivery windows."
            )
        elif facts.trigger == "PRIORITY_ORDER":
            parts.append(
                f"High-priority orders ({', '.join(facts.affected_orders)}) were introduced into the schedule, triggering real-time insertion."
            )
        else:
            parts.append(f"A fleet event ({facts.trigger}) triggered route re-optimisation.")

        if facts.selected_vehicle:
            reasons_formatted = []
            for r in facts.selection_reasons:
                if r == "sufficient_capacity":
                    reasons_formatted.append("sufficient remaining payload capacity")
                elif r == "within_driver_hours":
                    reasons_formatted.append("compliance with driver shift hours")
                elif r == "time_window_feasible":
                    reasons_formatted.append("delivery time-window feasibility")
                elif r == "lowest_incremental_cost":
                    reasons_formatted.append("lowest incremental routing cost")
                else:
                    reasons_formatted.append(r.replace("_", " "))

            reason_str = ", ".join(reasons_formatted) if reasons_formatted else "optimal feasibility metrics"
            parts.append(
                f"Vehicle {facts.selected_vehicle} was selected among candidates {facts.candidate_vehicles or ['operational fleet']} "
                f"due to {reason_str}."
            )

        # Operational Impact / Deltas
        impact_details = []
        if facts.cost_delta != 0:
            direction = "increase" if facts.cost_delta > 0 else "saving"
            impact_details.append(f"net cost {direction} of INR {abs(facts.cost_delta):.2f}")
        if facts.distance_delta_km != 0:
            direction = "additional" if facts.distance_delta_km > 0 else "reduction of"
            impact_details.append(f"{direction} {abs(facts.distance_delta_km):.1f} km travel")
        if facts.eta_delta_minutes != 0:
            direction = "delay" if facts.eta_delta_minutes > 0 else "saving"
            impact_details.append(f"{abs(facts.eta_delta_minutes):.1f} min ETA {direction}")
        if facts.sla_violations_added == 0:
            impact_details.append("0 additional SLA violations")
        else:
            impact_details.append(f"{facts.sla_violations_added} SLA violations added")

        if impact_details:
            parts.append(f"Operational trade-offs: {', '.join(impact_details)}.")

        if facts.unassigned_orders:
            parts.append(
                f"Note: Due to hard capacity/time boundaries, orders {', '.join(facts.unassigned_orders)} "
                f"could not be accommodated without SLA breach; backup carrier dispatch is recommended."
            )

        return " ".join(parts)


class SarvamAIProvider:
    """
    Sarvam AI LLM Provider for natural-language explanation of already-computed structured facts.
    Strictly instructs the model not to calculate or invent metrics and to rely solely on RouteDecisionFacts.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 10.0
    ):
        self.api_key = api_key or settings.SARVAM_API_KEY
        self.model = model or getattr(settings, "SARVAM_MODEL", "sarvam-105b-conversations")
        self.timeout = timeout

    async def explain(self, facts: RouteDecisionFacts, question: Optional[str] = None) -> GroundedExplanationResponse:
        if not self.api_key:
            raise ValueError("SARVAM_API_KEY is not configured.")

        from sarvamai import AsyncSarvamAI

        client = AsyncSarvamAI(api_subscription_key=self.api_key, timeout=self.timeout)

        system_prompt = (
            "You are an operational explanation assistant for a fleet optimisation system.\n"
            "Do not calculate or invent metrics.\n"
            "Use only the supplied structured facts.\n"
            "Explain why the optimiser made the decision.\n"
            "If a value is not present in the supplied facts, do not invent it.\n"
            "Keep the explanation concise, professional, and directly grounded in the provided facts."
        )

        user_content = (
            f"Question: {question or 'Why was this routing decision made?'}\n\n"
            f"Facts:\n{facts.model_dump_json(indent=2)}"
        )

        response = await client.chat.completions(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.1,
            max_tokens=300
        )

        if not response or not getattr(response, "choices", None):
            raise ValueError("Empty or invalid choices list returned by Sarvam AI.")

        choice = response.choices[0]
        if not choice or not getattr(choice, "message", None):
            raise ValueError("Missing message object in Sarvam AI response.")

        explanation_text = getattr(choice.message, "content", None)
        if not explanation_text or not explanation_text.strip():
            raise ValueError("Sarvam AI returned an empty response content.")

        return GroundedExplanationResponse(
            explanation=explanation_text.strip(),
            grounded_facts=facts,
            engine=f"Sarvam AI ({self.model})",
            confidence=1.0
        )


class AIExplainer:
    """
    Fleet decision explanation orchestrator.
    Attempts Sarvam AI when SARVAM_API_KEY is configured and available;
    seamlessly falls back to DeterministicAIProvider on any failure, timeout, or missing key.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None
    ):
        if api_key is not None:
            self.api_key = api_key if (isinstance(api_key, str) and api_key.strip()) else None
        else:
            self.api_key = settings.SARVAM_API_KEY

        self.model = model or getattr(settings, "SARVAM_MODEL", "sarvam-105b-conversations")
        self.deterministic_provider = DeterministicAIProvider()
        self.sarvam_provider = SarvamAIProvider(api_key=self.api_key, model=self.model) if self.api_key else None

    async def explain(self, req: GroundedExplanationRequest) -> GroundedExplanationResponse:
        facts = req.facts

        if self.sarvam_provider:
            try:
                return await self.sarvam_provider.explain(facts, req.question)
            except Exception as e:
                # Log diagnostic information without exposing API key or sensitive headers
                logger.warning(f"AI provider unavailable; using deterministic fallback: {type(e).__name__} - {str(e)[:150]}")

        # Deterministic Grounded Explainer fallback (100% reliable, zero external dependencies)
        return await self.deterministic_provider.explain(facts, req.question)


# Backwards compatibility alias
AIExplainerService = AIExplainer
