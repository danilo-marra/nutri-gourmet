/** @type {import("next").NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/status",
        destination: "/api/v1/status",
      },
    ];
  },
  webpack(config) {
    // Allow .js imports to resolve to .ts counterparts during incremental TS migration.
    // Same semantics as jest.resolver.cjs: .js → try .ts first, fall back to .js.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

module.exports = nextConfig;
