import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react({
    jsx: {
      transform: {
        react: {
          throwIfNamespace: false, // Отключить проверку пространств имен
        },
      },
    },
  })],
  base: "/testCGS/"
});