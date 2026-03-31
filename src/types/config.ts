import { Framework, Language, PackageManager, TemplateType } from './enums';

/**
 * User selections from interactive prompts
 */
export interface UserSelections {
  projectName: string;
  framework: Framework;
  template: TemplateType;
  language: Language;
  includeTailwind: boolean;
  includeZustand: boolean;
  includeTanStackQuery: boolean;
  includeESLint: boolean;
  includePrettier: boolean;
  packageManager: PackageManager;
  initializeGit: boolean;
}

/**
 * Complete project configuration after resolution
 */
export interface ProjectConfig {
  projectName: string;
  framework: Framework;
  template: TemplateType;
  language: Language;
  styling: StylingOptions;
  stateManagement: StateManagementOptions;
  dataFetching: DataFetchingOptions;
  devTools: DevToolsOptions;
  packageManager: PackageManager;
  gitInit: boolean;
}

/**
 * Styling configuration options
 */
export interface StylingOptions {
  includeTailwind: boolean;
}

/**
 * State management configuration options
 */
export interface StateManagementOptions {
  includeZustand: boolean;
}

/**
 * Data fetching configuration options
 */
export interface DataFetchingOptions {
  includeTanStackQuery: boolean;
}

/**
 * Development tools configuration options
 */
export interface DevToolsOptions {
  includeESLint: boolean;
  includePrettier: boolean;
}

/**
 * CLI command options
 */
export interface CLIOptions {
  force?: boolean;
  skipInstall?: boolean;
  help?: boolean;
  version?: boolean;
}