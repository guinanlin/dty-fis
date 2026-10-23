import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, eslintConfigPrettier, {
  plugins: { "unused-imports": unusedImports },

  rules: {
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/set-state-in-effect": "off",
  }
}, {
  files: ["**/*.js"],
  rules: {
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-this-alias": "off",
  },
}, {
  ignores: ["components/ui/*", "tailwind.config.js", "watcher.js", "postcss.config.js"]
}];

export default eslintConfig;
