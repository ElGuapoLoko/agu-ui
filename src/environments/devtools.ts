import { EnvironmentProviders, Provider } from '@angular/core';

/** Production: no Redux DevTools (replaced by devtools.development.ts in development builds). */
export const devtoolsProviders: (Provider | EnvironmentProviders)[] = [];
