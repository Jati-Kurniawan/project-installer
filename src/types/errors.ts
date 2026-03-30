/**
 * Base error interface for all CLI errors
 */
export interface CLIError {
  message: string;
  code: string;
  category: ErrorCategory;
  recoverable: boolean;
  suggestions?: string[];
}

/**
 * Error categories for different types of failures
 */
export enum ErrorCategory {
  USER_INPUT = 'user_input',
  SYSTEM_ENVIRONMENT = 'system_environment',
  NETWORK = 'network',
  TEMPLATE_PROCESSING = 'template_processing',
  FILE_SYSTEM = 'file_system',
  VALIDATION = 'validation'
}

/**
 * File system operation errors
 */
export interface FileSystemError extends CLIError {
  category: ErrorCategory.FILE_SYSTEM;
  path?: string;
  operation: FileSystemOperation;
}

/**
 * File system operations that can fail
 */
export enum FileSystemOperation {
  CREATE_DIRECTORY = 'create_directory',
  WRITE_FILE = 'write_file',
  READ_FILE = 'read_file',
  COPY_FILE = 'copy_file',
  DELETE_FILE = 'delete_file',
  CHECK_PERMISSIONS = 'check_permissions'
}

/**
 * Network operation errors
 */
export interface NetworkError extends CLIError {
  category: ErrorCategory.NETWORK;
  operation: NetworkOperation;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Network operations that can fail
 */
export enum NetworkOperation {
  PACKAGE_INSTALLATION = 'package_installation',
  DEPENDENCY_RESOLUTION = 'dependency_resolution',
  TEMPLATE_DOWNLOAD = 'template_download',
  VERSION_CHECK = 'version_check'
}

/**
 * Template processing errors
 */
export interface TemplateError extends CLIError {
  category: ErrorCategory.TEMPLATE_PROCESSING;
  templatePath?: string;
  templateFile?: string;
  processingStage: TemplateProcessingStage;
}

/**
 * Template processing stages that can fail
 */
export enum TemplateProcessingStage {
  LOADING = 'loading',
  PARSING = 'parsing',
  VARIABLE_SUBSTITUTION = 'variable_substitution',
  CONDITIONAL_PROCESSING = 'conditional_processing',
  FILE_GENERATION = 'file_generation'
}

/**
 * System environment errors
 */
export interface SystemError extends CLIError {
  category: ErrorCategory.SYSTEM_ENVIRONMENT;
  requirement: SystemRequirement;
}

/**
 * System requirements that can be missing
 */
export enum SystemRequirement {
  NODE_VERSION = 'node_version',
  PACKAGE_MANAGER = 'package_manager',
  GIT = 'git',
  DISK_SPACE = 'disk_space',
  PERMISSIONS = 'permissions'
}

/**
 * User input validation errors
 */
export interface UserInputError extends CLIError {
  category: ErrorCategory.USER_INPUT;
  field: string;
  value?: string;
  validationRule: string;
}

/**
 * Validation errors for option compatibility
 */
export interface CompatibilityError extends CLIError {
  category: ErrorCategory.VALIDATION;
  conflictingOptions: string[];
  reason: string;
}

/**
 * Error recovery strategies
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  SKIP = 'skip',
  PROMPT_USER = 'prompt_user',
  USE_FALLBACK = 'use_fallback',
  CLEANUP_AND_EXIT = 'cleanup_and_exit'
}

/**
 * Error recovery context
 */
export interface ErrorRecoveryContext {
  error: CLIError;
  strategy: RecoveryStrategy;
  fallbackOptions?: any;
  cleanupActions?: (() => Promise<void>)[];
}