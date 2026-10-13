import { HttpErrorResponse } from '@angular/common/http';

export interface FieldViolation {
  field: string;
  message: string;
}

/** Error shown to the user. Built from the API's Problem Details body or from network failures. */
export interface ApiError {
  status: number;
  message: string;
  violations: FieldViolation[];
}

export const CONNECTION_ERROR = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
export const UNEXPECTED_ERROR = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
export const UNAVAILABLE_ERROR = 'O servidor está indisponível no momento. Tente novamente em instantes.';

/** Gateway errors: the API behind the proxy is down or restarting. */
const UNAVAILABLE_STATUSES = [502, 503, 504];

interface ProblemBody {
  status?: unknown;
  detail?: unknown;
  violations?: unknown;
}

function isViolation(value: unknown): value is FieldViolation {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FieldViolation).field === 'string' &&
    typeof (value as FieldViolation).message === 'string'
  );
}

/** Converts anything thrown by HttpClient into a safe, user-facing ApiError. */
export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, message: UNEXPECTED_ERROR, violations: [] };
  }

  if (error.status === 0) {
    return { status: 0, message: CONNECTION_ERROR, violations: [] };
  }

  const body: ProblemBody = typeof error.error === 'object' && error.error !== null ? error.error : {};
  const fromApi = typeof body.status === 'number';

  // A 5xx that is not our Problem Details JSON came from a proxy: the API is unreachable.
  if (UNAVAILABLE_STATUSES.includes(error.status) || (error.status >= 500 && !fromApi)) {
    return { status: error.status, message: UNAVAILABLE_ERROR, violations: [] };
  }

  const violations = Array.isArray(body.violations) ? body.violations.filter(isViolation) : [];
  const detail = typeof body.detail === 'string' && error.status < 500 ? body.detail : UNEXPECTED_ERROR;

  return { status: error.status, message: detail, violations };
}
