/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAX_CONCURRENT_UPLOADS: string;
  readonly VITE_MAX_RETRY_ATTEMPTS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
