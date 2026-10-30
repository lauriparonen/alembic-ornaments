import { defineConfig } from 'vitest/config'

// Node by default: the drawing snapshots are hashes of Node's output.
// The React tests opt into jsdom with a docblock.
export default defineConfig({
  test: {
    include: ['test/**/*.test.{ts,tsx}'],
  },
})
