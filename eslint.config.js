import js from '@eslint/js';

export default [
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: 2024,
			sourceType: 'module',
			globals: {
				// Node.js globals
				Buffer: 'readonly',
				console: 'readonly',
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
			}
		},
		rules: {
			// Indentation: tabs with 4-width
			'indent': [ 'error', 'tab', { SwitchCase: 1 } ],
			'no-mixed-spaces-and-tabs': 'error',

			// Semicolons
			'semi': [ 'error', 'always' ],

			// Quotes
			'quotes': [ 'error', 'single', { avoidEscape: true } ],

			// Spacing
			'space-before-function-paren': [ 'error', {
				anonymous: 'always',
				named: 'never',
				asyncArrow: 'always'
			} ],
			'keyword-spacing': [ 'error', { before: true, after: true } ],
			'space-infix-ops': 'error',
			'space-before-blocks': 'error',
			'object-curly-spacing': [ 'error', 'always' ],
			'array-bracket-spacing': [ 'error', 'always' ],
			'comma-spacing': [ 'error', { before: false, after: true } ],

			// Line breaks
			'eol-last': [ 'error', 'always' ],
			'no-multiple-empty-lines': [ 'error', { max: 1, maxEOF: 0 } ],
			'no-trailing-spaces': 'error',

			// Best practices
			'no-unused-vars': [ 'error', { argsIgnorePattern: '^_' } ],
			'no-console': 'off',
			'eqeqeq': [ 'error', 'always' ],
			'curly': [ 'error', 'all' ],
			'brace-style': [ 'error', '1tbs' ],
			'no-var': 'error',
			'prefer-const': 'error',
			'prefer-arrow-callback': 'error',

			// ES6+
			'arrow-spacing': [ 'error', { before: true, after: true } ],
			'no-duplicate-imports': 'error',
		}
	}
];
