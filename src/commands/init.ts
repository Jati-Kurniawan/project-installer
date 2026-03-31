import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { CLIOptions, UserSelections, ProjectConfig } from '../types';
import { isValidProjectName, sanitizeProjectName } from '../utils/validation';
import { isDirectoryEmpty, resolveProjectPath } from '../utils/file-system';
import { PromptManager } from '../utils/prompts';
import { DependencyInstaller } from '../core/project-generator/dependency-installer';
import { ProjectGenerator } from '../core/project-generator/generator';
import { TemplateRegistry } from '../core/template-engine/registry';
import { SuccessReporter } from '../core/reporting/success-reporter';
import { GitService } from '../core/git/git-service';
import { ConfigurationResolver } from '../core/config/resolver';
import { ValidationEngine } from '../core/config/validator';

export async function initCommand(projectName?: string, options: CLIOptions = {}): Promise<void> {
  console.log('🚀 Welcome to Starter CLI!');
  console.log('Let\'s create your new project...\n');

  try {
    // Initialize all core components
    const promptManager = new PromptManager();
    const configurationResolver = new ConfigurationResolver();
    const validationEngine = new ValidationEngine();
    const dependencyInstaller = new DependencyInstaller();
    const projectGenerator = new ProjectGenerator();
    const templateRegistry = new TemplateRegistry();
    const successReporter = new SuccessReporter();
    const gitService = new GitService();

    // Step 1: Collect project name
    let finalProjectName = projectName;
    
    if (!finalProjectName) {
      finalProjectName = await promptManager.collectProjectName();
    } else {
      // Validate provided project name using ValidationEngine
      const targetPath = resolveProjectPath('');
      const nameValidation = validationEngine.validateProjectName(finalProjectName, targetPath);
      
      if (!nameValidation.isValid) {
        console.error(`❌ Invalid project name: "${finalProjectName}"`);
        nameValidation.errors.forEach(error => {
          console.error(`  • ${error.message}`);
        });
        const sanitized = sanitizeProjectName(finalProjectName);
        console.log(`💡 Suggested name: "${sanitized}"`);
        process.exit(1);
      }

      // Display warnings if any
      if (nameValidation.warnings.length > 0) {
        console.log('⚠️  Project name warnings:');
        nameValidation.warnings.forEach(warning => {
          console.log(`  • ${warning.message}`);
        });
      }

      // Check directory availability for provided name
      const targetPath2 = resolveProjectPath(finalProjectName);
      if (existsSync(targetPath2)) {
        const isEmpty = await isDirectoryEmpty(targetPath2);
        
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
    const templateType = await promptManager.selectTemplate(framework);

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
      template: templateType,
      language,
      includeTailwind: toolingOptions.includeTailwind,
      includeZustand: toolingOptions.includeZustand,
      includeTanStackQuery: toolingOptions.includeTanStackQuery,
      includeESLint: toolingOptions.includeESLint,
      includePrettier: toolingOptions.includePrettier,
      packageManager,
      initializeGit,
    };

    // Step 9: Validate user selections using ValidationEngine
    console.log('\n🔍 Validating configuration...');
    const selectionValidation = validationEngine.validateUserSelections(userSelections);
    
    if (!selectionValidation.isValid) {
      console.error('\n❌ Configuration validation failed:');
      selectionValidation.errors.forEach(error => {
        console.error(`  • ${error.field}: ${error.message}`);
      });
      process.exit(1);
    }

    // Display warnings if any
    if (selectionValidation.warnings.length > 0) {
      console.log('\n⚠️  Configuration warnings:');
      selectionValidation.warnings.forEach(warning => {
        console.log(`  • ${warning.field}: ${warning.message}`);
      });
    }

    // Step 10: Resolve configuration using ConfigurationResolver
    const projectConfig = configurationResolver.resolveConfiguration(userSelections);

    // Step 11: Perform comprehensive validation
    const targetPath = resolveProjectPath(finalProjectName);
    const completeValidation = validationEngine.validateComplete(projectConfig, targetPath);
    
    if (!completeValidation.isValid) {
      console.error('\n❌ Final validation failed:');
      completeValidation.errors.forEach(error => {
        console.error(`  • ${error.field}: ${error.message}`);
      });
      process.exit(1);
    }

    // Display final warnings
    if (completeValidation.warnings.length > 0) {
      console.log('\n⚠️  Final warnings:');
      completeValidation.warnings.forEach(warning => {
        console.log(`  • ${warning.field}: ${warning.message}`);
      });
    }

    // Step 12: Show configuration summary and confirm
    const confirmed = await promptManager.confirmConfiguration(userSelections);
    
    if (!confirmed) {
      console.log('Project creation cancelled.');
      process.exit(0);
    }

    // Step 13: Display next steps
    console.log('\n✅ Configuration complete!');
    console.log(`📁 Target directory: ${targetPath}`);
    
    if (options.force) {
      console.log('🔧 Force mode enabled');
    }
    
    if (options.skipInstall) {
      console.log('⏭️  Dependency installation will be skipped');
    }
    
    console.log('\n🚀 Starting project generation...');
    
    // Step 14: Load template
    console.log('📋 Loading template...');
    const templateDefinition = await templateRegistry.loadTemplate(projectConfig.framework, projectConfig.template);
    
    // Step 15: Generate project
    console.log('🔨 Generating project files...');
    const result = await projectGenerator.generateProject(projectConfig, templateDefinition);
    
    if (result.success) {
      // Step 16: Generate package.json with resolved dependencies
      console.log('📦 Generating package.json with dependencies...');
      await dependencyInstaller.generatePackageJson(projectConfig, templateDefinition, result.projectPath);
      
      let installResult;
      let gitResult;
      
      // Step 17: Install dependencies (if not skipped)
      if (!options.skipInstall) {
        console.log('\n📦 Installing dependencies...');
        installResult = await dependencyInstaller.installDependencies(projectConfig, result.projectPath);
        
        if (!installResult.success) {
          console.log('⚠️  Dependency installation failed, but project was created successfully.');
          console.log('You can install dependencies manually by running:');
          console.log(`  cd ${projectConfig.projectName}`);
          console.log(`  ${projectConfig.packageManager} install`);
        }
      }
      
      // Step 18: Handle Git initialization if not already done by ProjectGenerator
      if (projectConfig.gitInit) {
        console.log('\n🔧 Setting up Git repository...');
        
        // Check if Git was already initialized by ProjectGenerator
        const gitAlreadyInitialized = result.filesCreated.includes('.gitignore');
        
        if (!gitAlreadyInitialized) {
          // Initialize Git manually if not done during project generation
          const gitInitResult = await gitService.initializeRepository(result.projectPath);
          const gitignoreResult = await gitService.createGitignore(result.projectPath, projectConfig);
          
          gitResult = {
            success: gitInitResult.success && gitignoreResult.success,
            message: gitInitResult.success ? gitInitResult.message : gitInitResult.message
          };
        } else {
          gitResult = {
            success: true,
            message: 'Git repository initialized successfully.'
          };
        }
      }
      
      // Step 19: Display comprehensive success summary
      await successReporter.displaySuccessSummary(
        projectConfig,
        result,
        installResult,
        gitResult
      );
      
    } else {
      console.error('\n❌ Project generation failed!');
      if (result.errors.length > 0) {
        console.error('Errors:');
        result.errors.forEach(error => {
          console.error(`  - ${error.message}`);
        });
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}