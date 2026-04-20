/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TOKEN_STORAGE_KEY: string;
  readonly VITE_DEFAULT_UNIT: 'mm' | 'pt' | 'px';
  readonly VITE_DEFAULT_PAGE_WIDTH: string;
  readonly VITE_DEFAULT_PAGE_HEIGHT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
