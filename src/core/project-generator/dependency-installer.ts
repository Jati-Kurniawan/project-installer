import { ProjectConfig, PackageManager, InstallationResult, TemplateDefinition, Framework, Language } from '../../types';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Dependency installer for managing package installation
 */
export class DependencyInstaller {
  /**
   * Generates package.json with resolved dependencies
   */
  async generatePackageJson(config: ProjectConfig, template: TemplateDefinition, projectPath: string): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    // Check if package.json already exists (from template processing)
    if (await fs.pathExists(packageJsonPath)) {
      console.log('📄 package.json already exists, skipping generation');
      return;
    }

    // Generate package.json from scratch
    const packageJson = await this.createPackageJsonFromConfig(config, template);
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    console.log('📄 Generated package.json');
  }

  /**
   * Creates package.json object from configuration and template
   */
  private async createPackageJsonFromConfig(config: ProjectConfig, template: TemplateDefinition): Promise<any> {
    // Load template metadata for dependency information
    const metadataPath = path.join(template.templatePath, 'template.json');
    let templateMetadata: any = {};

    if (await fs.pathExists(metadataPath)) {
      templateMetadata = await fs.readJson(metadataPath);
    }

    // Base package.json structure
    const packageJson: any = {
      name: config.projectName,
      version: '0.1.0',
      private: true,
      scripts: this.generateScripts(config),
      dependencies: {},
      devDependencies: {}
    };

    // Add base dependencies from template
    if (templateMetadata.dependencies?.base) {
      Object.assign(packageJson.dependencies, templateMetadata.dependencies.base);
    }

    // Add conditional dependencies based on configuration
    if (templateMetadata.dependencies?.conditional) {
      const conditionalDeps = templateMetadata.dependencies.conditional;

      // Language-specific dependencies
      if (config.language === Language.TYPESCRIPT && conditionalDeps.typescript) {
        // TypeScript dependencies are typically dev dependencies
        Object.assign(packageJson.devDependencies, conditionalDeps.typescript);
      }

      if (config.language === Language.JAVASCRIPT && conditionalDeps.javascript) {
        // JavaScript build tools (like Vite) are typically dev dependencies
        Object.assign(packageJson.devDependencies, conditionalDeps.javascript);
      }

      // Styling dependencies
      if (config.styling.includeTailwind && conditionalDeps.tailwind) {
        Object.assign(packageJson.dependencies, conditionalDeps.tailwind);
      }

      // State management dependencies
      if (config.stateManagement.includeZustand && conditionalDeps.zustand) {
        Object.assign(packageJson.dependencies, conditionalDeps.zustand);
      }

      // Data fetching dependencies
      if (config.dataFetching.includeTanStackQuery && conditionalDeps['tanstack-query']) {
        Object.assign(packageJson.dependencies, conditionalDeps['tanstack-query']);
      }

      // Development tool dependencies
      if (config.devTools.includeESLint && conditionalDeps.eslint) {
        Object.assign(packageJson.devDependencies, conditionalDeps.eslint);
      }

      if (config.devTools.includePrettier && conditionalDeps.prettier) {
        Object.assign(packageJson.devDependencies, conditionalDeps.prettier);
      }
    }

    return packageJson;
  }

  /**
   * Generates scripts section based on configuration
   */
  private generateScripts(config: ProjectConfig): Record<string, string> {
    const scripts: Record<string, string> = {};

    // Framework-specific scripts
    if (config.framework === Framework.NEXTJS) {
      scripts.dev = 'next dev';
      scripts.build = 'next build';
      scripts.start = 'next start';
      scripts.lint = config.devTools.includeESLint ? 'next lint' : 'echo "No linting configured"';
    } else if (config.framework === Framework.REACT_VITE) {
      scripts.dev = 'vite';
      scripts.build = 'vite build';
      scripts.preview = 'vite preview';
      scripts.lint = config.devTools.includeESLint ? 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0' : 'echo "No linting configured"';
    }

    // Add formatting script if Prettier is enabled
    if (config.devTools.includePrettier) {
      scripts.format = 'prettier --write .';
    }

    return scripts;
  }

  /**
   * Resolves dependency versions and checks compatibility
   */
  async resolveDependencyVersions(dependencies: Record<string, string>): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};

    for (const [packageName, version] of Object.entries(dependencies)) {
      // For now, use the version as-is from template
      // In a more advanced implementation, we could:
      // - Fetch latest versions from npm registry
      // - Check for compatibility conflicts
      // - Resolve peer dependencies
      resolved[packageName] = version;
    }

    return resolved;
  }

  /**
   * Installs dependencies for the project
   */
  async installDependencies(config: ProjectConfig, projectPath: string): Promise<InstallationResult> {
    const startTime = Date.now();
    const result: InstallationResult = {
      success: true,
      installedPackages: [],
      errors: [],
      duration: 0,
    };

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!await fs.pathExists(packageJsonPath)) {
        throw new Error('package.json not found in project directory');
      }

      // Read package.json to get list of dependencies
      const packageJson = await fs.readJson(packageJsonPath);
      const allDependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      result.installedPackages = Object.keys(allDependencies);

      // Install dependencies using selected package manager
      await this.executePackageManagerInstall(config.packageManager, projectPath);

      // Create lock file
      await this.createLockFile(config.packageManager, projectPath);

      result.success = true;
    } catch (error) {
      result.success = false;
      result.errors.push({
        message: error instanceof Error ? error.message : 'Unknown installation error',
        code: 'INSTALL_FAILED',
      });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Executes package manager installation command
   */
  private async executePackageManagerInstall(packageManager: PackageManager, projectPath: string): Promise<void> {
    const { execa } = await import('execa');

    let command: string;
    let args: string[];

    switch (packageManager) {
      case PackageManager.NPM:
        command = 'npm';
        args = ['install'];
        break;
      case PackageManager.YARN:
        command = 'yarn';
        args = ['install'];
        break;
      case PackageManager.PNPM:
        command = 'pnpm';
        args = ['install'];
        break;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }

    console.log(`📦 Running ${command} ${args.join(' ')}...`);
    console.log('⏳ This may take a few minutes...');

    try {
      const startTime = Date.now();
      await execa(command, args, {
        cwd: projectPath,
        stdio: 'inherit', // Show output to user
      });
      const duration = Date.now() - startTime;
      console.log(`✅ Installation completed in ${Math.round(duration / 1000)}s`);
    } catch (error: any) {
      // Provide more detailed error information
      let errorMessage = `Failed to install dependencies with ${packageManager}`;
      
      if (error.exitCode) {
        errorMessage += ` (exit code: ${error.exitCode})`;
      }
      
      if (error.stderr) {
        errorMessage += `\nError output: ${error.stderr}`;
      }
      
      // Common error scenarios and suggestions
      if (error.message?.includes('ENOENT')) {
        errorMessage += `\n💡 Suggestion: Make sure ${packageManager} is installed and available in your PATH`;
      } else if (error.message?.includes('EACCES')) {
        errorMessage += `\n💡 Suggestion: Try running with elevated permissions or check file permissions`;
      } else if (error.message?.includes('network')) {
        errorMessage += `\n💡 Suggestion: Check your internet connection and try again`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Detects available package managers on the system
   */
  async detectAvailablePackageManagers(): Promise<PackageManager[]> {
    const availableManagers: PackageManager[] = [];

    // Check for npm
    try {
      execSync('npm --version', { stdio: 'ignore' });
      availableManagers.push(PackageManager.NPM);
    } catch {
      // npm not available
    }

    // Check for yarn
    try {
      execSync('yarn --version', { stdio: 'ignore' });
      availableManagers.push(PackageManager.YARN);
    } catch {
      // yarn not available
    }

    // Check for pnpm
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
      availableManagers.push(PackageManager.PNPM);
    } catch {
      // pnpm not available
    }

    // If no package managers found, default to npm (should always be available with Node.js)
    if (availableManagers.length === 0) {
      console.warn('⚠️  No package managers detected. Defaulting to npm.');
      availableManagers.push(PackageManager.NPM);
    }

    return availableManagers;
  }

  /**
   * Creates appropriate lock file for the package manager
   */
  async createLockFile(packageManager: PackageManager, projectPath: string): Promise<void> {
    // Lock files are automatically created by package managers during installation
    // We just need to verify they exist
    let lockFileName: string;

    switch (packageManager) {
      case PackageManager.NPM:
        lockFileName = 'package-lock.json';
        break;
      case PackageManager.YARN:
        lockFileName = 'yarn.lock';
        break;
      case PackageManager.PNPM:
        lockFileName = 'pnpm-lock.yaml';
        break;
      default:
        console.log('⚠️  Unknown package manager, skipping lock file verification');
        return;
    }

    const lockFilePath = path.join(projectPath, lockFileName);
    
    // Wait a moment for the file system to sync
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (await fs.pathExists(lockFilePath)) {
      console.log(`🔒 Lock file created: ${lockFileName}`);
      
      // Verify the lock file has content
      try {
        const stats = await fs.stat(lockFilePath);
        if (stats.size > 0) {
          console.log(`📊 Lock file size: ${Math.round(stats.size / 1024)}KB`);
        } else {
          console.warn(`⚠️  Lock file ${lockFileName} is empty`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not verify lock file ${lockFileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      console.warn(`⚠️  Expected lock file ${lockFileName} was not created`);
      console.log(`💡 This might be normal for some package manager configurations`);
    }
  }
}
