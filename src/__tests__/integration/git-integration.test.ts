import { GitService } from '../../core/git/git-service';
import { SuccessReporter } from '../../core/reporting/success-reporter';
import { ProjectConfig, Framework, Language, PackageManager, TemplateType, GenerationResult, InstallationResult } from '../../types';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Git Integration', () => {
  let gitService: GitService;
  let successReporter: SuccessReporter;
  let testProjectPath: string;
  let mockConfig: ProjectConfig;

  beforeEach(() => {
    gitService = new GitService();
    successReporter = new SuccessReporter();
    testProjectPath = path.join(__dirname, 'test-git-integration');
    
    mockConfig = {
      projectName: 'test-git-integration',
      framework: Framework.NEXTJS,
      template: TemplateType.MINIMAL,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: true, includePrettier: true },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };
  });

  afterEach(async () => {
    // Clean up test directory
    if (await fs.pathExists(testProjectPath)) {
      await fs.remove(testProjectPath);
    }
  });

  it('should create comprehensive .gitignore for Next.js project', async () => {
    await fs.ensureDir(testProjectPath);
    
    const result = await gitService.createGitignore(testProjectPath, mockConfig);
    
    expect(result.success).toBe(true);
    
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    expect(await fs.pathExists(gitignorePath)).toBe(true);
    
    const content = await fs.readFile(gitignorePath, 'utf-8');
    
    // Check for common entries
    expect(content).toContain('node_modules/');
    expect(content).toContain('.env');
    expect(content).toContain('npm-debug.log*');
    expect(content).toContain('.DS_Store');
    
    // Check for Next.js specific entries
    expect(content).toContain('/.next/');
    expect(content).toContain('/out/');
    expect(content).toContain('next-env.d.ts');
    expect(content).toContain('.vercel');
    
    // Check for TypeScript entries
    expect(content).toContain('*.tsbuildinfo');
    
    // Check for npm specific entries (default package manager)
    expect(content).not.toContain('.yarn/*'); // Should not include yarn entries
  });

  it('should create comprehensive .gitignore for React + Vite project with yarn', async () => {
    await fs.ensureDir(testProjectPath);
    
    const viteConfig = {
      ...mockConfig,
      framework: Framework.REACT_VITE,
      packageManager: PackageManager.YARN,
    };
    
    const result = await gitService.createGitignore(testProjectPath, viteConfig);
    
    expect(result.success).toBe(true);
    
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf-8');
    
    // Check for Vite specific entries
    expect(content).toContain('# Vite specific');
    expect(content).toContain('dist-ssr');
    expect(content).toContain('*.local');
    
    // Check for Yarn specific entries
    expect(content).toContain('# Yarn');
    expect(content).toContain('.yarn/*');
    expect(content).toContain('!.yarn/patches');
  });

  it('should integrate Git service with success reporter', async () => {
    await fs.ensureDir(testProjectPath);
    
    // Create .gitignore
    const gitignoreResult = await gitService.createGitignore(testProjectPath, mockConfig);
    expect(gitignoreResult.success).toBe(true);
    
    // Mock generation and installation results
    const generationResult: GenerationResult = {
      success: true,
      projectPath: testProjectPath,
      filesCreated: ['package.json', 'src/app/page.tsx', '.gitignore'],
      errors: [],
      duration: 1000,
    };
    
    const installationResult: InstallationResult = {
      success: true,
      installedPackages: ['react', 'next', 'typescript'],
      errors: [],
      duration: 5000,
    };
    
    // Mock console.log to capture output
    const mockConsoleLog = jest.fn();
    const originalConsoleLog = console.log;
    console.log = mockConsoleLog;
    
    try {
      await successReporter.displaySuccessSummary(
        mockConfig,
        generationResult,
        installationResult,
        gitignoreResult
      );
      
      const loggedMessages = mockConsoleLog.mock.calls.map(call => call[0]);
      const allOutput = loggedMessages.join('\n');
      
      // Verify Git-related output
      expect(allOutput).toContain('🔧 Git Repository:');
      expect(allOutput).toContain('.gitignore file created successfully');
      expect(allOutput).toContain('Make your first commit: git add . && git commit');
      
    } finally {
      console.log = originalConsoleLog;
    }
  });

  it('should handle different package managers in .gitignore', async () => {
    await fs.ensureDir(testProjectPath);
    
    // Test PNPM
    const pnpmConfig = { ...mockConfig, packageManager: PackageManager.PNPM };
    const pnpmResult = await gitService.createGitignore(testProjectPath, pnpmConfig);
    
    expect(pnpmResult.success).toBe(true);
    
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    const pnpmContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(pnpmContent).toContain('# PNPM');
    expect(pnpmContent).toContain('.pnpm-debug.log*');
    
    // Clean up and test Yarn
    await fs.remove(gitignorePath);
    
    const yarnConfig = { ...mockConfig, packageManager: PackageManager.YARN };
    const yarnResult = await gitService.createGitignore(testProjectPath, yarnConfig);
    
    expect(yarnResult.success).toBe(true);
    
    const yarnContent = await fs.readFile(gitignorePath, 'utf-8');
    expect(yarnContent).toContain('# Yarn');
    expect(yarnContent).toContain('.yarn/*');
  });

  it('should handle JavaScript projects correctly', async () => {
    await fs.ensureDir(testProjectPath);
    
    const jsConfig = { ...mockConfig, language: Language.JAVASCRIPT };
    const result = await gitService.createGitignore(testProjectPath, jsConfig);
    
    expect(result.success).toBe(true);
    
    const gitignorePath = path.join(testProjectPath, '.gitignore');
    const content = await fs.readFile(gitignorePath, 'utf-8');
    
    // Should not contain TypeScript specific entries
    expect(content).not.toContain('*.tsbuildinfo');
    
    // But should still contain common entries
    expect(content).toContain('node_modules/');
    expect(content).toContain('.env');
  });
});