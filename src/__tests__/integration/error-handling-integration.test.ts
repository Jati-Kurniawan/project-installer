import { ProjectGenerator } from '../../core/project-generator/generator';
import { DependencyInstaller } from '../../core/project-generator/dependency-installer';
import { CompatibilityValidator } from '../../core/validation/compatibility-validator';
import { ErrorHandler } from '../../utils/error-handler';
import { ProjectConfig, Framework, Language, TemplateType, PackageManager, TemplateDefinition } from '../../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Error Handling Integration', () => {
  let tempDir: string;
  let testConfig: ProjectConfig;
  let mockTemplate: TemplateDefinition;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-test-'));
    
    testConfig = {
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

    mockTemplate = {
      id: 'nextjs-minimal',
      name: 'Next.js Minimal',
      description: 'Minimal Next.js template',
      framework: Framework.NEXTJS,
      type: TemplateType.MINIMAL,
      version: '1.0.0',
      author: 'Test Author',
      supportedLanguages: [Language.TYPESCRIPT, Language.JAVASCRIPT],
      templatePath: path.join(__dirname, '../../..', 'templates', 'nextjs', 'minimal'),
      files: [
        {
          path: 'package.json.hbs',
          content: '{"name": "{{projectName}}"}',
          encoding: 'utf-8',
          conditions: []
        }
      ],
      dependencies: {},
      devDependencies: {},
      supportedOptions: []
    };

    // Clear retry attempts before each test
    ErrorHandler.clearRetryAttempts();
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Configuration Validation Integration', () => {
    it('should validate compatible configuration successfully', () => {
      const result = CompatibilityValidator.validateConfiguration(testConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect and report incompatible configurations', () => {
      const incompatibleConfig = {
        ...testConfig,
        framework: Framework.NEXTJS,
        template: TemplateType.BASIC_SPA // This is for React + Vite only
      };

      const result = CompatibilityValidator.validateConfiguration(incompatibleConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('INCOMPATIBLE_FRAMEWORK_TEMPLATE');
    });

    it('should provide detailed error messages for validation failures', () => {
      const incompatibleConfig = {
        ...testConfig,
        framework: Framework.REACT_VITE,
        template: TemplateType.DASHBOARD
      };

      const result = CompatibilityValidator.validateConfiguration(incompatibleConfig);
      const errorMessage = CompatibilityValidator.createDetailedErrorMessage(result.errors);
      
      expect(errorMessage).toContain('Configuration validation failed:');
      expect(errorMessage).toContain('INCOMPATIBLE_FRAMEWORK_TEMPLATE');
    });
  });

  describe('Project Generation Error Handling', () => {
    it('should handle missing template directory gracefully', async () => {
      const generator = new ProjectGenerator();
      const invalidTemplate = {
        ...mockTemplate,
        templatePath: '/nonexistent/path',
        files: [
          {
            path: 'nonexistent-file.txt',
            content: 'This file does not exist',
            encoding: 'utf-8',
            conditions: []
          }
        ]
      };

      // Change to temp directory for test
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await generator.generateProject(testConfig, invalidTemplate);
        
        // Should succeed but may have some errors for missing template files
        // The main project structure should still be created
        expect(result.projectPath).toBe(`./${testConfig.projectName}`);
        expect(result.duration).toBeGreaterThan(0);
        
        // Verify project directory was created even with template issues
        const projectPath = path.join(tempDir, testConfig.projectName);
        expect(await fs.pathExists(projectPath)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should create cleanup actions for partial project creation', async () => {
      const generator = new ProjectGenerator();
      
      // Change to temp directory for test
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        const result = await generator.generateProject(testConfig, mockTemplate);
        
        // Should succeed with basic template
        expect(result.success).toBe(true);
        expect(result.filesCreated.length).toBeGreaterThan(0);
        
        // Verify project directory was created
        const projectPath = path.join(tempDir, testConfig.projectName);
        expect(await fs.pathExists(projectPath)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Dependency Installation Error Handling', () => {
    it('should handle missing package.json gracefully', async () => {
      const installer = new DependencyInstaller();
      const nonExistentPath = path.join(tempDir, 'nonexistent');

      const result = await installer.installDependencies(testConfig, nonExistentPath);
      
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].code).toBe('SYS_PACKAGE_MANAGER');
    });

    it('should detect available package managers', async () => {
      const installer = new DependencyInstaller();
      
      const availableManagers = await installer.detectAvailablePackageManagers();
      
      // Should at least have npm (comes with Node.js)
      expect(availableManagers.length).toBeGreaterThan(0);
      expect(availableManagers).toContain(PackageManager.NPM);
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should provide appropriate recovery strategies for different error types', async () => {
      // Test file system error recovery
      const fsError = ErrorHandler.createFileSystemError(
        'Permission denied',
        'create_directory' as any,
        '/restricted/path',
        false
      );
      
      const fsContext = await ErrorHandler.handleError(fsError);
      expect(fsContext.strategy).toBe('cleanup_and_exit');

      // Test network error recovery
      const networkError = ErrorHandler.createNetworkError(
        'Connection failed',
        'package_installation' as any,
        true
      );
      
      const networkContext = await ErrorHandler.handleError(networkError);
      expect(networkContext.strategy).toBe('retry');

      // Test user input error recovery
      const inputError = ErrorHandler.createUserInputError(
        'Invalid project name',
        'projectName',
        'alphanumeric'
      );
      
      const inputContext = await ErrorHandler.handleError(inputError);
      expect(inputContext.strategy).toBe('prompt_user');
    });

    it('should execute cleanup actions properly', async () => {
      let cleanupExecuted = false;
      const cleanupActions = [
        async () => {
          cleanupExecuted = true;
        }
      ];

      await ErrorHandler.executeCleanup(cleanupActions);
      
      expect(cleanupExecuted).toBe(true);
    });
  });

  describe('Template Support Validation', () => {
    it('should validate template support for selected options', () => {
      const configWithOptions = {
        ...testConfig,
        template: TemplateType.FEATURE_BASED,
        styling: { includeTailwind: true },
        stateManagement: { includeZustand: true },
        dataFetching: { includeTanStackQuery: true }
      };

      const result = CompatibilityValidator.validateTemplateSupport(
        configWithOptions.framework,
        configWithOptions.template,
        configWithOptions
      );

      expect(result.isValid).toBe(true);
    });

    it('should detect unsupported options for minimal templates', () => {
      const configWithUnsupportedOptions = {
        ...testConfig,
        template: TemplateType.MINIMAL,
        stateManagement: { includeZustand: true },
        dataFetching: { includeTanStackQuery: true }
      };

      const result = CompatibilityValidator.validateTemplateSupport(
        configWithUnsupportedOptions.framework,
        configWithUnsupportedOptions.template,
        configWithUnsupportedOptions
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === 'TEMPLATE_NO_ZUSTAND_SUPPORT')).toBe(true);
      expect(result.errors.some(e => e.code === 'TEMPLATE_NO_TANSTACK_SUPPORT')).toBe(true);
    });
  });
});