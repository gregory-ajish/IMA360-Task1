// vite.config.js
// PURPOSE: Configuration file for Vite — the build tool and dev server for this project.
//
// Vite is responsible for:
//   - Running the local development server (npm run dev → localhost:5173)
//   - Bundling the app into optimized files for production (npm run build)
//   - Transforming JSX, modern JS, and CSS during development

// https://vite.dev/config/ — official Vite config documentation
import { defineConfig } from 'vite';

// @vitejs/plugin-react enables React support in Vite:
//   - Transforms JSX syntax (e.g. <div />) into regular JavaScript
//   - Enables React Fast Refresh (live updates in the browser without full page reload)
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(), // Register the React plugin — required for any React + Vite project
  ],
});
