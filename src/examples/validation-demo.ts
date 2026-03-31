#!/usr/bin/env node

/**
 * Demonstration of the enhanced Joi schema validation functionality
 * This example shows how the ValidationEngine validates user selections and project configurations
 */

import { ValidationEngine } from '../core/config/validator';
import { Framework, Language, PackageManager, TemplateType } from '../types/enums';
import { UserSelections, ProjectConfig } from '../types';

const validator = new ValidationEngine();

console.log('🔍 CLI Scaffolding Tool - Validation Demo\n');

// Example 1: Valid user selections
console.log('1. Testing valid user selections:');
const validSelections: UserSelections = {
  projectName: 'my-awesome-project',
  framework: Framework.NEXTJS,
  template: TemplateType.MINIMAL,
  language: Language.TYPESCRIPT,
  includeTailwind: true,
  includeZustand: false,
  includeTanStackQuery: true,
  includeESLint: true,
  includePrettier: true,
  packageManager: PackageManager.NPM,
  initializeGit: true
};

const validResult = validator.validateUserSelections(validSelections);
console.log('Result:', validResult.isValid ? '✅ Valid' : '❌ Invalid');
if (validResult.warnings.length > 0) {
  console.log('Warnings:', validResult.warnings.map(w => w.message));
}
console.log();

// Example 2: Invalid project name (reserved)
console.log('2. Testing reserved project name:');
const reservedNameSelections: UserSelections = {
  ...validSelections,
  projectName: 'con' // Reserved Windows name
};

const reservedResult = validator.validateUserSelections(reservedNameSelections);
console.log('Result:', reservedResult.isValid ? '✅ Valid' : '❌ Invalid');
if (reservedResult.errors.length > 0) {
  console.log('Errors:', reservedResult.errors.map(e => `${e.field}: ${e.message} (${e.code})`));
}
console.log();

// Example 3: Invalid project name (starts with dot)
console.log('3. Testing project name starting with dot:');
const dotNameSelections: UserSelections = {
  ...validSelections,
  projectName: '.hidden-project'
};

const dotResult = validator.validateUserSelections(dotNameSelections);
console.log('Result:', dotResult.isValid ? '✅ Valid' : '❌ Invalid');
if (dotResult.errors.length > 0) {
  console.log('Errors:', dotResult.errors.map(e => `${e.field}: ${e.message} (${e.code})`));
}
console.log();

// Example 4: Incompatible framework-template combination
console.log('4. Testing incompatible framework-template combination:');
const incompatibleSelections: UserSelections = {
  ...validSelections,
  framework: Framework.NEXTJS,
  template: TemplateType.BASIC_SPA // React + Vite template with Next.js
};

const incompatibleResult = validator.validateUserSelections(incompatibleSelections);
console.log('Result:', incompatibleResult.isValid ? '✅ Valid' : '❌ Invalid');
if (incompatibleResult.errors.length > 0) {
  console.log('Errors:', incompatibleResult.errors.map(e => `${e.field}: ${e.message} (${e.code})`));
}
console.log();

// Example 5: Configuration with warnings
console.log('5. Testing configuration that generates warnings:');
const warningSelections: UserSelections = {
  ...validSelections,
  includeESLint: true,
  includePrettier: true, // Both ESLint and Prettier
  includeZustand: true,
  includeTanStackQuery: true // Both state management options
};

const warningResult = validator.validateUserSelections(warningSelections);
console.log('Result:', warningResult.isValid ? '✅ Valid' : '❌ Invalid');
if (warningResult.warnings.length > 0) {
  console.log('Warnings:', warningResult.warnings.map(w => `${w.field}: ${w.message} (${w.code})`));
}
console.log();

// Example 6: Project name validation with file system check
console.log('6. Testing project name with file system validation:');
const nameResult = validator.validateProjectName('test-project', process.cwd());
console.log('Result:', nameResult.isValid ? '✅ Valid' : '❌ Invalid');
if (nameResult.errors.length > 0) {
  console.log('Errors:', nameResult.errors.map(e => `${e.field}: ${e.message} (${e.code})`));
}
if (nameResult.warnings.length > 0) {
  console.log('Warnings:', nameResult.warnings.map(w => `${w.field}: ${w.message} (${w.code})`));
}
console.log();

// Example 7: Formatted validation results
console.log('7. Testing formatted validation results:');
const formattedMessages = validator.formatValidationResults(incompatibleResult);
console.log('Formatted output:');
formattedMessages.forEach(msg => console.log(msg));
console.log();

console.log('🎉 Validation demo completed!');