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
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/naming-convention": [ 
            "error",
            {
                "selector": "default",
                "format": ["camelCase"]
            },
            {
                "selector": ["class", "interface", "enum"],
                "format": ["PascalCase"]
            },
            {
                "selector": ["enumMember", "variable", "property", "method"],
                "format": ["UPPER_CASE", "camelCase"],
                "leadingUnderscore": "allow"
            }
        ],
        "@typescript-eslint/semi": ["error", "always"],
        "@typescript-eslint/quotes": [
            "error",
            "single",
            {
                "allowTemplateLiterals": true,
                "avoidEscape": true
            }
        ],
        "@typescript-eslint/no-shadow": "error",
        "@typescript-eslint/no-redeclare": "error",
        "no-async-promise-executor": "off",
        "no-redeclare": "off",
        "no-duplicate-case": "error",
        "no-shadow": "off",
        "curly": "error",
        "semi": "off",
        "eqeqeq": ["error", "always"],
        "quotes": "off",
        "no-debugger": "error",
        "no-empty": "error",
        "no-var": "error",
        "no-unsafe-finally": "error",
        "new-parens": "error",
        "no-throw-literal": "error",
        "no-useless-catch": "off"
    }
}