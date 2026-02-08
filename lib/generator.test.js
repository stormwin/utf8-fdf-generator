import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generator, generateFdf, generateFdfBuffer } from './generator.js';

const TEST_DIR = join(tmpdir(), 'utf8-fdf-generator-test');

describe('utf8-fdf-generator', () => {
	before(async () => {
		if (!existsSync(TEST_DIR)) {
			await mkdir(TEST_DIR, { recursive: true });
		}
	});

	describe('generateFdf', () => {
		it('should generate valid FDF structure', () => {
			const result = generateFdf({ field1: 'value1' });
			const content = result.toString('latin1');

			assert.ok(content.startsWith('%FDF-1.2'), 'Should start with FDF version');
			assert.ok(content.includes('/Fields ['), 'Should contain Fields array');
			assert.ok(content.includes('/T ('), 'Should contain field name marker');
			assert.ok(content.includes('/V ('), 'Should contain field value marker');
			assert.ok(content.endsWith('%%EOF\n'), 'Should end with EOF marker');
		});

		it('should handle empty data object', () => {
			const result = generateFdf({});
			const content = result.toString('latin1');

			assert.ok(content.startsWith('%FDF-1.2'));
			assert.ok(content.includes('/Fields ['));
			assert.ok(content.endsWith('%%EOF\n'));
		});

		it('should handle multiple fields', () => {
			const result = generateFdf({
				field1: 'value1',
				field2: 'value2',
				field3: 'value3'
			});
			const content = result.toString('latin1');

			// Count field entries
			const fieldCount = (content.match(/\/T \(/g) || []).length;
			assert.equal(fieldCount, 3, 'Should contain 3 fields');
		});

		it('should throw TypeError for null data', () => {
			assert.throws(() => generateFdf(null), {
				name: 'TypeError',
				message: 'Data must be a non-null object'
			});
		});

		it('should throw TypeError for non-object data', () => {
			assert.throws(() => generateFdf('string'), {
				name: 'TypeError',
				message: 'Data must be a non-null object'
			});
		});

		it('should throw TypeError for undefined data', () => {
			assert.throws(() => generateFdf(undefined), {
				name: 'TypeError',
				message: 'Data must be a non-null object'
			});
		});
	});

	describe('ASCII handling', () => {
		it('should handle ASCII strings without BOM', () => {
			const result = generateFdf({ name: 'John Doe' });
			const content = result.toString('latin1');

			// ASCII values should be directly readable
			assert.ok(content.includes('John Doe'), 'ASCII value should be readable');
		});

		it('should handle numbers', () => {
			const result = generateFdf({ age: 42 });
			const content = result.toString('latin1');

			assert.ok(content.includes('42'), 'Number should be converted to string');
		});

		it('should handle boolean values', () => {
			const result = generateFdf({ active: true, disabled: false });
			const content = result.toString('latin1');

			assert.ok(content.includes('true'), 'Boolean true should be stringified');
			assert.ok(content.includes('false'), 'Boolean false should be stringified');
		});

		it('should handle null and undefined values', () => {
			const result = generateFdf({ nullField: null, undefinedField: undefined });

			// Should not throw
			assert.ok(Buffer.isBuffer(result));
		});
	});

	describe('Special character escaping', () => {
		it('should escape parentheses in values', () => {
			const result = generateFdf({ note: 'test (with parens)' });
			const content = result.toString('latin1');

			assert.ok(content.includes('\\('), 'Opening paren should be escaped');
			assert.ok(content.includes('\\)'), 'Closing paren should be escaped');
		});

		it('should escape backslashes in values', () => {
			const result = generateFdf({ path: 'C:\\Users\\test' });
			const content = result.toString('latin1');

			assert.ok(content.includes('\\\\'), 'Backslashes should be escaped');
		});

		it('should handle complex escaped strings', () => {
			const result = generateFdf({
				complex: 'test\\path\\to\\(file).txt'
			});

			// Should not throw and produce valid buffer
			assert.ok(Buffer.isBuffer(result));
		});

		it('should escape special chars in field names', () => {
			const result = generateFdf({ 'field(1)': 'value' });
			const content = result.toString('latin1');

			assert.ok(content.includes('\\('), 'Field name parens should be escaped');
		});
	});

	describe('Unicode/UTF-16BE encoding', () => {
		it('should encode non-ASCII characters with UTF-16BE BOM', () => {
			const result = generateFdf({ name: 'José' });

			// Check for UTF-16BE BOM (0xFE 0xFF)
			const bomIndex = result.indexOf(Buffer.from([ 0xFE, 0xFF ]));
			assert.ok(bomIndex !== -1, 'Should contain UTF-16BE BOM');
		});

		it('should handle Spanish characters', () => {
			const result = generateFdf({
				city: 'Ciudad Juárez, México'
			});

			assert.ok(Buffer.isBuffer(result));
			assert.ok(result.indexOf(Buffer.from([ 0xFE, 0xFF ])) !== -1);
		});

		it('should handle Japanese characters', () => {
			const result = generateFdf({
				city: '東京',
				greeting: 'こんにちは'
			});

			assert.ok(Buffer.isBuffer(result));

			// Count BOMs - should have 2 (one for each non-ASCII value)
			let bomCount = 0;
			let searchStart = 0;
			const bom = Buffer.from([ 0xFE, 0xFF ]);
			while (true) {
				const idx = result.indexOf(bom, searchStart);
				if (idx === -1) {
					break;
				}
				bomCount++;
				searchStart = idx + 1;
			}
			assert.equal(bomCount, 2, 'Should have 2 UTF-16BE BOMs');
		});

		it('should handle Chinese characters', () => {
			const result = generateFdf({
				name: '张三',
				address: '北京市朝阳区'
			});

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle Arabic characters', () => {
			const result = generateFdf({
				name: 'محمد',
				city: 'القاهرة'
			});

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle Cyrillic characters', () => {
			const result = generateFdf({
				name: 'Иван',
				city: 'Москва'
			});

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle mixed ASCII and Unicode', () => {
			const result = generateFdf({
				asciiField: 'plain english',
				unicodeField: 'café résumé',
				mixedField: 'Hello 世界'
			});

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle emoji', () => {
			// Note: Emoji may require surrogate pairs in UTF-16
			const result = generateFdf({
				mood: '😀',
				status: 'Working 🚀'
			});

			assert.ok(Buffer.isBuffer(result));
		});
	});

	describe('generator (file writing)', () => {
		it('should write FDF file to disk', async () => {
			const filePath = join(TEST_DIR, 'test-output.fdf');

			await generator({ field1: 'value1' }, filePath);

			const content = await readFile(filePath);
			assert.ok(content.toString('latin1').startsWith('%FDF-1.2'));

			await unlink(filePath);
		});

		it('should write Unicode content to file', async () => {
			const filePath = join(TEST_DIR, 'test-unicode.fdf');

			await generator({
				name: 'José García',
				city: '東京'
			}, filePath);

			const content = await readFile(filePath);
			assert.ok(content.indexOf(Buffer.from([ 0xFE, 0xFF ])) !== -1);

			await unlink(filePath);
		});

		it('should throw TypeError for empty fileName', async () => {
			await assert.rejects(
				generator({ field: 'value' }, ''),
				{
					name: 'TypeError',
					message: 'fileName must be a non-empty string'
				}
			);
		});

		it('should throw TypeError for non-string fileName', async () => {
			await assert.rejects(
				generator({ field: 'value' }, 123),
				{
					name: 'TypeError',
					message: 'fileName must be a non-empty string'
				}
			);
		});

		it('should throw TypeError for null fileName', async () => {
			await assert.rejects(
				generator({ field: 'value' }, null),
				{
					name: 'TypeError',
					message: 'fileName must be a non-empty string'
				}
			);
		});
	});

	describe('generateFdfBuffer', () => {
		it('should return same result as generateFdf', () => {
			const data = { field1: 'value1', field2: 'ñoño' };

			const result1 = generateFdf(data);
			const result2 = generateFdfBuffer(data);

			assert.ok(result1.equals(result2));
		});
	});

	describe('FDF format compliance', () => {
		it('should have correct FDF header structure', () => {
			const result = generateFdf({ test: 'value' });
			const content = result.toString('latin1');

			assert.ok(content.includes('%FDF-1.2\n'));
			assert.ok(content.includes('1 0 obj'));
			assert.ok(content.includes('/FDF'));
			assert.ok(content.includes('/Fields ['));
		});

		it('should have correct FDF footer structure', () => {
			const result = generateFdf({ test: 'value' });
			const content = result.toString('latin1');

			assert.ok(content.includes('endobj'));
			assert.ok(content.includes('trailer'));
			assert.ok(content.includes('/Root 1 0 R'));
			assert.ok(content.includes('%%EOF'));
		});

		it('should have binary indicator bytes in header', () => {
			const result = generateFdf({ test: 'value' });

			// Check for high-byte characters after version line
			// 0xE2, 0xE3, 0xCF, 0xD3 (â, ã, Ï, Ó in latin1)
			const binaryMarker = Buffer.from([ 0xE2, 0xE3, 0xCF, 0xD3 ]);
			assert.ok(result.indexOf(binaryMarker) !== -1);
		});
	});

	describe('Edge cases', () => {
		it('should handle empty string values', () => {
			const result = generateFdf({ emptyField: '' });
			const content = result.toString('latin1');

			assert.ok(content.includes('/V ()'));
		});

		it('should handle very long field names', () => {
			const longName = 'a'.repeat(1000);
			const result = generateFdf({ [ longName ]: 'value' });

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle very long values', () => {
			const longValue = 'x'.repeat(10000);
			const result = generateFdf({ field: longValue });

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle many fields', () => {
			const data = {};
			for (let i = 0; i < 100; i++) {
				data[ `field${i}` ] = `value${i}`;
			}

			const result = generateFdf(data);
			const content = result.toString('latin1');

			const fieldCount = (content.match(/\/T \(/g) || []).length;
			assert.equal(fieldCount, 100);
		});

		it('should handle newlines in values', () => {
			const result = generateFdf({
				multiline: 'line1\nline2\nline3'
			});

			assert.ok(Buffer.isBuffer(result));
		});

		it('should handle tabs in values', () => {
			const result = generateFdf({
				tabbed: 'col1\tcol2\tcol3'
			});

			assert.ok(Buffer.isBuffer(result));
		});
	});
});
