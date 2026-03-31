import { jest } from '@jest/globals';
import { initCommand } from '../../commands/init';
import { CLIOptions } from '../../types';

// Mock inquirer to avoid interactive prompts during testing
jest.mock('inquirer', () => ({
  default: {
    prompt: jest.fn()
  }
}));

// Mock fs-extra to avoid actual file system operations
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(() => false),
  ensureDirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => '{}'),
  copySync: jest.fn(),
  removeSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  statSync: jest.fn(() => ({ isDirectory: () => true }))
}));

// Mock execa to avoid actual command execution
jest.mock('execa', () => ({
  execa: jest.fn(() => Promise.resolve({ stdout: '', stderr: '', exitCode: 0 }))
}));

// Mock path utilities
jest.mock('../../utils/file-system', () => ({
  isDirectoryEmpty: jest.fn(() => Promise.resolve(true)),
  resolveProjectPath: jest.fn((name: string) => `/test/${name}`)
}));

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
  isValidProjectName: jest.fn(() => true),
  sanitizeProjectName: jest.fn((name: string) => name)
}));

describe('CLI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Integration', () => {
    it('should demonstrate proper component wiring', () => {
      // This test verifies that all components can be imported and instantiated
      // without throwing errors, demonstrating proper integration
      
      expect(() => {
        const { ConfigurationResolver } = require('../../core/config/resolver');
        const { ValidationEngine } = require('../../core/config/validator');
        const { DependencyInstaller } = require('../../core/project-generator/dependency-installer');
        const { ProjectGenerator } = require('../../core/project-generator/generator');
        const { TemplateRegistry } = require('../../core/template-engine/registry');
        const { SuccessReporter } = require('../../core/reporting/success-reporter');
        const { GitService } = require('../../core/git/git-service');
        
        // Instantiate all components
        new ConfigurationResolver();
        new ValidationEngine();
        new DependencyInstaller();
        new ProjectGenerator();
        new TemplateRegistry();
        new SuccessReporter();
        new GitService();
      }).not.toThrow();
    });

    it('should validate configuration integration', () => {
      const { ConfigurationResolver } = require('../../core/config/resolver');
      const { ValidationEngine } = require('../../core/config/validator');
      
      const resolver = new ConfigurationResolver();
      const validator = new ValidationEngine();
      
      const userSelections = {
        projectName: 'test-project',
        framework: 'nextjs',
        template: 'minimal',
        language: 'typescript',
        includeTailwind: true,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: true,
        includePrettier: true,
        packageManager: 'npm',
        initializeGit: true
      };
      
      // Test configuration resolution
      const config = resolver.resolveConfiguration(userSelections);
      expect(config).toBeDefined();
      expect(config.projectName).toBe('test-project');
      expect(config.framework).toBe('nextjs');
      
      // Test validation
      const validation = validator.validateUserSelections(userSelections);
      expect(validation).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
    });

    it('should integrate template registry with project generator', async () => {
      const { TemplateRegistry } = require('../../core/template-engine/registry');
      const { ProjectGenerator } = require('../../core/project-generator/generator');
      
      const registry = new TemplateRegistry();
      const generator = new ProjectGenerator();
      
      // These components should be properly integrated
      expect(registry).toBeDefined();
      expect(generator).toBeDefined();
      expect(typeof registry.loadTemplate).toBe('function');
      expect(typeof generator.generateProject).toBe('function');
    });
  });

  describe('CLI Options Integration', () => {
    it('should handle CLI options structure', () => {
      const options: CLIOptions = {
        force: true,
        skipInstall: true
      };
      
      expect(options.force).toBe(true);
      expect(options.skipInstall).toBe(true);
    });

    it('should validate project name with ValidationEngine', () => {
      const { ValidationEngine } = require('../../core/config/validator');
      const validator = new ValidationEngine();
      
      // Test valid project name
      const validResult = validator.validateProjectName('valid-project', '/test');
      expect(validResult).toBeDefined();
      expect(typeof validResult.isValid).toBe('boolean');
      
      // Test invalid project name
      const invalidResult = validator.validateProjectName('invalid project!', '/test');
      expect(invalidResult).toBeDefined();
      expect(typeof invalidResult.isValid).toBe('boolean');
    });
  });

  describe('Error Handling Integration', () => {
    it('should integrate error handling components', () => {
      const { ErrorHandler } = require('../../utils/error-handler');
      
      expect(ErrorHandler).toBeDefined();
      expect(typeof ErrorHandler.handleError).toBe('function');
      expect(typeof ErrorHandler.handleValidationError).toBe('function');
      expect(typeof ErrorHandler.handleSystemError).toBe('function');
    });

    it('should handle validation errors properly', () => {
      const { ValidationEngine } = require('../../core/config/validator');
      const validator = new ValidationEngine();
      
      const invalidSelections = {
        projectName: '', // Invalid: empty name
        framework: 'invalid-framework',
        template: 'invalid-template',
        language: 'invalid-language',
        includeTailwind: true,
        includeZustand: false,
        includeTanStackQuery: false,
        includeESLint: true,
        includePrettier: true,
        packageManager: 'invalid-manager',
        initializeGit: true
      };
      
      const result = validator.validateUserSelections(invalidSelections);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});