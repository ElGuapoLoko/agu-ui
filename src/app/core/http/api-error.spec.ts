import { HttpErrorResponse } from '@angular/common/http';

import { CONNECTION_ERROR, UNAVAILABLE_ERROR, UNEXPECTED_ERROR, toApiError } from './api-error';

describe('toApiError', () => {
  it('uses the Problem Details message and violations', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        status: 422,
        detail: 'Um ou mais campos são inválidos.',
        violations: [{ field: 'title', message: 'O título é obrigatório.' }, { bogus: true }],
      },
    });

    expect(toApiError(error)).toEqual({
      status: 422,
      message: 'Um ou mais campos são inválidos.',
      violations: [{ field: 'title', message: 'O título é obrigatório.' }],
    });
  });

  it('maps network failures to a connection message', () => {
    expect(toApiError(new HttpErrorResponse({ status: 0 })).message).toBe(CONNECTION_ERROR);
  });

  it('never shows server error details for API 500s', () => {
    const error = new HttpErrorResponse({ status: 500, error: { status: 500, detail: 'SQLSTATE secret' } });

    expect(toApiError(error).message).toBe(UNEXPECTED_ERROR);
  });

  it('treats gateway errors and non-API 5xx as unavailable', () => {
    expect(toApiError(new HttpErrorResponse({ status: 502 })).message).toBe(UNAVAILABLE_ERROR);
    expect(toApiError(new HttpErrorResponse({ status: 500, error: 'proxy error' })).message).toBe(UNAVAILABLE_ERROR);
  });

  it('handles non-HTTP errors', () => {
    expect(toApiError(new Error('boom'))).toEqual({ status: -1, message: UNEXPECTED_ERROR, violations: [] });
  });

  it('falls back when a 4xx has no detail', () => {
    expect(toApiError(new HttpErrorResponse({ status: 404, error: null })).message).toBe(UNEXPECTED_ERROR);
  });
});
