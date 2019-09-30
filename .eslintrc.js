module.exports = {
    "extends": [
        "./node_modules/eslint-config-mattermost/.eslintrc.json",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    "parser": "@typescript-eslint/parser",
    "plugins": ["@typescript-eslint"],
    "env": {
        "jest": true
    },

    "rules": {
        "@typescript-eslint/camelcase": 0,
        "@typescript-eslint/no-undefined": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "no-prototype-builtins": 0,
        "no-mixed-operators": 0,
        "no-undefined": 0,
        "padding-line-between-statements": [
            "error",
            { blankLine: "always", prev: "function", next: "function" }
        ],
        "no-nested-ternary": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-use-before-define": 0,
        "max-lines": 0,
        "@typescript-eslint/no-var-requires": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
    },
    "overrides": [
        {
            "files": ["*.test.js"],
            "env": {
                "jest": true
            }
        }
    ]
}
