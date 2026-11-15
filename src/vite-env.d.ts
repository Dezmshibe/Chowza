/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: 'customer' | 'business';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
