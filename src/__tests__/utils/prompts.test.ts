import { PromptManager } from '../../utils/prompts';
import { Framework, Language, PackageManager, TemplateType } from '../../types';

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
}));

// Mock file system utilities
jest.mock('../../utils/file-system', () => ({
  isDirectoryEmpty: jest.fn(),
  resolveProjectPath: jest.fn(),
}));

describe('PromptManager', () => {
  let promptManager: PromptManager;
  let mockPrompt: jest.Mock;

  beforeEach(() => {
    promptManager = new PromptManager();
    mockPrompt = require('inquirer').prompt;
    jest.clearAllMocks();
  });

  describe('selectFramework', () => {
    it('should return selected framework', async () => {
      mockPrompt.mockResolvedValue({ framework: Framework.NEXTJS });

      const result = await promptManager.selectFramework();

      expect(result).toBe(Framework.NEXTJS);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'framework',
          message: 'Which framework would you like to use?',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: Framework.NEXTJS }),
            expect.objectContaining({ value: Framework.REACT_VITE }),
          ]),
        }),
      ]);
    });
  });

  describe('selectTemplate', () => {
    it('should return Next.js templates when framework is NEXTJS', async () => {
      mockPrompt.mockResolvedValue({ template: TemplateType.MINIMAL });

      const result = await promptManager.selectTemplate(Framework.NEXTJS);

      expect(result).toBe(TemplateType.MINIMAL);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          choices: expect.arrayContaining([
            expect.objectContaining({ value: TemplateType.MINIMAL }),
            expect.objectContaining({ value: TemplateType.FEATURE_BASED }),
            expect.objectContaining({ value: TemplateType.DASHBOARD }),
          ]),
        }),
      ]);
    });

    it('should return React + Vite templates when framework is REACT_VITE', async () => {
      mockPrompt.mockResolvedValue({ template: TemplateType.BASIC_SPA });

      const result = await promptManager.selectTemplate(Framework.REACT_VITE);

      expect(result).toBe(TemplateType.BASIC_SPA);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          choices: expect.arrayContaining([
            expect.objectContaining({ value: TemplateType.BASIC_SPA }),
            expect.objectContaining({ value: TemplateType.FEATURE_BASED }),
            expect.objectContaining({ value: TemplateType.COMPONENT_DRIVEN }),
          ]),
        }),
      ]);
    });
  });

  describe('selectLanguage', () => {
    it('should return selected language with TypeScript as default', async () => {
      mockPrompt.mockResolvedValue({ language: Language.TYPESCRIPT });

      const result = await promptManager.selectLanguage();

      expect(result).toBe(Language.TYPESCRIPT);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'language',
          default: Language.TYPESCRIPT,
        }),
      ]);
    });
  });

  describe('selectToolingOptions', () => {
    it('should return tooling options with correct defaults', async () => {
      const mockOptions = {
        includeTailwind: true,
        includeZustand: false,
        includeTanStackQuery: true,
        includeESLint: true,
        includePrettier: true,
      };
      mockPrompt.mockResolvedValue(mockOptions);

      const result = await promptManager.selectToolingOptions();

      expect(result).toEqual(mockOptions);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'includeTailwind', default: false }),
        expect.objectContaining({ name: 'includeZustand', default: false }),
        expect.objectContaining({ name: 'includeTanStackQuery', default: false }),
        expect.objectContaining({ name: 'includeESLint', default: true }),
        expect.objectContaining({ name: 'includePrettier', default: true }),
      ]);
    });
  });

  describe('selectPackageManager', () => {
    it('should return single available package manager without prompting', async () => {
      const result = await promptManager.selectPackageManager([PackageManager.NPM]);

      expect(result).toBe(PackageManager.NPM);
      expect(mockPrompt).not.toHaveBeenCalled();
    });

    it('should prompt when multiple package managers are available', async () => {
      mockPrompt.mockResolvedValue({ packageManager: PackageManager.YARN });

      const result = await promptManager.selectPackageManager([
        PackageManager.NPM,
        PackageManager.YARN,
        PackageManager.PNPM,
      ]);

      expect(result).toBe(PackageManager.YARN);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'list',
          name: 'packageManager',
          choices: expect.arrayContaining([
            expect.objectContaining({ value: PackageManager.NPM }),
            expect.objectContaining({ value: PackageManager.YARN }),
            expect.objectContaining({ value: PackageManager.PNPM }),
          ]),
        }),
      ]);
    });

    it('should exit when no package managers are available', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

      try {
        await promptManager.selectPackageManager([]);
      } catch (error: any) {
        expect(error.message).toBe('process.exit called');
      }

      expect(mockConsoleError).toHaveBeenCalledWith(
        '❌ No package managers available. Please install npm, yarn, or pnpm.'
      );
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('confirmGitInit', () => {
    it('should return Git initialization preference', async () => {
      mockPrompt.mockResolvedValue({ initGit: true });

      const result = await promptManager.confirmGitInit();

      expect(result).toBe(true);
      expect(mockPrompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: 'confirm',
          name: 'initGit',
          default: true,
        }),
      ]);
    });
  });
});