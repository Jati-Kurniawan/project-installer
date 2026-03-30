import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { resolve } from 'path';
import { CLIOptions, UserSelections, ProjectConfig, Framework, Language, TemplateType, PackageManager } from '../types';
import { isValidProjectName, sanitizeProjectName } from '../utils/validation';
import { isDirectoryEmpty, resolveProjectPath } from '../utils/file-system';
import { PromptManager } from '../utils/prompts';
import { DependencyInstaller } from '../core/project-generator/dependency-installer';
import { ProjectGenerator } from '../core/project-generator/generator';
import { TemplateRegistry } from '../core/template-engine/registry';
import { SuccessReporter } from '../core/reporting/success-reporter';
import { GitService } from '../core/git/git-service';

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
    
    console.log('\n🚀 Starting project generation...');
    
    // Step 11: Initialize components
    const projectGenerator = new ProjectGenerator();
    const templateRegistry = new TemplateRegistry();
    const successReporter = new SuccessReporter();
    const gitService = new GitService();
    
    // Step 12: Convert UserSelections to ProjectConfig
    const projectConfig: ProjectConfig = {
      projectName: userSelections.projectName,
      framework: userSelections.framework,
      template: userSelections.template,
      language: userSelections.language,
      styling: { includeTailwind: userSelections.includeTailwind },
      stateManagement: { includeZustand: userSelections.includeZustand },
      dataFetching: { includeTanStackQuery: userSelections.includeTanStackQuery },
      devTools: { 
        includeESLint: userSelections.includeESLint,
        includePrettier: userSelections.includePrettier 
      },
      packageManager: userSelections.packageManager,
      gitInit: userSelections.initializeGit,
    };
    
    // Step 13: Load template
    console.log('📋 Loading template...');
    const templateDefinition = await templateRegistry.loadTemplate(userSelections.framework, userSelections.template);
    
    // Step 14: Generate project
    console.log('🔨 Generating project files...');
    const result = await projectGenerator.generateProject(projectConfig, templateDefinition);
    
    if (result.success) {
      // Step 14.5: Generate package.json with resolved dependencies
      console.log('📦 Generating package.json with dependencies...');
      await dependencyInstaller.generatePackageJson(projectConfig, templateDefinition, result.projectPath);
      
      let installResult;
      let gitResult;
      
      // Step 15: Install dependencies (if not skipped)
      if (!options.skipInstall) {
        console.log('\n📦 Installing dependencies...');
        installResult = await dependencyInstaller.installDependencies(projectConfig, result.projectPath);
        
        if (!installResult.success) {
          console.log('⚠️  Dependency installation failed, but project was created successfully.');
          console.log('You can install dependencies manually by running:');
          console.log(`  cd ${userSelections.projectName}`);
          console.log(`  ${userSelections.packageManager} install`);
        }
      }
      
      // Step 16: Handle Git initialization if not already done by ProjectGenerator
      if (userSelections.initializeGit) {
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
      
      // Step 17: Display comprehensive success summary
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