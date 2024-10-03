// @ts-check

import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import tseslint from "typescript-eslint"

const customRules = {
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-unused-expressions": "off",
  },
}

export default [
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      ignores: ["build/**", "scripts/**"],
    },
  ),
  eslintConfigPrettier,
  customRules,
]
