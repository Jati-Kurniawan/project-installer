/**
 * Supported frameworks
 */
export enum Framework {
  NEXTJS = 'nextjs',
  REACT_VITE = 'react-vite'
}

/**
 * Template types for different frameworks
 */
export type Template = 
  | 'minimal' 
  | 'feature-based' 
  | 'dashboard' 
  | 'basic-spa' 
  | 'component-driven';

/**
 * Supported programming languages
 */
export enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript'
}

/**
 * Supported package managers
 */
export enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm'
}