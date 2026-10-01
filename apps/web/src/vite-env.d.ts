/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHROME_WEB_STORE_URL?: string;
  readonly VITE_CHROME_EXTENSION_ID?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
