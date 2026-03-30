/**
 * Project generation result
 */
export interface GenerationResult {
  success: boolean;
  projectPath: string;
  filesCreated: string[];
  errors: GenerationError[];
  duration: number;
}

/**
 * Generation error details
 */
export interface GenerationError {
  message: string;
  code: string;
  file?: string;
}

/**
 * Package installation result
 */
export interface InstallationResult {
  success: boolean;
  installedPackages: string[];
  errors: InstallationError[];
  duration: number;
}

/**
 * Installation error details
 */
export interface InstallationError {
  message: string;
  code: string;
  package?: string;
}