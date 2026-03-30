import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectConfig, Framework, GenerationResult, InstallationResult } from '../../types';

/**
 * Success reporter for displaying project generation results and next steps
 */
export class SuccessReporter {
  /**
   * Displays comprehensive success summary with project details
   */
  async displaySuccessSummary(
    config: ProjectConfig,
    generationResult: GenerationResult,
    installationResult?: InstallationResult,
    gitResult?: { success: boolean; message: string }
  ): Promise<void> {
    console.log('\n🎉 Project created successfully!');
    console.log('═'.repeat(50));
    
    // Project overview
    await this.displayProjectOverview(config, generationResult);
    
    // Installation summary
    if (installationResult) {
      await this.displayInstallationSummary(installationResult);
    }
    
    // Git summary
    if (gitResult && config.gitInit) {
      await this.displayGitSummary(gitResult);
    }
    
    // Configured tools summary
    await this.displayConfiguredTools(config);
    
    // Next steps
    await this.displayNextSteps(config);
    
    console.log('═'.repeat(50));
    console.log('🚀 Happy coding!');
  }

  /**
   * Displays project overview information
   */
  private async displayProjectOverview(config: ProjectConfig, result: GenerationResult): Promise<void> {
    console.log('\n📁 Project Overview:');
    console.log(`   Name: ${config.projectName}`);
    console.log(`   Location: ${path.resolve(result.projectPath)}`);
    console.log(`   Framework: ${this.getFrameworkDisplayName(config.framework)}`);
    console.log(`   Template: ${this.getTemplateDisplayName(config.template)}`);
    console.log(`   Language: ${config.language === 'typescript' ? 'TypeScript' : 'JavaScript'}`);
    console.log(`   Files created: ${result.filesCreated.length}`);
    console.log(`   Generation time: ${result.duration}ms`);
  }

  /**
   * Displays installation summary
   */
  private async displayInstallationSummary(installationResult: InstallationResult): Promise<void> {
    console.log('\n📦 Dependencies:');
    if (installationResult.success) {
      console.log(`   ✅ Successfully installed ${installationResult.installedPackages.length} packages`);
      console.log(`   ⏱️  Installation time: ${Math.round(installationResult.duration / 1000)}s`);
      
      // Show some key packages
      const keyPackages = this.getKeyPackages(installationResult.installedPackages);
      if (keyPackages.length > 0) {
        console.log(`   📋 Key packages: ${keyPackages.slice(0, 5).join(', ')}${keyPackages.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log('   ⚠️  Dependency installation failed');
      if (installationResult.errors.length > 0) {
        console.log(`   Error: ${installationResult.errors[0].message}`);
      }
    }
  }

  /**
   * Displays Git initialization summary
   */
  private async displayGitSummary(gitResult: { success: boolean; message: string }): Promise<void> {
    console.log('\n🔧 Git Repository:');
    if (gitResult.success) {
      console.log(`   ✅ ${gitResult.message}`);
      console.log('   📄 .gitignore file configured for your framework');
    } else {
      console.log(`   ⚠️  ${gitResult.message}`);
    }
  }

  /**
   * Displays configured tools and features
   */
  private async displayConfiguredTools(config: ProjectConfig): Promise<void> {
    console.log('\n🛠️  Configured Tools:');
    
    const tools: string[] = [];
    
    if (config.styling.includeTailwind) {
      tools.push('✅ Tailwind CSS - Utility-first CSS framework');
    }
    
    if (config.stateManagement.includeZustand) {
      tools.push('✅ Zustand - Lightweight state management');
    }
    
    if (config.dataFetching.includeTanStackQuery) {
      tools.push('✅ TanStack Query - Data fetching and caching');
    }
    
    if (config.devTools.includeESLint) {
      tools.push('✅ ESLint - Code linting and quality checks');
    }
    
    if (config.devTools.includePrettier) {
      tools.push('✅ Prettier - Code formatting');
    }
    
    if (tools.length === 0) {
      console.log('   📦 Minimal setup - no additional tools configured');
    } else {
      tools.forEach(tool => console.log(`   ${tool}`));
    }
  }

  /**
   * Displays next steps and recommended actions
   */
  private async displayNextSteps(config: ProjectConfig): Promise<void> {
    console.log('\n🚀 Next Steps:');
    console.log(`   1. cd ${config.projectName}`);
    
    // Development server command
    const devCommand = this.getDevCommand(config);
    console.log(`   2. ${devCommand}`);
    
    // Additional recommendations based on configuration
    const recommendations = this.getRecommendations(config);
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 3}. ${rec}`);
      });
    }
    
