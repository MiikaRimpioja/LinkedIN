import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { provideServiceWorker } from '@angular/service-worker';
import { isDevMode } from '@angular/core';

const config = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    ...(!isDevMode() ? [provideServiceWorker('ngsw-worker.js')] : []),
  ],
};

bootstrapApplication(App, config).catch((err) => console.error(err));
