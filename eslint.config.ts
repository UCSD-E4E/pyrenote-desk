import type { Linter } from "eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "unused-imports/no-unsued-imports": "error",
    },
  },
] satisfies Linter.Config[];
