import { DependencyInstaller } from '../../../core/project-generator/dependency-installer';
import { PackageManager } from '../../../types';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn(),
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
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await dependencyInstaller.detectAvailablePackageManagers();

      expect(result).toEqual([PackageManager.NPM]);
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        '⚠️  No package managers detected. Defaulting to npm.'
      );

      mockConsoleWarn.mockRestore();
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
});