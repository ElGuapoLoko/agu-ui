import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/** Base URL of the REST API (no trailing slash). Injected so tests can override it. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});
