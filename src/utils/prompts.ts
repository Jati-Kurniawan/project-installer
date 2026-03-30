import inquirer from 'inquirer';
import { Framework, Language, PackageManager, Template, UserSelections } from '../types';

/**
 * Interactive prompt utilities for collecting user input
 */
export class PromptManager {
  /**
   * Collects project name from user
   */
  async collectProjectName(): Promise<string> {
    const { projectName } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'What is your project name?',
        default: 'my-project',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Project name cannot be empty';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Project name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        },
      },
    ]);

    return projectName;
  }

  /**
   * Prompts user to select framework
   */
  async selectFramework(): Promise<Framework> {
    const { framework } = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Which framework would you like to use?',
        choices: [
          { name: 'Next.js (App Router)', value: Framework.NEXTJS },
          { name: 'React + Vite', value: Framework.REACT_VITE },
        ],
      },
    ]);

    return framework;
  }

  /**
   * Prompts user to select template based on framework
   */
  async selectTemplate(framework: Framework): Promise<Template> {
    let choices: { name: string; value: Template }[] = [];

    if (framework === Framework.NEXTJS) {
      choices = [
        { name: 'Minimal App Router', value: 'minimal' },
        { name: 'Feature-Based Architecture', value: 'feature-based' },
        { name: 'Dashboard Template', value: 'dashboard' },
      ];
    } else if (framework === Framework.REACT_VITE) {
      choices = [
        { name: 'Basic SPA', value: 'basic-spa' },
        { name: 'Feature-Based Architecture', value: 'feature-based' },
        { name: 'Component-Driven', value: 'component-driven' },
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
   * Prompts user to select language
   */
  async selectLanguage(): Promise<Language> {
    const { language } = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: 'Which language would you like to use?',
        choices: [
          { name: 'TypeScript', value: Language.TYPESCRIPT },
          { name: 'JavaScript', value: Language.JAVASCRIPT },
        ],
        default: Language.TYPESCRIPT,
      },
    ]);

    return language;
  }

  /**
   * Prompts user to select tooling options
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
        message: 'Would you like to include Tailwind CSS?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeZustand',
        message: 'Would you like to include Zustand for state management?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeTanStackQuery',
        message: 'Would you like to include TanStack Query for data fetching?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'includeESLint',
        message: 'Would you like to include ESLint?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'includePrettier',
        message: 'Would you like to include Prettier?',
        default: true,
      },
    ]);

    return answers;
  }

  /**
   * Prompts user to select package manager
   */
  async selectPackageManager(availableManagers: PackageManager[]): Promise<PackageManager> {
    if (availableManagers.length === 1) {
      return availableManagers[0];
    }

    const choices = availableManagers.map(manager => ({
      name: manager,
      value: manager,
    }));

    const { packageManager } = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        message: 'Which package manager would you like to use?',
        choices,
        default: PackageManager.NPM,
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