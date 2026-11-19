import { fileURLToPath } from 'node:url';

// Node 后端共享配置；密钥放在 secrets.mjs，不提交 Git。
export const PORT = Number(process.env.PORT || 3000);
export const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url));

export const CLOUD_ENDPOINT = 'https://rtings-score-workbench.app.workbuddy.host';
export const CLOUD_OAUTH_RELAY = 'https://www.workbuddy.cn/v2/as/genie-baas/oauth';
export const CLOUD_PUBLISHABLE_KEY = 'wbpk_rA0i84BMgp4SbpWeJ6Capl_2v3398kTvA7fu4hLcSmDnAXc5C3fC9d8';
