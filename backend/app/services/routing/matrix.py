import hashlib
import json
from typing import Dict, List, Tuple
from app.config import settings
from app.services.routing.provider_base import RoutingProvider
from app.services.routing.mock_provider import MockRoutingProvider
from app.services.routing.osrm_provider import OSRMRoutingProvider

_provider_instance: RoutingProvider = None
_matrix_cache: Dict[str, Tuple[List[List[float]], List[List[float]]]] = {}


def get_routing_provider() -> RoutingProvider:
    global _provider_instance
    if _provider_instance is None:
        if settings.ROUTING_API_URL:
            _provider_instance = OSRMRoutingProvider()
        else:
            _provider_instance = MockRoutingProvider()
    return _provider_instance


def _hash_locations(locations: List[Tuple[float, float]], traffic_factor: float) -> str:
    key_data = {
        "locs": [[round(lat, 5), round(lng, 5)] for lat, lng in locations],
        "traffic": round(traffic_factor, 2)
    }
    dumped = json.dumps(key_data, sort_keys=True)
    return hashlib.sha256(dumped.encode("utf-8")).hexdigest()


async def get_cached_distance_and_duration_matrices(
    locations: List[Tuple[float, float]],
    traffic_factor: float = 1.0,
    provider: RoutingProvider = None
) -> Tuple[List[List[float]], List[List[float]]]:
    """
    Return both distance and duration matrices, utilizing the memory cache.
    """
    cache_key = _hash_locations(locations, traffic_factor)
    if cache_key in _matrix_cache:
        return _matrix_cache[cache_key]

    prov = provider or get_routing_provider()
    dist_matrix = await prov.get_distance_matrix(locations)
    dur_matrix = await prov.get_duration_matrix(locations, traffic_factor=traffic_factor)

    _matrix_cache[cache_key] = (dist_matrix, dur_matrix)
    return dist_matrix, dur_matrix
