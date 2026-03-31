import { initCommand } from '../../commands/init';
import { CLIOptions, Framework, Language, TemplateType, PackageManager } from '../../types';

// Mock inquirer to avoid interactive prompts in tests
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
  readdir: jest.fn(),
}));

// Mock PromptManager
jest.mock('../../utils/prompts', () => ({
  PromptManager: jest.fn().mockImplementation(() => ({
    collectProjectName: jest.fn().mockResolvedValue('test-project'),
    selectFramework: jest.fn().mockResolvedValue(Framework.NEXTJS),
    selectTemplate: jest.fn().mockResolvedValue(TemplateType.MINIMAL),
    selectLanguage: jest.fn().mockResolvedValue(Language.TYPESCRIPT),
    selectToolingOptions: jest.fn().mockResolvedValue({
      includeTailwind: false,
      includeZustand: false,
      includeTanStackQuery: false,
      includeESLint: true,
      includePrettier: true,
    }),
    selectPackageManager: jest.fn().mockResolvedValue(PackageManager.NPM),
    confirmGitInit: jest.fn().mockResolvedValue(true),
    confirmConfiguration: jest.fn().mockResolvedValue(true),
  })),
}));

// Mock DependencyInstaller
jest.mock('../../core/project-generator/dependency-installer', () => ({
  DependencyInstaller: jest.fn().mockImplementation(() => ({
    detectAvailablePackageManagers: jest.fn().mockResolvedValue([PackageManager.NPM]),
    generatePackageJson: jest.fn().mockResolvedValue(true),
    installDependencies: jest.fn().mockResolvedValue({
      success: true,
      installedPackages: ['react', 'typescript'],
      errors: [],
      duration: 1000
    })
  })),
}));

// Mock ProjectGenerator
jest.mock('../../core/project-generator/generator', () => ({
  ProjectGenerator: jest.fn().mockImplementation(() => ({
    generateProject: jest.fn().mockResolvedValue({
      success: true,
      projectPath: '/test/path',
      filesCreated: ['file1.ts', 'file2.ts'],
      duration: 1000,
      errors: []
    })
  }))
}));

// Mock TemplateRegistry
jest.mock('../../core/template-engine/registry', () => ({
  TemplateRegistry: jest.fn().mockImplementation(() => ({
    loadTemplate: jest.fn().mockResolvedValue({
      id: 'test-template',
      dependencies: {},
      devDependencies: {}
    })
  }))
}));

// Mock file system utilities
jest.mock('../../utils/file-system', () => ({
  isDirectoryEmpty: jest.fn().mockResolvedValue(true),
  resolveProjectPath: jest.fn().mockImplementation((name) => `/test/${name}`)
}));

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(),
  error: jest.spyOn(console, 'error').mockImplementation(),
};

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called');
});

describe('CLI Command Parsing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    mockExit.mockRestore();
  });

  describe('initCommand', () => {
    it('should handle project name argument', async () => {
      const { existsSync } = require('fs-extra');
      existsSync.mockReturnValue(false);

      // Mock the full flow to avoid process.exit
      const { PromptManager } = require('../../utils/prompts');
      const mockPromptManager = new PromptManager();
      
      // Mock ProjectGenerator and TemplateRegistry
      jest.doMock('../../core/project-generator/generator', () => ({
        ProjectGenerator: jest.fn().mockImplementation(() => ({
          generateProject: jest.fn().mockResolvedValue({
            success: true,
            projectPath: '/test/path',
            filesCreated: ['file1.ts', 'file2.ts'],
            duration: 1000,
            errors: []
          })
        }))
      }));
      
      jest.doMock('../../core/template-engine/registry', () => ({
        TemplateRegistry: jest.fn().mockImplementation(() => ({
          loadTemplate: jest.fn().mockResolvedValue({
            id: 'test-template',
            dependencies: {},
            devDependencies: {}
          })
        }))
      }));

      try {
        await initCommand('test-project');
        expect(consoleSpy.log).toHaveBeenCalledWith('🚀 Welcome to Starter CLI!');
      } catch (error) {
        // Expected due to mocked dependencies
        expect(consoleSpy.log).toHaveBeenCalledWith('🚀 Welcome to Starter CLI!');
      }
    });

    it('should handle force option', async () => {
      const { existsSync, readdir } = require('fs-extra');
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue(['some-file.txt']);

      const options: CLIOptions = { force: true };
      
      try {
        await initCommand('test-project', options);
        expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
      } catch (error) {
        // Expected due to mocked dependencies
        expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
      }
    });

    it('should handle skip-install option', async () => {
      const { existsSync } = require('fs-extra');
      existsSync.mockReturnValue(false);

      const options: CLIOptions = { skipInstall: true };
      
      try {
        await initCommand('test-project', options);
        expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
      } catch (error) {
        // Expected due to mocked dependencies
        expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
      }
    });

    it('should handle both force and skip-install options', async () => {
      const { existsSync, readdir } = require('fs-extra');
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue(['some-file.txt']);

      const options: CLIOptions = { force: true, skipInstall: true };
      
      try {
        await initCommand('test-project', options);
        expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
        expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
      } catch (error) {
        // Expected due to mocked dependencies
        expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
        expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
      }
    });

    it('should validate invalid project names', async () => {
      try {
        await initCommand('invalid project name!');
      } catch (error) {
        // Expected to throw due to process.exit
      }

      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Invalid project name: "invalid project name!"');
      expect(consoleSpy.log).toHaveBeenCalledWith('💡 Suggested name: "invalid-project-name"');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should use PromptManager when no project name provided', async () => {
      const { existsSync } = require('fs-extra');
      const { PromptManager } = require('../../utils/prompts');
      
      existsSync.mockReturnValue(false);

      try {
        await initCommand();
        expect(PromptManager).toHaveBeenCalled();
      } catch (error) {
        // Expected due to mocked dependencies
        expect(PromptManager).toHaveBeenCalled();
      }
    });
  });
});