import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config([
  tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    files: ["main/**/*.ts", "renderer/**/*.tsx", "renderer/**/*.ts{,x}"],
    rules: {
      "unused-imports/no-unused-imports": "error",
    },
  },
  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);
