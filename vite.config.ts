
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  console.log('[Vite Meta env check]', {
    mode,
    metaKeys: Object.keys(env).filter((key) =>
      key.startsWith('VITE_META_')
    ),
    appIdLength: (env.VITE_META_APP_ID ?? '').trim().length,
    configIdLength: (
      env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID ?? ''
    ).trim().length,
  });

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
   server: {
  allowedHosts: [
    'hopkins-pty-fighting-recycling.trycloudflare.com',
  ],
  hmr: process.env.DISABLE_HMR !== 'true',
  watch: process.env.DISABLE_HMR === 'true' ? null : {},
},
  };
});
