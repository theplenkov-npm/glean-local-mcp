import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/authenticate.ts',
    'src/proxy/fetch-interceptor.ts'
  ],
  format: 'esm',
  outDir: 'dist',
  clean: true,
  dts: false,
  sourcemap: true,
  target: 'es2022',
  platform: 'node',
  external: ['open', '@gleanwork/local-mcp-server', 'undici'],
  exports: true
});
