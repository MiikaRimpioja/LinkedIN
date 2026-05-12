import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://d1d492fzsktwwi.cloudfront.net',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
