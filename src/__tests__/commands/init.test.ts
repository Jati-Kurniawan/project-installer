import { initCommand } from '../../commands/init';
import { CLIOptions } from '../../types';

// Mock inquirer to avoid interactive prompts in tests
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
  readdir: jest.fn(),
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

      await initCommand('test-project');

      expect(consoleSpy.log).toHaveBeenCalledWith('🚀 Welcome to Starter CLI!');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Project name: test-project');
    });

    it('should handle force option', async () => {
      const { existsSync, readdir } = require('fs-extra');
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue(['some-file.txt']);

      const options: CLIOptions = { force: true };
      await initCommand('test-project', options);

      expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
    });

    it('should handle skip-install option', async () => {
      const { existsSync } = require('fs-extra');
      existsSync.mockReturnValue(false);

      const options: CLIOptions = { skipInstall: true };
      await initCommand('test-project', options);

      expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
    });

    it('should handle both force and skip-install options', async () => {
      const { existsSync, readdir } = require('fs-extra');
      existsSync.mockReturnValue(true);
      readdir.mockResolvedValue(['some-file.txt']);

      const options: CLIOptions = { force: true, skipInstall: true };
      await initCommand('test-project', options);

      expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Force mode enabled');
      expect(consoleSpy.log).toHaveBeenCalledWith('⏭️  Dependency installation will be skipped');
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

    it('should prompt for project name when not provided', async () => {
      const inquirer = require('inquirer');
      const { existsSync } = require('fs-extra');
      
      inquirer.prompt.mockResolvedValue({ name: 'prompted-project' });
      existsSync.mockReturnValue(false);

      await initCommand();

      expect(inquirer.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
        }),
      ]);
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Project name: prompted-project');
    });
  });
});