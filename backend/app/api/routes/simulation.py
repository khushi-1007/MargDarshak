from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_roles
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.simulation import ScenarioComparisonResponse, SimulationScenarioRequest
from app.services.simulation.simulator import WhatIfSimulator

router = APIRouter(prefix="/simulation", tags=["What-If Simulation"])


@router.post("", response_model=ApiResponse[ScenarioComparisonResponse])
async def run_what_if_simulation(
    req: SimulationScenarioRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.DISPATCHER, UserRole.ADMIN))
):
    simulator = WhatIfSimulator(db)
    comparison = await simulator.run_scenario(req)
    return ApiResponse.ok(comparison)
