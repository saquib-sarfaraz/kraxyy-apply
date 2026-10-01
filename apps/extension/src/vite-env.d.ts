/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXTENSION_MOCK_MODE?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
