import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { Framework, Language, PackageManager, TemplateType, UserSelections } from '../types';
import { isValidProjectName, sanitizeProjectName } from './validation';
import { isDirectoryEmpty, resolveProjectPath } from './file-system';

/**
 * Interactive prompt utilities for collecting user input
 */
export class PromptManager {
  /**
   * Collects project name from user with validation and directory checking
   */
  async collectProjectName(): Promise<string> {
    let projectName: string = '';
    let isValidName = false;

    while (!isValidName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          default: 'my-project',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Project name cannot be empty';
            }
            if (!isValidProjectName(input)) {
              const sanitized = sanitizeProjectName(input);
              return `Invalid project name. Only letters, numbers, hyphens, and underscores are allowed. Suggested: "${sanitized}"`;
            }
            return true;
          },
          filter: (input: string) => input.trim(),
        },
      ]);

      projectName = name;
      const targetPath = resolveProjectPath(projectName);

      // Check if directory exists and handle accordingly
      if (existsSync(targetPath)) {
        const isEmpty = await isDirectoryEmpty(targetPath);
        
        if (!isEmpty) {
          const { action } = await inquirer.prompt([
            {
              type: 'list',
              name: 'action',
              message: `Directory "${projectName}" already exists and is not empty. What would you like to do?`,
              choices: [
                { name: 'Choose a different name', value: 'rename' },
                { name: 'Continue anyway (may overwrite files)', value: 'continue' },
                { name: 'Cancel', value: 'cancel' },
              ],
            },
          ]);

          if (action === 'cancel') {
            console.log('Project creation cancelled.');
            process.exit(0);
          } else if (action === 'continue') {
            const { confirm } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to continue? This may overwrite existing files.',
                default: false,
              },
            ]);

            if (confirm) {
              isValidName = true;
            }
            // If not confirmed, loop continues to ask for name again
          }
          // If action is 'rename', loop continues to ask for name again
        } else {
          // Directory exists but is empty, that's fine
          isValidName = true;
        }
      } else {
        // Directory doesn't exist, that's fine
        isValidName = true;
      }
    }

    return projectName;
  }

  /**
   * Prompts user to select framework with detailed descriptions
   */
  async selectFramework(): Promise<Framework> {
    const { framework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Which framework would you like to use?',
        choices: [
          { 
            name: 'Next.js (App Router) - Full-stack React framework with server-side rendering', 
            value: Framework.NEXTJS 
          },
          { 
            name: 'React + Vite - Fast development with modern build tooling', 
            value: Framework.REACT_VITE 
          },
        ],
      },
    ]);

    return framework;
  }

  /**
   * Prompts user to select template based on framework with descriptions
   */
  async selectTemplate(framework: Framework): Promise<TemplateType> {
    let choices: { name: string; value: TemplateType }[] = [];

    if (framework === Framework.NEXTJS) {
      choices = [
        { 
          name: 'Minimal App Router - Basic Next.js setup with essential files', 
          value: TemplateType.MINIMAL 
        },
        { 
          name: 'Feature-Based Architecture - Organized by features with shared components', 
          value: TemplateType.FEATURE_BASED 
        },
        { 
          name: 'Dashboard Template - Admin dashboard with layout and navigation', 
          value: TemplateType.DASHBOARD 
        },
      ];
    } else if (framework === Framework.REACT_VITE) {
      choices = [
        { 
          name: 'Basic SPA - Simple single-page application setup', 
          value: TemplateType.BASIC_SPA 
        },
        { 
          name: 'Feature-Based Architecture - Modular structure organized by features', 
          value: TemplateType.FEATURE_BASED 
        },
        { 
          name: 'Component-Driven - Focus on reusable components and design system', 
          value: TemplateType.COMPONENT_DRIVEN 
        },
      ];
    }

    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Which template would you like to use?',
        choices,
      },
    ]);

    return template;
  }

  /**
   * Prompts user to select language with descriptions
   */
  async selectLanguage(): Promise<Language> {
    const { language } = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: 'Which language would you like to use?',
        choices: [
          { 
            name: 'TypeScript - Type-safe JavaScript with better tooling support', 
            value: Language.TYPESCRIPT 
          },
          { 
            name: 'JavaScript - Standard JavaScript without type checking', 
            value: Language.JAVASCRIPT 
          },
        ],
        default: Language.TYPESCRIPT,
      },
    ]);

    return language;
  }

  /**
   * Prompts user to select tooling options with detailed descriptions
   */
  async selectToolingOptions(): Promise<{
    includeTailwind: boolean;
    includeZustand: boolean;
    includeTanStackQuery: boolean;
    includeESLint: boolean;
    includePrettier: boolean;
  }> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeTailwind',
        message: 'Include Tailwind CSS? (Utility-first CSS framework)',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeZustand',
        message: 'Include Zustand? (Lightweight state management)',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeTanStackQuery',
        message: 'Include TanStack Query? (Powerful data fetching and caching)',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeESLint',
        message: 'Include ESLint? (Code linting and quality checks)',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includePrettier',
        message: 'Include Prettier? (Code formatting)',
        default: true,
      },
    ]);

    return answers;
  }

  /**
   * Prompts user to select package manager from available options
   */
  async selectPackageManager(availableManagers: PackageManager[]): Promise<PackageManager> {
    if (availableManagers.length === 0) {
      console.error('❌ No package managers available. Please install npm, yarn, or pnpm.');
      process.exit(1);
    }

    if (availableManagers.length === 1) {
      console.log(`📦 Using ${availableManagers[0]} (only available package manager)`);
      return availableManagers[0];
    }

    const choices = availableManagers.map(manager => {
      let description = '';
      switch (manager) {
        case PackageManager.NPM:
          description = 'npm - Node.js default package manager';
          break;
        case PackageManager.YARN:
          description = 'yarn - Fast, reliable, and secure dependency management';
          break;
        case PackageManager.PNPM:
          description = 'pnpm - Fast, disk space efficient package manager';
          break;
      }
      return { name: description, value: manager };
    });

    const { packageManager } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager would you like to use?',
        choices,
        default: availableManagers.includes(PackageManager.NPM) ? PackageManager.NPM : availableManagers[0],
      },
    ]);

    return packageManager;
  }

  /**
   * Prompts user for Git initialization
   */
  async confirmGitInit(): Promise<boolean> {
    const { initGit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Would you like to initialize a Git repository?',
        default: true,
      },
    ]);

    return initGit;
  }

  /**
   * Shows configuration summary and asks for confirmation
   */
  async confirmConfiguration(selections: UserSelections): Promise<boolean> {
    console.log('\n📋 Configuration Summary:');
    console.log(`  Project Name: ${selections.projectName}`);
    console.log(`  Framework: ${selections.framework}`);
    console.log(`  Template: ${selections.template}`);
    console.log(`  Language: ${selections.language}`);
    console.log(`  Tailwind CSS: ${selections.includeTailwind ? 'Yes' : 'No'}`);
    console.log(`  Zustand: ${selections.includeZustand ? 'Yes' : 'No'}`);
    console.log(`  TanStack Query: ${selections.includeTanStackQuery ? 'Yes' : 'No'}`);
    console.log(`  ESLint: ${selections.includeESLint ? 'Yes' : 'No'}`);
    console.log(`  Prettier: ${selections.includePrettier ? 'Yes' : 'No'}`);
    console.log(`  Package Manager: ${selections.packageManager}`);
    console.log(`  Git Init: ${selections.initializeGit ? 'Yes' : 'No'}`);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Does this look correct?',
        default: true,
      },
    ]);

    return confirm;
  }
}