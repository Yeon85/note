import { defineConfig, loadEnv } from 'vite';
import externalGlobals from 'rollup-plugin-external-globals';

const config = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const fontProxyTarget = env.VITE_FONT_PROXY_TARGET || 'http://localhost:5174';
  const fontProxyPath = env.VITE_FONT_PROXY_PATH || '/font';
  const devPort = env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : undefined;

  return {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      host: env.VITE_DEV_HOST || undefined,
      port: Number.isFinite(devPort) ? devPort : undefined,
      proxy: {
        '/examples/font': {
          target: fontProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/examples\/font/, fontProxyPath),
        },
      },
    },

    plugins: [
      externalGlobals({
        jquery: '$',
      }),
    ],

    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
        },
      },
    },

    build: {
      rollupOptions: {
        input: {
          main: './index.html',
        },
        output: {
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
          chunkFileNames: `[name].js`,
          external: ['jquery'],
        },
      },
    },
  };
});

export default config;