/// <reference types="vite/client" />

declare module "virtual:uno.css";

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
