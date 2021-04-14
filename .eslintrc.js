module.exports = {
  'env': {
    'node': true,
    'commonjs': true,
    'es2020': true,
    'jest': true,
  },
  'extends': ['eslint:recommended', 'google'],
  'parser': 'babel-eslint',
  'parserOptions': {
    'ecmaVersion': 11,
    'sourceType': 'module',
  },
  'rules': {},
  'overrides': [
    {
      'files': [
        '*.js',
        '**/*.js',
      ],
      'rules': {
        'require-jsdoc': 'off',
        'valid-jsdoc': 'off',
        'quotes': [
          'error',
          'single',
        ],
        'max-len': ['off', {'code': 150}],
      },
    },
  ],
};
