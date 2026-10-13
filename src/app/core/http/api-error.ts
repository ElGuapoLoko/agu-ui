import { HttpErrorResponse } from '@angular/common/http';

export interface FieldViolation {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  violations: FieldViolation[];
}

export const CONNECTION_ERROR = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
export const UNEXPECTED_ERROR = 'Ocorreu um erro inesperado. Tente novamente mais tarde.';
export const UNAVAILABLE_ERROR = 'O servidor está indisponível no momento. Tente novamente em instantes.';

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

export function toApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, message: UNEXPECTED_ERROR, violations: [] };
  }

  if (error.status === 0) {
    return { status: 0, message: CONNECTION_ERROR, violations: [] };
  }

  const body: ProblemBody = typeof error.error === 'object' && error.error !== null ? error.error : {};
  const fromApi = typeof body.status === 'number';

  if (UNAVAILABLE_STATUSES.includes(error.status) || (error.status >= 500 && !fromApi)) {
    return { status: error.status, message: UNAVAILABLE_ERROR, violations: [] };
  }

  const violations = Array.isArray(body.violations) ? body.violations.filter(isViolation) : [];
  const detail = typeof body.detail === 'string' && error.status < 500 ? body.detail : UNEXPECTED_ERROR;

  return { status: error.status, message: detail, violations };
}
