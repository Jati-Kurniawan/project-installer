import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { resolve } from 'path';
import { CLIOptions } from '../types';
import { isValidProjectName, sanitizeProjectName } from '../utils/validation';
import { isDirectoryEmpty, resolveProjectPath } from '../utils/file-system';

export async function initCommand(projectName?: string, options: CLIOptions = {}): Promise<void> {
  console.log('🚀 Welcome to Starter CLI!');
  console.log('Let\'s create your new project...\n');

  try {
    // Handle project name argument or prompt for it
    let finalProjectName = projectName;
    
    if (!finalProjectName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Project name is required';
            }
            if (!isValidProjectName(input)) {
              const sanitized = sanitizeProjectName(input);
              return `Invalid project name. Suggested: "${sanitized}"`;
            }
            return true;
          },
          filter: (input: string) => input.trim(),
        },
      ]);
      finalProjectName = name;
    } else {
      // Validate provided project name
      if (!isValidProjectName(finalProjectName)) {
        console.error(`❌ Invalid project name: "${finalProjectName}"`);
        const sanitized = sanitizeProjectName(finalProjectName);
        console.log(`💡 Suggested name: "${sanitized}"`);
        process.exit(1);
      }
    }

    // At this point finalProjectName is guaranteed to be a string
    const projectNameString = finalProjectName as string;

    // Determine target directory
    const targetPath = resolveProjectPath(projectNameString);
    const currentDir = process.cwd();
    const isCurrentDir = targetPath === currentDir;
    
    // Check if directory exists and is not empty
    if (existsSync(targetPath)) {
      const isEmpty = await isDirectoryEmpty(targetPath);
      
      if (!isEmpty && !options.force) {
        const message = isCurrentDir 
          ? 'Current directory is not empty. Do you want to continue?'
          : `Directory "${projectNameString}" is not empty. Do you want to continue?`;
          
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message,
            default: false,
          },
        ]);

        if (!proceed) {
          console.log('Project creation cancelled.');
          process.exit(0);
        }
      } else if (!isEmpty && options.force) {
        console.log('🔧 Force mode enabled - proceeding with non-empty directory');
      }
    }

    console.log(`✅ Project name: ${projectNameString}`);
    console.log(`📁 Target directory: ${targetPath}`);
    
    if (options.force) {
      console.log('🔧 Force mode enabled');
    }
    
    if (options.skipInstall) {
      console.log('⏭️  Dependency installation will be skipped');
    }
    
    console.log('\n🎯 Ready to start project scaffolding!');
    console.log('Interactive prompts for framework and tooling selection will be implemented in the next tasks.');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}