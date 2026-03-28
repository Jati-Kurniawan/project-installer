#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../commands/init';
import { CLIOptions } from '../types';

const program = new Command();

program
  .name('starter-cli')
  .description('A CLI tool for scaffolding modern web development projects')
  .version('1.0.0');

// Init command with options and argument parsing
program
  .command('init [project-name]')
  .description('Start the interactive project creation process')
  .option('-f, --force', 'Force project creation even in non-empty directory')
  .option('--skip-install', 'Skip dependency installation')
  .action(async (...args: any[]) => {
    try {
      const projectName = args[0];
      const options = args[1]; // Options are the second argument
      
      // Convert commander options to our CLIOptions interface
      const cliOptions: CLIOptions = {
        force: options?.force || false,
        skipInstall: options?.skipInstall || false,
      };
      await initCommand(projectName, cliOptions);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(`❌ Unknown command: ${operands[0]}`);
  console.log('Run "starter-cli --help" for available commands.');
  process.exit(1);
});

// Parse arguments and handle errors
try {
  program.parse();
} catch (error) {
  console.error('❌ Error parsing command:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}