/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_IMS_SCOPE: string;
    readonly VITE_IMS_CLIENT_ID: string;
    readonly VITE_IMS_ENV: string;
    readonly VITE_ADOBE_STOCK_API_KEY: string;
    readonly VITE_ADOBE_STOCK_CLIENT_ID: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
