import { Framework, Language, TemplateType } from './enums';

/**
 * Template metadata from template.json
 */
export interface TemplateMetadata {
  name: string;
  description: string;
  framework: Framework;
  type: TemplateType;
  version: string;
  author: string;
  supportedLanguages: Language[];
  supportedOptions: {
    styling: string[];
    stateManagement: string[];
    dataFetching: string[];
    devTools: string[];
  };
  dependencies: {
    base: DependencyMap;
    conditional: ConditionalDependencies;
  };
  files: {
    base: string[];
    conditional: ConditionalFiles;
  };
}

/**
 * Template definition with metadata and files
 */
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  framework: Framework;
  type: TemplateType;
  version: string;
  author: string;
  supportedLanguages: Language[];
  supportedOptions: ToolingOption[];
  files: TemplateFile[];
  dependencies: DependencyMap;
  devDependencies: DependencyMap;
  templatePath: string;
}

/**
 * Template file with content and metadata
 */
export interface TemplateFile {
  path: string;
  content: string;
  encoding?: string;
  conditional?: boolean;
  conditions?: string[];
}

/**
 * Processed template file ready for writing
 */
export interface ProcessedFile {
  path: string;
  content: string;
  encoding: string;
}

/**
 * Template context for variable replacement
 */
export interface TemplateContext {
  projectName: string;
  framework: Framework;
  language: Language;
  options: {
    styling: { includeTailwind: boolean };
    stateManagement: { includeZustand: boolean };
    dataFetching: { includeTanStackQuery: boolean };
    devTools: { includeESLint: boolean; includePrettier: boolean };
  };
  packageManager: string;
}

/**
 * Dependency mapping for package.json
 */
export interface DependencyMap {
  [packageName: string]: string;
}

/**
 * Conditional dependencies based on selected options
 */
export interface ConditionalDependencies {
  [condition: string]: DependencyMap;
}

/**
 * Conditional files based on selected options
 */
export interface ConditionalFiles {
  [condition: string]: string[];
}

/**
 * Tooling options supported by templates
 */
export type ToolingOption = 
  | 'typescript'
  | 'javascript'
  | 'tailwind'
  | 'zustand'
  | 'tanstack-query'
  | 'eslint'
  | 'prettier';

/**
 * Directory structure definition
 */
export interface DirectoryStructure {
  name: string;
  path: string;
  children?: DirectoryStructure[];
}