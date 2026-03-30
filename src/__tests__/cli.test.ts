import { Command } from 'commander';
import { initCommand } from '../commands/init';

// Mock the init command
jest.mock('../commands/init', () => ({
  initCommand: jest.fn(),
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
  let program: Command;
  const mockInitCommand = initCommand as jest.MockedFunction<typeof initCommand>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh commander instance for each test
    program = new Command();
    program
      .name('starter-cli')
      .description('A CLI tool for scaffolding modern web development projects')
      .version('1.0.0');

    // Add the init command
    program
      .command('init [project-name]')
      .description('Start the interactive project creation process')
      .option('-f, --force', 'Force project creation even in non-empty directory')
      .option('--skip-install', 'Skip dependency installation')
      .action(async (...args: any[]) => {
        try {
          const projectName = args[0];
          const options = args[1];
          
          const cliOptions = {
            force: options?.force || false,
            skipInstall: options?.skipInstall || false,
          };
          await initCommand(projectName, cliOptions);
        } catch (error) {
          console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
          process.exit(1);
        }
      });

    // Handle unknown commands
    program.on('command:*', (operands) => {
      console.error(`❌ Unknown command: ${operands[0]}`);
      console.log('Run "starter-cli --help" for available commands.');
      process.exit(1);
    });
  });

  afterAll(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
    mockExit.mockRestore();
  });

  describe('Help flag display and version information', () => {
    it('should display help information when --help flag is used', async () => {
      // Test help flag
      const helpOutput = program.helpInformation();
      
      expect(helpOutput).toContain('starter-cli');
      expect(helpOutput).toContain('A CLI tool for scaffolding modern web development projects');
      expect(helpOutput).toContain('init [options] [project-name]');
      expect(helpOutput).toContain('Start the interactive project creation process');
      expect(helpOutput).toContain('Commands:');
      expect(helpOutput).toContain('init');
    });

    it('should display version information when --version flag is used', () => {
      expect(program.version()).toBe('1.0.0');
    });

    it('should display usage information in help output', () => {
      const helpOutput = program.helpInformation();
      
      expect(helpOutput).toContain('Usage:');
      expect(helpOutput).toContain('Options:');
      expect(helpOutput).toContain('Commands:');
    });

    it('should show command-specific help for init command', () => {
      const initCommand = program.commands.find(cmd => cmd.name() === 'init');
      expect(initCommand).toBeDefined();
      
      if (initCommand) {
        const initHelp = initCommand.helpInformation();
        expect(initHelp).toContain('starter-cli init [options] [project-name]');
        expect(initHelp).toContain('Start the interactive project creation process');
        expect(initHelp).toContain('-f, --force');
        expect(initHelp).toContain('--skip-install');
      }
    });
  });

  describe('Command parsing with various argument combinations', () => {
    it('should parse init command without arguments', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init']);
      
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, {
        force: false,
        skipInstall: false,
      });
    });

    it('should parse init command with project name argument', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', 'my-project']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-project', {
        force: false,
        skipInstall: false,
      });
    });

    it('should parse init command with --force flag', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', '--force']);
      
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, {
        force: true,
        skipInstall: false,
      });
    });

    it('should parse init command with -f flag (short form)', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', '-f']);
      
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, {
        force: true,
        skipInstall: false,
      });
    });

    it('should parse init command with --skip-install flag', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', '--skip-install']);
      
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, {
        force: false,
        skipInstall: true,
      });
    });

    it('should parse init command with project name and --force flag', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', 'my-project', '--force']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-project', {
        force: true,
        skipInstall: false,
      });
    });

    it('should parse init command with project name and --skip-install flag', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', 'my-project', '--skip-install']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-project', {
        force: false,
        skipInstall: true,
      });
    });

    it('should parse init command with all flags combined', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', 'my-project', '--force', '--skip-install']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-project', {
        force: true,
        skipInstall: true,
      });
    });

    it('should parse init command with flags in different order', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', '--skip-install', 'my-project', '--force']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-project', {
        force: true,
        skipInstall: true,
      });
    });

    it('should parse init command with project name containing hyphens', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init', 'my-awesome-project']);
      
      expect(mockInitCommand).toHaveBeenCalledWith('my-awesome-project', {
        force: false,
        skipInstall: false,
      });
    });
  });

  describe('Error handling for invalid arguments', () => {
    it('should handle unknown commands', async () => {
      try {
        await program.parseAsync(['node', 'starter-cli', 'unknown-command']);
      } catch (error) {
        // Expected to throw due to process.exit
      }
      
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Unknown command: unknown-command');
      expect(consoleSpy.log).toHaveBeenCalledWith('Run "starter-cli --help" for available commands.');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle unknown flags gracefully', async () => {
      // Commander.js will throw an error for unknown options
      await expect(
        program.parseAsync(['node', 'starter-cli', 'init', '--unknown-flag'])
      ).rejects.toThrow();
    });

    it('should handle init command errors', async () => {
      const testError = new Error('Test error');
      mockInitCommand.mockRejectedValue(testError);
      
      try {
        await program.parseAsync(['node', 'starter-cli', 'init']);
      } catch (error) {
        // Expected to throw due to process.exit
      }
      
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error:', 'Test error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should handle init command with unknown error type', async () => {
      mockInitCommand.mockRejectedValue('String error');
      
      try {
        await program.parseAsync(['node', 'starter-cli', 'init']);
      } catch (error) {
        // Expected to throw due to process.exit
      }
      
      expect(consoleSpy.error).toHaveBeenCalledWith('❌ Error:', 'Unknown error');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Command structure validation', () => {
    it('should have correct command name', () => {
      expect(program.name()).toBe('starter-cli');
    });

    it('should have correct description', () => {
      expect(program.description()).toBe('A CLI tool for scaffolding modern web development projects');
    });

    it('should have init command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('init');
    });

    it('should have correct init command description', () => {
      const initCommand = program.commands.find(cmd => cmd.name() === 'init');
      expect(initCommand?.description()).toBe('Start the interactive project creation process');
    });

    it('should have correct init command options', () => {
      const initCommand = program.commands.find(cmd => cmd.name() === 'init');
      const options = initCommand?.options.map(opt => ({
        flags: opt.flags,
        description: opt.description,
      }));
      
      expect(options).toContainEqual({
        flags: '-f, --force',
        description: 'Force project creation even in non-empty directory',
      });
      
      expect(options).toContainEqual({
        flags: '--skip-install',
        description: 'Skip dependency installation',
      });
    });

    it('should accept optional project name argument', () => {
      const initCommand = program.commands.find(cmd => cmd.name() === 'init');
      expect(initCommand?.usage()).toContain('[project-name]');
    });
  });

  describe('Requirements validation', () => {
    // **Validates: Requirements 1.2** - Help flag display
    it('should display usage information and available options when --help flag is used', () => {
      const helpOutput = program.helpInformation();
      
      // Should contain usage information
      expect(helpOutput).toContain('Usage:');
      expect(helpOutput).toContain('starter-cli');
      
      // Should contain available options
      expect(helpOutput).toContain('Options:');
      expect(helpOutput).toContain('-V, --version');
      expect(helpOutput).toContain('-h, --help');
      
      // Should contain available commands
      expect(helpOutput).toContain('Commands:');
      expect(helpOutput).toContain('init');
    });

    // **Validates: Requirements 1.3** - Init command execution
    it('should start interactive project creation process when starter-cli init is executed', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init']);
      
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, {
        force: false,
        skipInstall: false,
      });
    });

    // **Validates: Requirements 1.2** - Command without arguments
    it('should display interactive prompts when command is run without arguments', async () => {
      mockInitCommand.mockResolvedValue();
      
      await program.parseAsync(['node', 'starter-cli', 'init']);
      
      // The init command should be called without a project name, 
      // which will trigger interactive prompts inside the initCommand
      expect(mockInitCommand).toHaveBeenCalledWith(undefined, expect.any(Object));
    });
  });
});