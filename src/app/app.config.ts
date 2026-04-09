import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router'; // 1. Importa esto

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // 2. Agrega esta configuración aquí:
      withInMemoryScrolling({ 
        scrollPositionRestoration: 'top' 
      })
    )
  ]
};