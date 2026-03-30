import { Framework, Language, Template } from './enums';

/**
 * Template definition with metadata and files
 */
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  framework: Framework;
  type: Template;
  files: TemplateFile[];
  dependencies: DependencyMap;
  devDependencies: DependencyMap;
  supportedOptions: ToolingOption[];
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