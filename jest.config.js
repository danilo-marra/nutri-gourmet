const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
dotenvExpand.expand(dotenv.config({ path: ".env.development" }));

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 6000,
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.claude/"],
});

module.exports = jestConfig;
