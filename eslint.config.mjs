// <your-project-root>/eslint.config.mjs
import nxPlugin from "@nx/eslint-plugin";
import jsoncParser from "jsonc-eslint-parser";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.nx/**",
      "**/.cursor/**",
      "**/.github/**",
      "**/.vscode/**",
      "**/.idea/**",
    ],
  },
  ...nxPlugin.configs["flat/base"],
  ...nxPlugin.configs["flat/typescript"],
  ...nxPlugin.configs["flat/javascript"],
  {
    files: ["**/*.json"],
    languageOptions: {
      parser: jsoncParser,
    },
    rules: {
      "@nx/dependency-checks": [
        "error",
        {
          ignoredFiles: [
            "*.{config,test,spec}.{js,ts,cts,mts,cjs,mjs}",
          ],
        },
      ],
    },
  },
  // ... more ESLint config here
];
