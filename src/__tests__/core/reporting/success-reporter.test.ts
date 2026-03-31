import { SuccessReporter } from '../../../core/reporting/success-reporter';
import { ProjectConfig, Framework, Language, PackageManager, TemplateType, GenerationResult, InstallationResult } from '../../../types';

// Mock console.log to capture output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

describe('SuccessReporter', () => {
  let successReporter: SuccessReporter;
  let mockConfig: ProjectConfig;
  let mockGenerationResult: GenerationResult;
  let mockInstallationResult: InstallationResult;

  beforeEach(() => {
    successReporter = new SuccessReporter();
    console.log = mockConsoleLog;
    mockConsoleLog.mockClear();
    
    mockConfig = {
      projectName: 'test-project',
      framework: Framework.NEXTJS,
      template: TemplateType.MINIMAL,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: true },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: true, includePrettier: true },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };

    mockGenerationResult = {
      success: true,
      projectPath: './test-project',
      filesCreated: ['package.json', 'src/app/page.tsx', 'tailwind.config.js', '.gitignore'],
      errors: [],
      duration: 1500,
    };

    mockInstallationResult = {
      success: true,
      installedPackages: ['react', 'next', 'typescript', 'tailwindcss', 'zustand', 'eslint', 'prettier'],
      errors: [],
      duration: 15000,
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('displaySuccessSummary', () => {
    it('should display comprehensive success summary', async () => {
      const gitResult = { success: true, message: 'Git repository initialized successfully.' };
      
      await successReporter.displaySuccessSummary(
        mockConfig,
        mockGenerationResult,
        mockInstallationResult,
        gitResult
      );

      // Check that various sections were logged
      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('🎉 Project created successfully!');
      expect(allOutput).toContain('📁 Project Overview:');
      expect(allOutput).toContain('Name: test-project');
      expect(allOutput).toContain('Framework: Next.js (App Router)');
      expect(allOutput).toContain('Language: TypeScript');
      expect(allOutput).toContain('Files created: 4');
      expect(allOutput).toContain('Generation time: 1500ms');
      
      expect(allOutput).toContain('📦 Dependencies:');
      expect(allOutput).toContain('Successfully installed 7 packages');
      expect(allOutput).toContain('Installation time: 15s');
      
      expect(allOutput).toContain('🔧 Git Repository:');
      expect(allOutput).toContain('Git repository initialized successfully');
      
      expect(allOutput).toContain('🛠️  Configured Tools:');
      expect(allOutput).toContain('Tailwind CSS');
      expect(allOutput).toContain('Zustand');
      expect(allOutput).toContain('ESLint');
      expect(allOutput).toContain('Prettier');
      
      expect(allOutput).toContain('🚀 Next Steps:');
      expect(allOutput).toContain('cd test-project');
      expect(allOutput).toContain('npm run dev');
      
      expect(allOutput).toContain('📚 Useful Commands:');
      expect(allOutput).toContain('Build for production: npm run build');
      expect(allOutput).toContain('Run linting: npm run lint');
      expect(allOutput).toContain('Format code: npm run format');
      
      expect(allOutput).toContain('🚀 Happy coding!');
    });

    it('should handle failed dependency installation', async () => {
      const failedInstallResult = {
        ...mockInstallationResult,
        success: false,
        errors: [{ message: 'Network error', code: 'NETWORK_ERROR' }],
      };

      await successReporter.displaySuccessSummary(
        mockConfig,
        mockGenerationResult,
        failedInstallResult
      );

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('⚠️  Dependency installation failed');
      expect(allOutput).toContain('Network error');
    });

    it('should handle failed Git initialization', async () => {
      const gitResult = { success: false, message: 'Git is not available on this system.' };
      
      await successReporter.displaySuccessSummary(
        mockConfig,
        mockGenerationResult,
        mockInstallationResult,
        gitResult
      );

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('⚠️  Git is not available on this system.');
    });

    it('should display minimal tools when none are configured', async () => {
      const minimalConfig = {
        ...mockConfig,
        styling: { includeTailwind: false },
        stateManagement: { includeZustand: false },
        dataFetching: { includeTanStackQuery: false },
        devTools: { includeESLint: false, includePrettier: false },
      };

      await successReporter.displaySuccessSummary(
        minimalConfig,
        mockGenerationResult,
        mockInstallationResult
      );

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('📦 Minimal setup - no additional tools configured');
    });

    it('should show React + Vite specific information', async () => {
      const viteConfig = {
        ...mockConfig,
        framework: Framework.REACT_VITE,
        template: TemplateType.BASIC_SPA,
      };

      await successReporter.displaySuccessSummary(
        viteConfig,
        mockGenerationResult,
        mockInstallationResult
      );

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('Framework: React + Vite');
      expect(allOutput).toContain('Template: Basic SPA');
      expect(allOutput).toContain('Preview production build: npm run preview');
      expect(allOutput).toContain('Take advantage of Vite');
    });

    it('should work without installation result', async () => {
      await successReporter.displaySuccessSummary(
        mockConfig,
        mockGenerationResult
      );

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('🎉 Project created successfully!');
      expect(allOutput).not.toContain('📦 Dependencies:');
    });
  });

  describe('displaySimpleSuccess', () => {
    it('should display simple success message', () => {
      successReporter.displaySimpleSuccess('test-project', './test-project');

      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');

      expect(allOutput).toContain('✅ Project "test-project" created successfully!');
      expect(allOutput).toContain('📁 Location:');
      expect(allOutput).toContain('cd test-project');
      expect(allOutput).toContain('npm run dev');
      expect(allOutput).toContain('🚀 Happy coding!');
    });
  });
});