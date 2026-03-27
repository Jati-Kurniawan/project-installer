export enum Framework {
  NEXTJS = 'nextjs',
  REACT_VITE = 'react-vite'
}

export enum TemplateType {
  MINIMAL = 'minimal',
  FEATURE_BASED = 'feature-based',
  DASHBOARD = 'dashboard',
  BASIC_SPA = 'basic-spa',
  COMPONENT_DRIVEN = 'component-driven'
}

export enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript'
}

export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm'
}

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

export interface StylingOptions {
  includeTailwind: boolean;
}

export interface StateManagementOptions {
  includeZustand: boolean;
}

export interface DataFetchingOptions {
  includeTanStackQuery: boolean;
}

export interface DevToolsOptions {
  includeESLint: boolean;
  includePrettier: boolean;
}

export interface CLIOptions {
  help?: boolean;
  version?: boolean;
  force?: boolean;
  skipInstall?: boolean;
}