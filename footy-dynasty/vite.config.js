import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // npm sets npm_lifecycle_event=test for `npm test`. Skipping the React plugin avoids Vitest worker OOM.
  plugins: process.env.npm_lifecycle_event === 'test' ? [] : [react()],
  test: {
    environment: 'node',
    globals: true,
    // More throughput locally; keep CI predictable (GitHub Actions sets CI=true).
    maxWorkers: process.env.CI ? 4 : '75%',
  },
})
