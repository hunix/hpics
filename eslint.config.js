import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/integrations/supabase/types",
              message:
                "Import from '@/types/database-helpers' instead — the monolithic types file kills IDE performance.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.property.name='functions'][callee.property.name='invoke']",
          message:
            "Use invokeFunction() from '@/lib/api' instead of supabase.functions.invoke(). The adapter handles routing, circuit-breaking, and health metrics. Pass custom headers via the adapter's options.",
        },
      ],
    },
  },
  {
    // Adapter and bootstrap files are allowed to call supabase.functions.invoke directly.
    files: [
      "src/lib/api/**/*.{ts,tsx}",
      "src/main.tsx",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
