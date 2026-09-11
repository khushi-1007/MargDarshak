from fastapi import APIRouter, File, HTTPException, UploadFile
from benchmarks.cvrplib_loader import CVRPLIBParser
from benchmarks.solomon_loader import SolomonParser
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/benchmarks", tags=["Benchmarks"])


@router.post("/solomon", response_model=ApiResponse[dict])
async def parse_and_benchmark_solomon(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
        parsed = SolomonParser.parse_text(text)
        
        # Benchmark metadata
        return ApiResponse.ok({
            "instance_name": parsed["name"],
            "num_vehicles": parsed["num_vehicles"],
            "vehicle_capacity": parsed["capacity"],
            "total_customers": parsed["total_customers"],
            "status": "LOADED_SUCCESSFULLY",
            "message": "Instance parsed. Ready for algorithm evaluation."
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse Solomon benchmark: {e}")


@router.post("/cvrplib", response_model=ApiResponse[dict])
async def parse_and_benchmark_cvrplib(file: UploadFile = File(...)):
    content = await file.read()
    try:
        text = content.decode("utf-8")
        parsed = CVRPLIBParser.parse_text(text)
        return ApiResponse.ok({
            "instance_name": parsed["name"],
            "vehicle_capacity": parsed["capacity"],
            "num_nodes": parsed["num_nodes"],
            "status": "LOADED_SUCCESSFULLY",
            "message": "CVRPLIB instance parsed successfully."
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CVRPLIB benchmark: {e}")
