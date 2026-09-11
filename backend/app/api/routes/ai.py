from fastapi import APIRouter, Depends
from app.schemas.ai import GroundedExplanationRequest, GroundedExplanationResponse
from app.schemas.common import ApiResponse
from app.services.ai.explainer import AIExplainerService

router = APIRouter(prefix="/ai", tags=["AI Explanation"])


@router.post("/explain", response_model=ApiResponse[GroundedExplanationResponse])
async def explain_decision(req: GroundedExplanationRequest):
    explainer = AIExplainerService()
    result = await explainer.explain(req)
    return ApiResponse.ok(result)
