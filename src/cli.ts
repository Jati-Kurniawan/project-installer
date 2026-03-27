#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';

const program = new Command();

program
  .name('starter-cli')
  .description('A CLI tool for scaffolding modern web development projects')
  .version('1.0.0');

program
  .command('init')
  .description('Start the interactive project creation process')
  .action(initCommand);

program.parse();