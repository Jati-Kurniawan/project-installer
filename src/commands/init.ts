import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { resolve } from 'path';
import { CLIOptions, UserSelections } from '../types';
import { isValidProjectName, sanitizeProjectName } from '../utils/validation';
import { isDirectoryEmpty, resolveProjectPath } from '../utils/file-system';
import { PromptManager } from '../utils/prompts';
import { DependencyInstaller } from '../core/project-generator/dependency-installer';

export async function initCommand(projectName?: string, options: CLIOptions = {}): Promise<void> {
  console.log('🚀 Welcome to Starter CLI!');
  console.log('Let\'s create your new project...\n');

  try {
    const promptManager = new PromptManager();
    const dependencyInstaller = new DependencyInstaller();

    // Step 1: Collect project name
    let finalProjectName = projectName;
    
    if (!finalProjectName) {
      finalProjectName = await promptManager.collectProjectName();
    } else {
      // Validate provided project name
      if (!isValidProjectName(finalProjectName)) {
        console.error(`❌ Invalid project name: "${finalProjectName}"`);
        const sanitized = sanitizeProjectName(finalProjectName);
        console.log(`💡 Suggested name: "${sanitized}"`);
        process.exit(1);
      }

      // Check directory availability for provided name
      const targetPath = resolveProjectPath(finalProjectName);
      if (existsSync(targetPath)) {
        const isEmpty = await isDirectoryEmpty(targetPath);
        
        if (!isEmpty && !options.force) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message: `Directory "${finalProjectName}" is not empty. Do you want to continue?`,
              default: false,
            },
          ]);

          if (!proceed) {
            console.log('Project creation cancelled.');
            process.exit(0);
          }
        }
      }
    }

    // Step 2: Framework selection
    console.log('\n🎯 Let\'s configure your project...\n');
    const framework = await promptManager.selectFramework();

    // Step 3: Template selection
    const template = await promptManager.selectTemplate(framework);

    // Step 4: Language selection
    const language = await promptManager.selectLanguage();

    // Step 5: Tooling options
    const toolingOptions = await promptManager.selectToolingOptions();

    // Step 6: Package manager detection and selection
    console.log('\n📦 Detecting available package managers...');
    const availableManagers = await dependencyInstaller.detectAvailablePackageManagers();
    const packageManager = await promptManager.selectPackageManager(availableManagers);

    // Step 7: Git initialization
    const initializeGit = await promptManager.confirmGitInit();

    // Step 8: Create user selections object
    const userSelections: UserSelections = {
      projectName: finalProjectName,
      framework,
      template,
      language,
      includeTailwind: toolingOptions.includeTailwind,
      includeZustand: toolingOptions.includeZustand,
      includeTanStackQuery: toolingOptions.includeTanStackQuery,
      includeESLint: toolingOptions.includeESLint,
      includePrettier: toolingOptions.includePrettier,
      packageManager,
      initializeGit,
    };

    // Step 9: Show configuration summary and confirm
    const confirmed = await promptManager.confirmConfiguration(userSelections);
    
    if (!confirmed) {
      console.log('Project creation cancelled.');
      process.exit(0);
    }

    // Step 10: Display next steps
    const targetPath = resolveProjectPath(finalProjectName);
    console.log('\n✅ Configuration complete!');
    console.log(`📁 Target directory: ${targetPath}`);
    
    if (options.force) {
      console.log('🔧 Force mode enabled');
    }
    
    if (options.skipInstall) {
      console.log('⏭️  Dependency installation will be skipped');
    }
    
    console.log('\n🎯 Ready to start project generation!');
    console.log('Template processing and file generation will be implemented in the next tasks.');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}