import { 
  CLIError, 
  ErrorCategory, 
  FileSystemError, 
  NetworkError, 
  TemplateError, 
  SystemError, 
  UserInputError, 
  CompatibilityError,
  RecoveryStrategy,
  ErrorRecoveryContext,
  FileSystemOperation,
  NetworkOperation,
  TemplateProcessingStage,
  SystemRequirement
} from '../types/errors';
import { Logger } from './logger';
import * as fs from 'fs-extra';

/**
 * Comprehensive error handler for CLI operations
 */
export class ErrorHandler {
  private static retryAttempts = new Map<string, number>();
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 second base delay

  /**
   * Handles any CLI error with appropriate recovery strategy
   */
  static async handleError(error: CLIError, context?: any): Promise<ErrorRecoveryContext> {
    Logger.error(`${error.category.toUpperCase()}: ${error.message}`);
    
    if (error.suggestions && error.suggestions.length > 0) {
      Logger.info('Suggestions:');
      error.suggestions.forEach(suggestion => Logger.info(`  • ${suggestion}`));
    }

    const recoveryContext: ErrorRecoveryContext = {
      error,
      strategy: this.determineRecoveryStrategy(error),
      cleanupActions: []
    };

    switch (error.category) {
      case ErrorCategory.FILE_SYSTEM:
        return this.handleFileSystemError(error as FileSystemError, recoveryContext);
      case ErrorCategory.NETWORK:
        return this.handleNetworkError(error as NetworkError, recoveryContext);
      case ErrorCategory.TEMPLATE_PROCESSING:
        return this.handleTemplateError(error as TemplateError, recoveryContext);
      case ErrorCategory.SYSTEM_ENVIRONMENT:
        return this.handleSystemError(error as SystemError, recoveryContext);
      case ErrorCategory.USER_INPUT:
        return this.handleUserInputError(error as UserInputError, recoveryContext);
      case ErrorCategory.VALIDATION:
        return this.handleValidationError(error as CompatibilityError, recoveryContext);
      default:
        return recoveryContext;
    }
  }

  /**
   * Handles file system errors with appropriate recovery
   */
  private static async handleFileSystemError(
    error: FileSystemError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    switch (error.operation) {
      case FileSystemOperation.CREATE_DIRECTORY:
        if (error.path) {
          context.cleanupActions?.push(async () => {
            try {
              await fs.remove(error.path!);
              Logger.info(`Cleaned up directory: ${error.path}`);
            } catch (cleanupError) {
              Logger.warn(`Failed to cleanup directory ${error.path}: ${cleanupError}`);
            }
          });
        }
        break;

      case FileSystemOperation.WRITE_FILE:
        if (error.path) {
          context.cleanupActions?.push(async () => {
            try {
              if (await fs.pathExists(error.path!)) {
                await fs.remove(error.path!);
                Logger.info(`Cleaned up file: ${error.path}`);
              }
            } catch (cleanupError) {
              Logger.warn(`Failed to cleanup file ${error.path}: ${cleanupError}`);
            }
          });
        }
        break;

      case FileSystemOperation.CHECK_PERMISSIONS:
        context.strategy = RecoveryStrategy.PROMPT_USER;
        context.fallbackOptions = {
          message: 'Permission denied. Try running with elevated permissions or choose a different directory.',
          actions: ['retry', 'change_directory', 'exit']
        };
        break;
    }

    return context;
  }

