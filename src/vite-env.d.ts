/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_HERO_URL?: string;
  readonly VITE_SITE_LOGO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
