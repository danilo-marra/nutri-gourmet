/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    // Allow .js imports to resolve to .ts counterparts (TypeScript ESM convention).
    // Same semantics as jest.resolver.cjs. All app-code .js imports are bare
    // specifiers under infra/ or models/, whose targets are .ts after the TS migration.
    resolveAlias: {
      "infra/*.js": "./infra/*.ts",
      "models/*.js": "./models/*.ts",
    },
  },
  async rewrites() {
    return [
      {
        source: "/status",
        destination: "/api/v1/status",
      },
    ];
  },
};

module.exports = nextConfig;