  /**
   * Handles network errors with retry mechanisms
   */
  private static async handleNetworkError(
    error: NetworkError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    const retryKey = `${error.operation}_${error.code}`;
    const currentRetries = this.retryAttempts.get(retryKey) || 0;

    if (currentRetries < this.maxRetries && error.recoverable) {
      context.strategy = RecoveryStrategy.RETRY;
      this.retryAttempts.set(retryKey, currentRetries + 1);
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, currentRetries);
      Logger.info(`Retrying in ${delay}ms... (attempt ${currentRetries + 1}/${this.maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      // Max retries reached or not recoverable
      context.strategy = RecoveryStrategy.USE_FALLBACK;
      
      switch (error.operation) {
        case NetworkOperation.PACKAGE_INSTALLATION:
          context.fallbackOptions = {
            message: 'Package installation failed. You can install dependencies manually later.',
            manualCommand: 'npm install',
            skipInstallation: true
          };
          break;
        
        case NetworkOperation.DEPENDENCY_RESOLUTION:
          context.fallbackOptions = {
            message: 'Dependency resolution failed. Using default versions.',
            useDefaultVersions: true
          };
          break;
      }
    }

    return context;
  }

  /**
   * Handles template processing errors
   */
  private static async handleTemplateError(
    error: TemplateError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    switch (error.processingStage) {
      case TemplateProcessingStage.LOADING:
        context.strategy = RecoveryStrategy.USE_FALLBACK;
        context.fallbackOptions = {
          message: 'Template loading failed. Using minimal template.',
          useMinimalTemplate: true
        };
        break;

      case TemplateProcessingStage.VARIABLE_SUBSTITUTION:
        context.strategy = RecoveryStrategy.USE_FALLBACK;
        context.fallbackOptions = {
          message: 'Variable substitution failed. Using default values.',
          useDefaultValues: true
        };
        break;

      case TemplateProcessingStage.FILE_GENERATION:
        if (error.templateFile) {
          context.strategy = RecoveryStrategy.SKIP;
          context.fallbackOptions = {
            message: `Skipping problematic file: ${error.templateFile}`,
            skipFile: error.templateFile
          };
        }
        break;
    }

    return context;
  }

  /**
   * Handles system environment errors
   */
  private static async handleSystemError(
    error: SystemError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    switch (error.requirement) {
      case SystemRequirement.PACKAGE_MANAGER:
        context.strategy = RecoveryStrategy.USE_FALLBACK;
        context.fallbackOptions = {
          message: 'No package manager detected. Skipping dependency installation.',
          skipInstallation: true,
          manualInstructions: 'Install Node.js and npm, then run: npm install'
        };
        break;

      case SystemRequirement.GIT:
        context.strategy = RecoveryStrategy.SKIP;
        context.fallbackOptions = {
          message: 'Git not available. Skipping repository initialization.',
          skipGitInit: true
        };
        break;

      case SystemRequirement.DISK_SPACE:
        context.strategy = RecoveryStrategy.CLEANUP_AND_EXIT;
        context.fallbackOptions = {
          message: 'Insufficient disk space. Please free up space and try again.'
        };
        break;

      case SystemRequirement.PERMISSIONS:
        context.strategy = RecoveryStrategy.PROMPT_USER;
        context.fallbackOptions = {
          message: 'Permission denied. Try running with elevated permissions or choose a different directory.',
          actions: ['retry_with_sudo', 'change_directory', 'exit']
        };
        break;
    }

    return context;
  }

  /**
   * Handles user input validation errors
   */
  private static async handleUserInputError(
    error: UserInputError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    context.strategy = RecoveryStrategy.PROMPT_USER;
    context.fallbackOptions = {
      field: error.field,
      message: error.message,
      currentValue: error.value,
      validationRule: error.validationRule
    };

    return context;
  }

  /**
   * Handles validation and compatibility errors
   */
  private static async handleValidationError(
    error: CompatibilityError, 
    context: ErrorRecoveryContext
  ): Promise<ErrorRecoveryContext> {
    context.strategy = RecoveryStrategy.PROMPT_USER;
    context.fallbackOptions = {
      message: `Incompatible options detected: ${error.conflictingOptions.join(', ')}`,
      reason: error.reason,
      conflictingOptions: error.conflictingOptions,
      suggestedActions: [
        'Modify selections to resolve conflicts',
        'Use recommended defaults',
        'Continue with warnings'
      ]
    };

    return context;
  }

  /**
   * Determines the appropriate recovery strategy for an error
   */
  private static determineRecoveryStrategy(error: CLIError): RecoveryStrategy {
    if (!error.recoverable) {
      return RecoveryStrategy.CLEANUP_AND_EXIT;
    }

    switch (error.category) {
      case ErrorCategory.NETWORK:
        return RecoveryStrategy.RETRY;
      case ErrorCategory.USER_INPUT:
      case ErrorCategory.VALIDATION:
        return RecoveryStrategy.PROMPT_USER;
      case ErrorCategory.TEMPLATE_PROCESSING:
        return RecoveryStrategy.USE_FALLBACK;
      case ErrorCategory.FILE_SYSTEM:
        return RecoveryStrategy.CLEANUP_AND_EXIT;
      case ErrorCategory.SYSTEM_ENVIRONMENT:
        return RecoveryStrategy.USE_FALLBACK;
      default:
        return RecoveryStrategy.CLEANUP_AND_EXIT;
    }
  }

  /**
   * Executes cleanup actions for partial project cleanup
   */
  static async executeCleanup(cleanupActions: (() => Promise<void>)[]): Promise<void> {
    if (cleanupActions.length === 0) {
      return;
    }

    Logger.info('Cleaning up partially created project...');
    
    for (const cleanup of cleanupActions) {
      try {
        await cleanup();
      } catch (error) {
        Logger.warn(`Cleanup action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    Logger.info('Cleanup completed');
  }

  /**
   * Clears retry attempts for a fresh start
   */
  static clearRetryAttempts(): void {
    this.retryAttempts.clear();
  }

  /**
   * Creates a file system error
   */
  static createFileSystemError(
    message: string,
    operation: FileSystemOperation,
    path?: string,
    recoverable = true
  ): FileSystemError {
    return {
      message,
      code: `FS_${operation.toUpperCase()}`,
      category: ErrorCategory.FILE_SYSTEM,
      recoverable,
      operation,
      path,
      suggestions: this.getFileSystemSuggestions(operation)
    };
  }

  /**
   * Creates a network error
   */
  static createNetworkError(
    message: string,
    operation: NetworkOperation,
    recoverable = true
  ): NetworkError {
    return {
      message,
      code: `NET_${operation.toUpperCase()}`,
      category: ErrorCategory.NETWORK,
      recoverable,
      operation,
      suggestions: this.getNetworkSuggestions(operation)
    };
  }

  /**
   * Creates a template processing error
   */
  static createTemplateError(
    message: string,
    stage: TemplateProcessingStage,
    templatePath?: string,
    templateFile?: string,
    recoverable = true
  ): TemplateError {
    return {
      message,
      code: `TEMPLATE_${stage.toUpperCase()}`,
      category: ErrorCategory.TEMPLATE_PROCESSING,
      recoverable,
      processingStage: stage,
      templatePath,
      templateFile,
      suggestions: this.getTemplateSuggestions(stage)
    };
  }

  /**
   * Creates a system environment error
   */
  static createSystemError(
    message: string,
    requirement: SystemRequirement,
    recoverable = true
  ): SystemError {
    return {
      message,
      code: `SYS_${requirement.toUpperCase()}`,
      category: ErrorCategory.SYSTEM_ENVIRONMENT,
      recoverable,
      requirement,
      suggestions: this.getSystemSuggestions(requirement)
    };
  }

  /**
   * Creates a user input validation error
   */
  static createUserInputError(
    message: string,
    field: string,
    validationRule: string,
    value?: string
  ): UserInputError {
    return {
      message,
      code: `INPUT_${field.toUpperCase()}_INVALID`,
      category: ErrorCategory.USER_INPUT,
      recoverable: true,
      field,
      value,
      validationRule,
      suggestions: this.getUserInputSuggestions(field, validationRule)
    };
  }

  /**
   * Creates a compatibility validation error
   */
  static createCompatibilityError(
    message: string,
    conflictingOptions: string[],
    reason: string
  ): CompatibilityError {
    return {
      message,
      code: 'VALIDATION_COMPATIBILITY',
      category: ErrorCategory.VALIDATION,
      recoverable: true,
      conflictingOptions,
      reason,
      suggestions: this.getCompatibilitySuggestions(conflictingOptions)
    };
  }

  /**
   * Gets suggestions for file system errors
   */
  private static getFileSystemSuggestions(operation: FileSystemOperation): string[] {
    switch (operation) {
      case FileSystemOperation.CREATE_DIRECTORY:
        return [
          'Check if you have write permissions in the target directory',
          'Ensure the parent directory exists',
          'Try running with elevated permissions'
        ];
      case FileSystemOperation.WRITE_FILE:
        return [
          'Check if the file is not locked by another process',
          'Verify you have write permissions',
          'Ensure sufficient disk space is available'
        ];
      case FileSystemOperation.CHECK_PERMISSIONS:
        return [
          'Run the command with elevated permissions (sudo/administrator)',
          'Choose a different target directory',
          'Check directory ownership and permissions'
        ];
      default:
        return ['Check file system permissions and available disk space'];
    }
  }

  /**
   * Gets suggestions for network errors
   */
  private static getNetworkSuggestions(operation: NetworkOperation): string[] {
    switch (operation) {
      case NetworkOperation.PACKAGE_INSTALLATION:
        return [
          'Check your internet connection',
          'Try using a different package manager',
          'Clear package manager cache',
          'Install dependencies manually after project creation'
        ];
      case NetworkOperation.DEPENDENCY_RESOLUTION:
        return [
          'Check if the package registry is accessible',
          'Try using different package versions',
          'Use offline mode if packages are cached'
        ];
      default:
        return ['Check your internet connection and try again'];
    }
  }

  /**
   * Gets suggestions for template processing errors
   */
  private static getTemplateSuggestions(stage: TemplateProcessingStage): string[] {
    switch (stage) {
      case TemplateProcessingStage.LOADING:
        return [
          'Verify template files exist and are readable',
          'Check template directory structure',
          'Try using a different template'
        ];
      case TemplateProcessingStage.VARIABLE_SUBSTITUTION:
        return [
          'Check template variable syntax',
          'Verify all required variables are provided',
          'Use default values for missing variables'
        ];
      default:
        return ['Check template files for syntax errors and missing dependencies'];
    }
  }

  /**
   * Gets suggestions for system environment errors
   */
  private static getSystemSuggestions(requirement: SystemRequirement): string[] {
    switch (requirement) {
      case SystemRequirement.PACKAGE_MANAGER:
        return [
          'Install Node.js which includes npm',
          'Install yarn: npm install -g yarn',
          'Install pnpm: npm install -g pnpm'
        ];
      case SystemRequirement.GIT:
        return [
          'Install Git from https://git-scm.com/',
          'Add Git to your system PATH',
          'Skip Git initialization if not needed'
        ];
      case SystemRequirement.DISK_SPACE:
        return [
          'Free up disk space by removing unnecessary files',
          'Choose a different target directory',
          'Use a minimal template to reduce space requirements'
        ];
      default:
        return ['Check system requirements and install missing dependencies'];
    }
  }

  /**
   * Gets suggestions for user input errors
   */
  private static getUserInputSuggestions(field: string, validationRule: string): string[] {
    switch (field) {
      case 'projectName':
        return [
          'Use only letters, numbers, hyphens, and underscores',
          'Avoid spaces and special characters',
          'Keep the name between 1-255 characters'
        ];
      default:
        return [`Ensure ${field} meets the validation requirements: ${validationRule}`];
    }
  }

  /**
   * Gets suggestions for compatibility errors
   */
  private static getCompatibilitySuggestions(conflictingOptions: string[]): string[] {
    return [
      'Review the conflicting options and choose compatible alternatives',
      'Use the recommended configuration for your selected framework',
      'Consult the documentation for supported option combinations'
    ];
  }
}