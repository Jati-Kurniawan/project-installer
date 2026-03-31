import { DependencyInstaller } from '../../core/project-generator/dependency-installer';
import { TemplateRegistry } from '../../core/template-engine/registry';
import { ProjectConfig, Framework, Language, PackageManager } from '../../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Dependency Management Integration', () => {
  let dependencyInstaller: DependencyInstaller;
  let templateRegistry: TemplateRegistry;
  let tempDir: string;

  beforeEach(async () => {
    dependencyInstaller = new DependencyInstaller();
    templateRegistry = new TemplateRegistry();
    
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  it('should generate package.json with correct dependencies for Next.js TypeScript project', async () => {
    const config: ProjectConfig = {
      projectName: 'test-nextjs-app',
      framework: Framework.NEXTJS,
      template: 'minimal' as any,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: true },
      devTools: { includeESLint: true, includePrettier: true },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };

    // Load the actual template
    const template = await templateRegistry.loadTemplate(Framework.NEXTJS, 'minimal' as any);
    
    // Generate package.json
    await dependencyInstaller.generatePackageJson(config, template, tempDir);

    // Verify package.json was created
    const packageJsonPath = path.join(tempDir, 'package.json');
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    // Read and verify package.json content
    const packageJson = await fs.readJson(packageJsonPath);
    
    expect(packageJson.name).toBe('test-nextjs-app');
    expect(packageJson.version).toBe('0.1.0');
    expect(packageJson.private).toBe(true);

    // Check scripts
    expect(packageJson.scripts).toEqual({
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
      format: 'prettier --write .'
    });

    // Check base dependencies
    expect(packageJson.dependencies).toHaveProperty('next');
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');

    // Check conditional dependencies
    expect(packageJson.dependencies).toHaveProperty('tailwindcss'); // Tailwind enabled
    expect(packageJson.dependencies).toHaveProperty('@tanstack/react-query'); // TanStack Query enabled
    expect(packageJson.dependencies).not.toHaveProperty('zustand'); // Zustand disabled

    // Check dev dependencies
    expect(packageJson.devDependencies).toHaveProperty('typescript'); // TypeScript enabled
    expect(packageJson.devDependencies).toHaveProperty('@types/node');
    expect(packageJson.devDependencies).toHaveProperty('eslint'); // ESLint enabled
    expect(packageJson.devDependencies).toHaveProperty('prettier'); // Prettier enabled
  });

  it('should generate package.json with correct dependencies for React Vite JavaScript project', async () => {
    const config: ProjectConfig = {
      projectName: 'test-react-app',
      framework: Framework.REACT_VITE,
      template: 'basic-spa' as any,
      language: Language.JAVASCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: true },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.YARN,
      gitInit: false,
    };

    // Load the actual template
    const template = await templateRegistry.loadTemplate(Framework.REACT_VITE, 'basic-spa' as any);
    
    // Generate package.json
    await dependencyInstaller.generatePackageJson(config, template, tempDir);

    // Verify package.json was created
    const packageJsonPath = path.join(tempDir, 'package.json');
    expect(await fs.pathExists(packageJsonPath)).toBe(true);

    // Read and verify package.json content
    const packageJson = await fs.readJson(packageJsonPath);
    
    expect(packageJson.name).toBe('test-react-app');

    // Check scripts for Vite
    expect(packageJson.scripts).toEqual({
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      lint: 'echo "No linting configured"' // ESLint disabled
    });

    // Check base dependencies
    expect(packageJson.dependencies).toHaveProperty('react');
    expect(packageJson.dependencies).toHaveProperty('react-dom');

    // Check conditional dependencies
    expect(packageJson.dependencies).not.toHaveProperty('tailwindcss'); // Tailwind disabled
    expect(packageJson.dependencies).toHaveProperty('zustand'); // Zustand enabled
    expect(packageJson.dependencies).not.toHaveProperty('@tanstack/react-query'); // TanStack Query disabled

    // Check dev dependencies (should include Vite for JavaScript)
    expect(packageJson.devDependencies).toHaveProperty('vite'); // Vite for JavaScript
    expect(packageJson.devDependencies).not.toHaveProperty('typescript'); // JavaScript project
    expect(packageJson.devDependencies).not.toHaveProperty('eslint'); // ESLint disabled
    expect(packageJson.devDependencies).not.toHaveProperty('prettier'); // Prettier disabled
  });

  it('should detect available package managers', async () => {
    const availableManagers = await dependencyInstaller.detectAvailablePackageManagers();
    
    // Should at least have npm (comes with Node.js)
    expect(availableManagers).toContain(PackageManager.NPM);
    expect(availableManagers.length).toBeGreaterThan(0);
  });
});