import * as fc from 'fast-check';
import { isValidProjectName } from '../../utils/validation';

// Feature: cli-scaffolding-tool, Property 8: Project Name Validation
describe('Project Name Validation', () => {
  describe('Property 8: Project Name Validation', () => {
    test('should reject names containing invalid directory characters', async () => {
      // **Validates: Requirements 14.2**
      await fc.assert(
        fc.asyncProperty(
          // Generate strings with invalid directory characters
          fc.string().filter(str => 
            str.length > 0 && 
            /[<>:"/\\|?*\s\x00-\x1f]/.test(str) // Invalid directory characters
          ),
          async (invalidName) => {
            const result = isValidProjectName(invalidName);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept valid directory names', async () => {
      // **Validates: Requirements 14.2**
      await fc.assert(
        fc.asyncProperty(
          // Generate valid directory names (alphanumeric, hyphens, underscores)
          fc.string({ 
            minLength: 1, 
            maxLength: 255 
          }).filter(str => 
            /^[a-zA-Z0-9_-]+$/.test(str) && 
            str.length > 0 && 
            str.length <= 255
          ),
          async (validName) => {
            const result = isValidProjectName(validName);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject empty names', async () => {
      // **Validates: Requirements 14.2**
      const result = isValidProjectName('');
      expect(result).toBe(false);
    });

    test('should reject names that are too long', async () => {
      // **Validates: Requirements 14.2**
      const longName = 'a'.repeat(256); // Exceeds 255 character limit
      const result = isValidProjectName(longName);
      expect(result).toBe(false);
    });

    test('should reject names with spaces', async () => {
      // **Validates: Requirements 14.2**
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }).filter(str => str.includes(' ')),
          async (nameWithSpaces) => {
            const result = isValidProjectName(nameWithSpaces);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should reject names with special characters', async () => {
      // **Validates: Requirements 14.2**
      const specialChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
      
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...specialChars),
          fc.string({ minLength: 1, maxLength: 10 }),
          async (specialChar, baseName) => {
            const nameWithSpecialChar = baseName + specialChar;
            const result = isValidProjectName(nameWithSpecialChar);
            expect(result).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should accept names with valid characters only', async () => {
      // **Validates: Requirements 14.2**
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constantFrom(
            ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')
          ), { minLength: 1, maxLength: 255 }).map(chars => chars.join('')),
          async (validName: string) => {
            const result = isValidProjectName(validName);
            expect(result).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});