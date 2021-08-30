module.exports = {
  "env": {
    "node": true,
    "commonjs": true,
    "es2020": true,
    "jest": true,
  },
  "extends": ["eslint:recommended", "google"],
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "ecmaVersion": 11,
    "sourceType": "module",
    "babelOptions": {
      "rootMode": "upward",
    },
  },
  "rules": {},
  "overrides": [
    {
      "files": [
        "*.js",
        "**/*.js",
      ],
      "rules": {
        "require-jsdoc": "off",
        "valid-jsdoc": "off",
        "quotes": [
          "error",
          "double",
        ],
        "max-len": ["off", {"code": 150}],
        "new-cap": "warn",
        "space-infix-ops": ["error", {"int32Hint": false}],
      },
    },
  ],
};
