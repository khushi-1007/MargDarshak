from typing import Any, Dict, Optional


class MargDarshakException(Exception):
    """Base exception for all MargDarshak errors."""
    code: str = "INTERNAL_SERVER_ERROR"
    message: str = "An internal server error occurred."
    status_code: int = 500

    def __init__(self, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(message or self.message)
        self.message = message or self.message
        self.details = details or {}


class NoFeasiblePlanError(MargDarshakException):
    code = "NO_FEASIBLE_PLAN"
    message = "No feasible route plan could be found with the current constraints."
    status_code = 422


class OptimisationTimeoutError(MargDarshakException):
    code = "OPTIMISATION_TIMEOUT"
    message = "The solver exceeded the maximum allowed computation time."
    status_code = 504


class ExternalProviderError(MargDarshakException):
    code = "EXTERNAL_PROVIDER_ERROR"
    message = "External service provider failed or is unreachable."
    status_code = 502


class ValidationError(MargDarshakException):
    code = "VALIDATION_ERROR"
    message = "Input validation failed."
    status_code = 400


class ResourceNotFoundError(MargDarshakException):
    code = "RESOURCE_NOT_FOUND"
    message = "Requested resource not found."
    status_code = 404


class InvalidStateTransitionError(MargDarshakException):
    code = "INVALID_STATE_TRANSITION"
    message = "The requested state transition is not allowed."
    status_code = 409


class AuthenticationError(MargDarshakException):
    code = "AUTHENTICATION_FAILED"
    message = "Invalid authentication credentials."
    status_code = 401


class PermissionDeniedError(MargDarshakException):
    code = "PERMISSION_DENIED"
    message = "You do not have permission to perform this action."
    status_code = 403
