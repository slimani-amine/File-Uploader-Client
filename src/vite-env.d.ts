/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAX_CONCURRENT_UPLOADS: string;
  readonly VITE_MAX_RETRY_ATTEMPTS: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
