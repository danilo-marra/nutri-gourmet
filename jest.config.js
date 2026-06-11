const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config({ path: ".env.development" }));

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 30000,
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.claude/"],
  // Custom resolver: falls back from .js to .ts when the .js file doesn't exist.
  // Required because infra/ files were converted to .ts while importers still
  // use explicit .js extensions (TypeScript ESM convention).
  resolver: "<rootDir>/jest.resolver.cjs",
});

module.exports = jestConfig;