    // Useful commands
    console.log('\n📚 Useful Commands:');
    this.displayUsefulCommands(config);
  }

  /**
   * Displays useful commands for the project
   */
  private displayUsefulCommands(config: ProjectConfig): void {
    const pm = config.packageManager;
    
    console.log(`   Build for production: ${pm} run build`);
    
    if (config.framework === Framework.NEXTJS) {
      console.log(`   Start production server: ${pm} run start`);
    } else if (config.framework === Framework.REACT_VITE) {
      console.log(`   Preview production build: ${pm} run preview`);
    }
    
    if (config.devTools.includeESLint) {
      console.log(`   Run linting: ${pm} run lint`);
    }
    
    if (config.devTools.includePrettier) {
      console.log(`   Format code: ${pm} run format`);
    }
    
    if (config.gitInit) {
      console.log('   Make your first commit: git add . && git commit -m "Initial commit"');
    }
  }

  /**
   * Gets the development server command
   */
  private getDevCommand(config: ProjectConfig): string {
    return `${config.packageManager} run dev`;
  }

  /**
   * Gets framework display name
   */
  private getFrameworkDisplayName(framework: Framework): string {
    switch (framework) {
      case Framework.NEXTJS:
        return 'Next.js (App Router)';
      case Framework.REACT_VITE:
        return 'React + Vite';
      default:
        return framework;
    }
  }

  /**
   * Gets template display name
   */
  private getTemplateDisplayName(template: string): string {
    switch (template) {
      case 'minimal':
        return 'Minimal';
      case 'feature-based':
        return 'Feature-Based Architecture';
      case 'dashboard':
        return 'Dashboard Template';
      case 'basic-spa':
        return 'Basic SPA';
      case 'component-driven':
        return 'Component-Driven';
      default:
        return template;
    }
  }

  /**
   * Gets key packages from installed packages list
   */
  private getKeyPackages(packages: string[]): string[] {
    const keyPackageNames = [
      'react', 'next', 'vite', 'typescript', 'tailwindcss', 
      'zustand', '@tanstack/react-query', 'eslint', 'prettier'
    ];
    
    return packages.filter(pkg => 
      keyPackageNames.some(key => pkg.toLowerCase().includes(key))
    );
  }

  /**
   * Gets recommendations based on configuration
   */
  private getRecommendations(config: ProjectConfig): string[] {
    const recommendations: string[] = [];
    
    if (config.framework === Framework.NEXTJS) {
      recommendations.push('Explore the Next.js App Router documentation for advanced features');
      
      if (config.styling.includeTailwind) {
        recommendations.push('Check out the Tailwind CSS components in your project');
      }
    } else if (config.framework === Framework.REACT_VITE) {
      recommendations.push('Take advantage of Vite\'s fast hot module replacement during development');
    }
    
    if (config.stateManagement.includeZustand) {
      recommendations.push('Review the Zustand store setup in your project');
    }
    
    if (config.dataFetching.includeTanStackQuery) {
      recommendations.push('Explore TanStack Query for efficient data fetching patterns');
    }
    
    if (config.devTools.includeESLint && config.devTools.includePrettier) {
      recommendations.push('Set up your editor to run ESLint and Prettier on save');
    }
    
    if (config.gitInit) {
      recommendations.push('Consider setting up a remote repository (GitHub, GitLab, etc.)');
    }
    
    return recommendations;
  }

  /**
   * Displays a simple success message for minimal output
   */
  displaySimpleSuccess(projectName: string, projectPath: string): void {
    console.log(`\n✅ Project "${projectName}" created successfully!`);
    console.log(`📁 Location: ${path.resolve(projectPath)}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${projectName}`);
    console.log(`  npm run dev`);
    console.log('\n🚀 Happy coding!');
  }
}