import { DependencyInstaller } from '../../../core/project-generator/dependency-installer';
import { PackageManager, ProjectConfig, Framework, Language, TemplateDefinition } from '../../../types';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra');

// Mock execa
jest.mock('execa', () => ({
  execa: jest.fn(),
}));

describe('DependencyInstaller', () => {
  let dependencyInstaller: DependencyInstaller;
  let mockExecSync: jest.Mock;

  beforeEach(() => {
    dependencyInstaller = new DependencyInstaller();
    mockExecSync = require('child_process').execSync;
    jest.clearAllMocks();
  });

  describe('detectAvailablePackageManagers', () => {
    it('should detect all available package managers', async () => {
      // Mock all package managers as available
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('npm') || command.includes('yarn') || command.includes('pnpm')) {
          return 'version info';
        }
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toEqual([PackageManager.NPM, PackageManager.YARN, PackageManager.PNPM]);
      expect(mockExecSync).toHaveBeenCalledWith('npm --version', { stdio: 'ignore' });
      expect(mockExecSync).toHaveBeenCalledWith('yarn --version', { stdio: 'ignore' });
      expect(mockExecSync).toHaveBeenCalledWith('pnpm --version', { stdio: 'ignore' });
    });

    it('should detect only npm when others are not available', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('npm')) {
          return 'version info';
        }
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toContain(PackageManager.NPM);
      expect(result).not.toContain(PackageManager.YARN);
      // Note: pnpm might still be detected if it's actually available on the system
    });

    it('should detect only yarn when npm and pnpm are not available', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('yarn')) {
          return 'version info';
        }
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toContain(PackageManager.YARN);
      expect(result).not.toContain(PackageManager.NPM);
    });

    it('should default to npm when no package managers are detected', async () => {
      const mockLoggerWarn = jest.spyOn(require('../../../utils/logger').Logger, 'warn').mockImplementation();
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toEqual([PackageManager.NPM]);
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        '⚠️  No package managers detected. Defaulting to npm (may not work).'
      );

      mockLoggerWarn.mockRestore();
    });

    it('should detect partial availability correctly', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.includes('npm') || command.includes('pnpm')) {
          return 'version info';
        }
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toContain(PackageManager.NPM);
      expect(result).toContain(PackageManager.PNPM);
      expect(result).not.toContain(PackageManager.YARN);
    });
  });

  describe('generatePackageJson', () => {
    const mockConfig: ProjectConfig = {
      projectName: 'test-project',
      framework: Framework.NEXTJS,
      template: 'minimal' as any,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: true, includePrettier: true },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };

    const mockTemplate: TemplateDefinition = {
      id: 'nextjs-minimal',
      name: 'Minimal Next.js',
      description: 'A minimal Next.js template',
      framework: Framework.NEXTJS,
      type: 'minimal' as any,
      version: '1.0.0',
      author: 'Test',
      supportedLanguages: [Language.TYPESCRIPT],
      supportedOptions: [],
      files: [],
      dependencies: {},
      devDependencies: {},
      templatePath: '/path/to/template',
    };

    it('should skip generation if package.json already exists', async () => {
      const projectPath = '/test/project';
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await dependencyInstaller.generatePackageJson(mockConfig, mockTemplate, projectPath);

      expect(fs.pathExists).toHaveBeenCalledWith(path.join(projectPath, 'package.json'));
      expect(consoleSpy).toHaveBeenCalledWith('📄 package.json already exists, skipping generation');
      expect(fs.writeFile).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should generate package.json with base dependencies', async () => {
      const projectPath = '/test/project';
      (fs.pathExists as jest.Mock).mockImplementation((filePath: string) => {
        if (filePath.includes('package.json') && filePath.includes(projectPath)) {
          return Promise.resolve(false); // package.json doesn't exist in project
        }
        if (filePath.includes('template.json')) {
          return Promise.resolve(true); // template.json exists
        }
        return Promise.resolve(false);
      });

      (fs.readJson as jest.Mock).mockResolvedValue({
        dependencies: {
          base: {
            'next': '^14.0.0',
            'react': '^18.0.0',
            'react-dom': '^18.0.0'
          },
          conditional: {
            typescript: {
              '@types/node': '^20.0.0',
              'typescript': '^5.0.0'
            },
            tailwind: {
              'tailwindcss': '^3.3.0'
            },
            eslint: {
              'eslint': '^8.0.0'
            },
            prettier: {
              'prettier': '^3.0.0'
            }
          }
        }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await dependencyInstaller.generatePackageJson(mockConfig, mockTemplate, projectPath);

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(projectPath, 'package.json'),
        expect.stringContaining('"name": "test-project"'),
        'utf-8'
      );

      const writeCall = (fs.writeFile as any).mock.calls[0];
      const packageJsonContent = JSON.parse(writeCall[1] as string);

      expect(packageJsonContent.dependencies).toEqual({
        'next': '^14.0.0',
        'react': '^18.0.0',
        'react-dom': '^18.0.0',
        'tailwindcss': '^3.3.0'
      });

      expect(packageJsonContent.devDependencies).toEqual({
        '@types/node': '^20.0.0',
        'typescript': '^5.0.0',
        'eslint': '^8.0.0',
        'prettier': '^3.0.0'
      });

      consoleSpy.mockRestore();
    });

    it('should generate correct scripts for Next.js', async () => {
      const projectPath = '/test/project';
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      (fs.readJson as jest.Mock).mockResolvedValue({ dependencies: { base: {}, conditional: {} } });

      await dependencyInstaller.generatePackageJson(mockConfig, mockTemplate, projectPath);

      const writeCall = (fs.writeFile as any).mock.calls[0];
      const packageJsonContent = JSON.parse(writeCall[1] as string);

      expect(packageJsonContent.scripts).toEqual({
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        format: 'prettier --write .'
      });
    });
  });

  describe('installDependencies', () => {
    const mockConfig: ProjectConfig = {
      projectName: 'test-project',
      framework: Framework.NEXTJS,
      template: 'minimal' as any,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };

    it('should install dependencies successfully', async () => {
      const projectPath = '/test/project';
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      (fs.readJson as jest.Mock).mockResolvedValue({
        dependencies: { 'react': '^18.0.0' },
        devDependencies: { 'typescript': '^5.0.0' }
      });
      (fs.stat as any).mockResolvedValue({ size: 1024 });

      // Mock execa
      const mockExeca = require('execa').execa;
      mockExeca.mockResolvedValue({ stdout: 'success' });

      const result = await dependencyInstaller.installDependencies(mockConfig, projectPath);

      expect(result.success).toBe(true);
      expect(result.installedPackages).toEqual(['react', 'typescript']);
      expect(mockExeca).toHaveBeenCalledWith('npm', ['install'], {
        cwd: projectPath,
        stdio: 'inherit'
      });
    });

    it('should handle installation failure', async () => {
      const projectPath = '/test/project';
      (fs.pathExists as jest.Mock).mockResolvedValue(false);

      const result = await dependencyInstaller.installDependencies(mockConfig, projectPath);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('package.json not found in project directory');
    });
  });
});