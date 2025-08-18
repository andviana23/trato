// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript"), {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@chakra-ui/react",
            message: "Use shadcn/ui + Radix + Tailwind",
          },
          { name: "@chakra-ui/next-js", message: "Removido" },
          { name: "@emotion/react", message: "Removido" },
          { name: "@emotion/styled", message: "Removido" },
        ],
      },
    ],
  },
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
