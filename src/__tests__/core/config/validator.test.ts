import { ValidationEngine } from '../../../core/config/validator';
import { Framework, Language, PackageManager, TemplateType } from '../../../types/enums';
import { ProjectConfig, UserSelections } from '../../../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ValidationEngine', () => {
  let validator: ValidationEngine;
  let tempDir: string;

  beforeEach(() => {
    validator = new ValidationEngine();
    tempDir = path.join(__dirname, 'temp-test-dir');
  });

  afterEach(async () => {
    // Clean up temp directory if it exists
    if (fs.existsSync(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('validateUserSelections', () => {
    it('should validate correct user selections', () => {
      const selections: UserSelections = {
        projectName: 'my-project',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        includeTailwind: true,
        includeZustand: false,
        includeTanStackQuery: true,
        includeESLint: true,
        includePrettier: true,
        packageManager: PackageManager.NPM,
        initializeGit: true
      };

      const result = validator.validateUserSelections(selections);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid project names', () => {
      const selections: UserSelections = {
        projectName: 'invalid name with spaces',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        includeTailwind: false,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: false,
        includePrettier: false,
        packageManager: PackageManager.NPM,
        initializeGit: false
      };

      const result = validator.validateUserSelections(selections);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('projectName');
      expect(result.errors[0].message).toContain('letters, numbers, hyphens, and underscores');
    });

    it('should reject reserved project names', () => {
      const selections: UserSelections = {
        projectName: 'con',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        includeTailwind: false,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: false,
        includePrettier: false,
        packageManager: PackageManager.NPM,
        initializeGit: false
      };

      const result = validator.validateUserSelections(selections);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PROJECT_NAME_RESERVED');
    });

    it('should reject project names starting with dots or hyphens', () => {
      const invalidNames = ['.hidden', '-invalid'];
      
      invalidNames.forEach(name => {
        const selections: UserSelections = {
          projectName: name,
          framework: Framework.NEXTJS,
          template: TemplateType.MINIMAL,
          language: Language.TYPESCRIPT,
          includeTailwind: false,
          includeZustand: false,
          includeTanStackQuery: false,
          includeESLint: false,
          includePrettier: false,
          packageManager: PackageManager.NPM,
          initializeGit: false
        };

        const result = validator.validateUserSelections(selections);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].code).toBe('PROJECT_NAME_INVALID_START');
      });
    });

    it('should detect incompatible framework-template combinations', () => {
      const selections: UserSelections = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.BASIC_SPA, // React + Vite template with Next.js
        language: Language.TYPESCRIPT,
        includeTailwind: false,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: false,
        includePrettier: false,
        packageManager: PackageManager.NPM,
        initializeGit: false
      };

      const result = validator.validateUserSelections(selections);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('TEMPLATE_FRAMEWORK_INCOMPATIBLE');
    });

    it('should provide warnings for potentially conflicting options', () => {
      const selections: UserSelections = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        includeTailwind: false,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: true,
        includePrettier: true, // Both ESLint and Prettier
        packageManager: PackageManager.NPM,
        initializeGit: false
      };

      const result = validator.validateUserSelections(selections);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('POTENTIAL_CONFIG_CONFLICT');
    });
  });

  describe('validateProjectName', () => {
    it('should validate available directory names', async () => {
      await fs.ensureDir(tempDir);
      
      const result = validator.validateProjectName('new-project', tempDir);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect existing non-empty directories', async () => {
      await fs.ensureDir(tempDir);
      const existingDir = path.join(tempDir, 'existing-project');
      await fs.ensureDir(existingDir);
      await fs.writeFile(path.join(existingDir, 'file.txt'), 'content');

      const result = validator.validateProjectName('existing-project', tempDir);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('DIRECTORY_NOT_EMPTY');
    });

    it('should warn about existing empty directories', async () => {
      await fs.ensureDir(tempDir);
      const existingDir = path.join(tempDir, 'empty-project');
      await fs.ensureDir(existingDir);

      const result = validator.validateProjectName('empty-project', tempDir);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('DIRECTORY_EXISTS_EMPTY');
    });

    it('should detect existing files with same name', async () => {
      await fs.ensureDir(tempDir);
      await fs.writeFile(path.join(tempDir, 'existing-file'), 'content');

      const result = validator.validateProjectName('existing-file', tempDir);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('FILE_EXISTS');
    });
  });

  describe('validateOptionCompatibility', () => {
    it('should validate compatible configurations', () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        styling: { includeTailwind: true },
        stateManagement: { includeZustand: false },
        dataFetching: { includeTanStackQuery: true },
        devTools: { includeESLint: true, includePrettier: false },
        packageManager: PackageManager.NPM,
        gitInit: true
      };

      const result = validator.validateOptionCompatibility(config);
      expect(result.isValid).toBe(true);
    });

    it('should provide helpful warnings for template-specific recommendations', () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.DASHBOARD,
        language: Language.TYPESCRIPT,
        styling: { includeTailwind: false }, // Dashboard without Tailwind
        stateManagement: { includeZustand: false },
        dataFetching: { includeTanStackQuery: false },
        devTools: { includeESLint: false, includePrettier: false },
        packageManager: PackageManager.NPM,
        gitInit: true
      };

      const result = validator.validateOptionCompatibility(config);
      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'RECOMMENDED_TAILWIND_FOR_DASHBOARD')).toBe(true);
    });
  });

  describe('formatValidationResults', () => {
    it('should format validation results with errors and warnings', () => {
      const result = {
        isValid: false,
        errors: [
          { field: 'projectName', message: 'Invalid project name', code: 'INVALID_NAME' }
        ],
        warnings: [
          { field: 'devTools', message: 'Consider using ESLint', code: 'RECOMMENDED_ESLINT' }
        ]
      };

      const formatted = validator.formatValidationResults(result);
      expect(formatted).toContain('❌ Validation Errors:');
      expect(formatted).toContain('⚠️  Warnings:');
      expect(formatted.some(msg => msg.includes('Invalid project name'))).toBe(true);
      expect(formatted.some(msg => msg.includes('Consider using ESLint'))).toBe(true);
    });

    it('should format successful validation', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: []
      };

      const formatted = validator.formatValidationResults(result);
      expect(formatted).toContain('✅ Configuration is valid');
    });
  });

  describe('validateSystemRequirements', () => {
    it('should validate Node.js version requirements', () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        styling: { includeTailwind: false },
        stateManagement: { includeZustand: false },
        dataFetching: { includeTanStackQuery: false },
        devTools: { includeESLint: false, includePrettier: false },
        packageManager: PackageManager.NPM,
        gitInit: false
      };

      const result = validator.validateSystemRequirements(config);
      
      // Should pass on Node 18+ (which is our test environment)
      expect(result.isValid).toBe(true);
    });

    it('should warn about package manager availability', () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        language: Language.TYPESCRIPT,
        styling: { includeTailwind: false },
        stateManagement: { includeZustand: false },
        dataFetching: { includeTanStackQuery: false },
        devTools: { includeESLint: false, includePrettier: false },
        packageManager: PackageManager.YARN,
        gitInit: false
      };

      const result = validator.validateSystemRequirements(config);
      expect(result.warnings.some(w => w.code === 'PACKAGE_MANAGER_AVAILABILITY_CHECK')).toBe(true);
    });
  });
});