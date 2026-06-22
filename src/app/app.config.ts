import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';

import { routes } from './app.routes';

/**
 * Root application configuration.
 *
 * withHashLocation() switches Angular's router to hash-based URLs
 * (e.g. /#/flow/1 instead of /flow/1). This is required for GitHub Pages,
 * which serves static files and cannot redirect deep URLs to index.html.
 * Without it, refreshing or sharing a direct link would return a 404.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
  ],
};
