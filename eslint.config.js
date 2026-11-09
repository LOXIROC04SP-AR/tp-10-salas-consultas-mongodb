const js = require("@eslint/js");

const globalesNode = {
  require: "readonly",
  module: "writable",
  process: "readonly",
  console: "readonly",
  __dirname: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
};

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globalesNode,
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^(next|req|res)$" }],
    },
  },
];
