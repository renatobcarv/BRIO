import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
export default [
  { ignores: [".next/**", "node_modules/**", "public/**", "scripts/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { rules: {
    "@next/next/no-img-element": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
  } },
];
