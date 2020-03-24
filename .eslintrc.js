module.exports = {
  extends: ['airbnb-typescript/base'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    "import/prefer-default-export": "off",
    "max-len": "off",
    "no-restricted-syntax": "off",
    "import/no-duplicates": "off",
    "no-param-reassign":"off",
    "@typescript-eslint/no-throw-literal": "off",
    "class-methods-use-this": "off",
    "no-await-in-loop": "off",
    "max-classes-per-file": "off",
    "@typescript-eslint/camelcase": "off"
  }
};
