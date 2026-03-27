import inquirer from 'inquirer';
import { existsSync } from 'fs-extra';
import { resolve } from 'path';

export async function initCommand(): Promise<void> {
  console.log('🚀 Welcome to Starter CLI!');
  console.log('Let\'s create your new project...\n');

  try {
    // Check if current directory is empty
    const currentDir = process.cwd();
    const isEmpty = await isDirectoryEmpty(currentDir);
    
    if (!isEmpty) {
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Current directory is not empty. Do you want to continue?',
          default: false,
        },
      ]);

      if (!proceed) {
        console.log('Project creation cancelled.');
        process.exit(0);
      }
    }

    console.log('✅ Ready to start project scaffolding!');
    console.log('Interactive prompts will be implemented in the next tasks.');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const fs = await import('fs-extra');
    const files = await fs.readdir(dirPath);
    // Filter out hidden files and .kiro directory for this project
    const visibleFiles = files.filter(file => !file.startsWith('.'));
    return visibleFiles.length === 0;
  } catch {
    return true;
  }
}