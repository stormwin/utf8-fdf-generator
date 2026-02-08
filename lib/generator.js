/**
 * UTF-8 FDF Generator
 * Generates FDF files with full Unicode support using UTF-16BE encoding.
 */

import { writeFile } from 'node:fs/promises';

/**
 * FDF header bytes:
 * - %FDF-1.2 version identifier
 * - High-byte characters (âãÏÓ) to indicate binary content
 * - Object structure opening
 */
const FDF_HEADER = Buffer.from(
	'%FDF-1.2\n' +
  '\xE2\xE3\xCF\xD3\n' +
  '1 0 obj \n' +
  '<<\n' +
  '/FDF \n' +
  '<<\n' +
  '/Fields [\n',
	'latin1'
);

/**
 * FDF footer bytes:
 * - Close Fields array and FDF dictionary
 * - End object and trailer
 */
const FDF_FOOTER = Buffer.from(
	']\n' +
  '>>\n' +
  '>>\n' +
  'endobj \n' +
  'trailer\n' +
  '\n' +
  '<<\n' +
  '/Root 1 0 R\n' +
  '>>\n' +
  '%%EOF\n',
	'latin1'
);

/** UTF-16BE Byte Order Mark */
const UTF16BE_BOM = Buffer.from([ 0xFE, 0xFF ]);

/**
 * Converts a string to UTF-16BE encoding with BOM prefix.
 * This is required for proper Unicode support in FDF files.
 *
 * @param {string} str - The string to encode
 * @returns {Buffer} UTF-16BE encoded buffer with BOM
 */
function toUtf16BE(str) {
	if (!str) {
		return Buffer.alloc(0);
	}

	// Convert string to UTF-16BE
	const utf16 = Buffer.alloc(str.length * 2);
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i);
		// Big-endian: high byte first
		utf16[i * 2] = (code >> 8) & 0xFF;
		utf16[i * 2 + 1] = code & 0xFF;
	}

	return Buffer.concat([ UTF16BE_BOM, utf16 ]);
}

/**
 * Escapes special characters in FDF string values.
 * Parentheses and backslashes must be escaped in FDF format.
 *
 * @param {string} str - The string to escape
 * @returns {string} Escaped string safe for FDF
 */
function escapeFdfString(str) {
	if (typeof str !== 'string') {
		return String(str ?? '');
	}
	// Escape backslashes first, then parentheses
	return str
		.replace(/\\/g, '\\\\')
		.replace(/\(/g, '\\(')
		.replace(/\)/g, '\\)');
}

/**
 * Checks if a string contains only ASCII characters.
 *
 * @param {string} str - The string to check
 * @returns {boolean} True if string is ASCII-only
 */
function isAscii(str) {
	for (let i = 0; i < str.length; i++) {
		if (str.charCodeAt(i) > 127) {
			return false;
		}
	}
	return true;
}

/**
 * Encodes a field value for FDF format.
 * Uses UTF-16BE for non-ASCII strings, plain ASCII otherwise.
 *
 * @param {string} value - The value to encode
 * @returns {Buffer} Encoded value buffer
 */
function encodeFieldValue(value) {
	const strValue = String(value ?? '');

	if (isAscii(strValue)) {
		// ASCII-only: use escaped string directly
		return Buffer.from(escapeFdfString(strValue), 'latin1');
	}

	// Non-ASCII: use UTF-16BE encoding
	// Note: For UTF-16BE encoded strings, we need to escape at the byte level
	return toUtf16BE(escapeFdfString(strValue));
}

/**
 * Builds a single FDF field entry.
 *
 * @param {string} name - Field name
 * @param {string|boolean} value - Field value
 * @returns {Buffer} FDF field buffer
 */
function buildField(name, value) {
	const parts = [
		Buffer.from('<<\n/T (', 'latin1'),
		encodeFieldValue(name),
		Buffer.from(')\n/V (', 'latin1'),
		encodeFieldValue(value),
		Buffer.from(')\n>>\n', 'latin1')
	];

	return Buffer.concat(parts);
}

/**
 * Generates FDF content from field data.
 *
 * @param {Record<string, string|boolean>} data - Object with field names and values
 * @returns {Buffer} Complete FDF file content
 */
export function generateFdf(data) {
	if (!data || typeof data !== 'object') {
		throw new TypeError('Data must be a non-null object');
	}

	const entries = Object.entries(data);
	const fieldBuffers = entries.map(([ name, value ]) => buildField(name, value));

	return Buffer.concat([
		FDF_HEADER,
		...fieldBuffers,
		FDF_FOOTER
	]);
}

/**
 * Generates an FDF file and writes it to disk.
 *
 * @param {Record<string, string|boolean>} data - Object with field names and values
 * @param {string} fileName - Output file path
 * @returns {Promise<void>} Resolves when file is written
 * @throws {TypeError} If data is not an object or fileName is not a string
 *
 * @example
 * import { generator } from 'utf8-fdf-generator';
 *
 * await generator({
 *   name: 'José García',
 *   city: '東京',
 *   notes: 'Special chars: (parentheses) and \\backslash'
 * }, 'output.fdf');
 */
export async function generator(data, fileName) {
	if (typeof fileName !== 'string' || !fileName) {
		throw new TypeError('fileName must be a non-empty string');
	}

	const fdfContent = generateFdf(data);
	await writeFile(fileName, fdfContent);
}

/**
 * Synchronous version that returns FDF content as a Buffer.
 * Useful when you don't need to write to a file.
 *
 * @param {Record<string, string|boolean>} data - Object with field names and values
 * @returns {Buffer} FDF file content
 *
 * @example
 * import { generateFdfBuffer } from 'utf8-fdf-generator';
 *
 * const buffer = generateFdfBuffer({ field1: 'value1' });
 * // Use buffer as needed (e.g., send as HTTP response)
 */
export function generateFdfBuffer(data) {
	return generateFdf(data);
}

// Default export for convenience
export default generator;
