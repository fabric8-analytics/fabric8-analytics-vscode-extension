module.exports = {
    "root": true,
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "rules": {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-duplicate-enum-values": "error",
        "no-async-promise-executor": "warn",
        "curly": "error",
        "no-debugger": "error",
        "no-empty": "error",
        "no-unsafe-finally": "error",
        "new-parens": "error",
        "no-duplicate-case": "error",
    }
}