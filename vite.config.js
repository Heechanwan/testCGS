import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace 'repo-name' with your actual GitHub repository name
export default defineConfig({
  plugins: [react()],
  base: '/testCGS/', // Use your repository name, e.g., '/my-app/' (include trailing slash)
});