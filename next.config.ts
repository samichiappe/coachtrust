import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ENABLE_REAL_XRPL: process.env.ENABLE_REAL_XRPL,
    XUMM_APIKEY: process.env.XUMM_APIKEY,
    XUMM_APISECRET: process.env.XUMM_APISECRET,
  }
};

export default nextConfig;
