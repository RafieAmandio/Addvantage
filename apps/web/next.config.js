const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship raw TypeScript source (no compiled dist/), so
  // Next has to transpile them itself. Without this, Vercel builds fail at
  // the first `import { ... } from "@tradevantage/shared"` with a SWC parse
  // error on the .ts source.
  transpilePackages: ["@tradevantage/shared", "@tradevantage/db"],
  // Tell Next the real workspace root so its file-trace collection doesn't
  // stop at apps/web and miss hoisted pnpm deps.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
};

module.exports = nextConfig;
