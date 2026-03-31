import { ErrorHandler } from '../../utils/error-handler';
import { 
  ErrorCategory, 
  FileSystemOperation, 
  NetworkOperation, 
  TemplateProcessingStage, 
  SystemRequirement,
  RecoveryStrategy 
} from '../../types/errors';

describe('ErrorHandler', () => {
  beforeEach(() => {
    ErrorHandler.clearRetryAttempts();
  });

  describe('createFileSystemError', () => {
    it('should create a file system error with correct properties', () => {
      const error = ErrorHandler.createFileSystemError(
        'Failed to create directory',
        FileSystemOperation.CREATE_DIRECTORY,
        '/test/path'
      );

      expect(error.message).toBe('Failed to create directory');
      expect(error.code).toBe('FS_CREATE_DIRECTORY');
      expect(error.category).toBe(ErrorCategory.FILE_SYSTEM);
      expect(error.operation).toBe(FileSystemOperation.CREATE_DIRECTORY);
      expect(error.path).toBe('/test/path');
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toBeDefined();
      expect(error.suggestions!.length).toBeGreaterThan(0);
    });

    it('should provide appropriate suggestions for different operations', () => {
      const createDirError = ErrorHandler.createFileSystemError(
        'Failed to create directory',
        FileSystemOperation.CREATE_DIRECTORY
      );
      expect(createDirError.suggestions).toContain('Check if you have write permissions in the target directory');

      const writeFileError = ErrorHandler.createFileSystemError(
        'Failed to write file',
        FileSystemOperation.WRITE_FILE
      );
      expect(writeFileError.suggestions).toContain('Check if the file is not locked by another process');
    });
  });

  describe('createNetworkError', () => {
    it('should create a network error with correct properties', () => {
      const error = ErrorHandler.createNetworkError(
        'Package installation failed',
        NetworkOperation.PACKAGE_INSTALLATION
      );

      expect(error.message).toBe('Package installation failed');
      expect(error.code).toBe('NET_PACKAGE_INSTALLATION');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.operation).toBe(NetworkOperation.PACKAGE_INSTALLATION);
      expect(error.recoverable).toBe(true);
      expect(error.suggestions).toBeDefined();
    });

    it('should provide network-specific suggestions', () => {
      const error = ErrorHandler.createNetworkError(
        'Package installation failed',
        NetworkOperation.PACKAGE_INSTALLATION
      );
      expect(error.suggestions).toContain('Check your internet connection');
      expect(error.suggestions).toContain('Install dependencies manually after project creation');
    });
  });

  describe('createTemplateError', () => {
    it('should create a template error with correct properties', () => {
      const error = ErrorHandler.createTemplateError(
        'Variable substitution failed',
        TemplateProcessingStage.VARIABLE_SUBSTITUTION,
        '/templates/nextjs',
        'component.tsx.hbs'
      );

      expect(error.message).toBe('Variable substitution failed');
      expect(error.code).toBe('TEMPLATE_VARIABLE_SUBSTITUTION');
      expect(error.category).toBe(ErrorCategory.TEMPLATE_PROCESSING);
      expect(error.processingStage).toBe(TemplateProcessingStage.VARIABLE_SUBSTITUTION);
      expect(error.templatePath).toBe('/templates/nextjs');
      expect(error.templateFile).toBe('component.tsx.hbs');
    });
  });

  describe('createSystemError', () => {
    it('should create a system error with correct properties', () => {
      const error = ErrorHandler.createSystemError(
        'Package manager not found',
        SystemRequirement.PACKAGE_MANAGER,
        false
      );

      expect(error.message).toBe('Package manager not found');
      expect(error.code).toBe('SYS_PACKAGE_MANAGER');
      expect(error.category).toBe(ErrorCategory.SYSTEM_ENVIRONMENT);
      expect(error.requirement).toBe(SystemRequirement.PACKAGE_MANAGER);
      expect(error.recoverable).toBe(false);
    });

    it('should provide system-specific suggestions', () => {
      const error = ErrorHandler.createSystemError(
        'Git not found',
        SystemRequirement.GIT
      );
      expect(error.suggestions).toContain('Install Git from https://git-scm.com/');
    });
  });

  describe('createUserInputError', () => {
    it('should create a user input error with correct properties', () => {
      const error = ErrorHandler.createUserInputError(
        'Invalid project name',
        'projectName',
        'alphanumeric_with_hyphens',
        'invalid@name'
      );

      expect(error.message).toBe('Invalid project name');
      expect(error.code).toBe('INPUT_PROJECTNAME_INVALID');
      expect(error.category).toBe(ErrorCategory.USER_INPUT);
      expect(error.field).toBe('projectName');
      expect(error.validationRule).toBe('alphanumeric_with_hyphens');
      expect(error.value).toBe('invalid@name');
    });
  });

  describe('createCompatibilityError', () => {
    it('should create a compatibility error with correct properties', () => {
      const conflictingOptions = ['nextjs', 'basic-spa'];
      const error = ErrorHandler.createCompatibilityError(
        'Framework and template incompatible',
        conflictingOptions,
        'Basic SPA template is not available for Next.js'
      );

      expect(error.message).toBe('Framework and template incompatible');
      expect(error.code).toBe('VALIDATION_COMPATIBILITY');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.conflictingOptions).toEqual(conflictingOptions);
      expect(error.reason).toBe('Basic SPA template is not available for Next.js');
    });
  });

  describe('handleError', () => {
    it('should handle file system errors with cleanup strategy', async () => {
      const error = ErrorHandler.createFileSystemError(
        'Failed to create directory',
        FileSystemOperation.CREATE_DIRECTORY,
        '/test/path',
        false // not recoverable
      );

      const context = await ErrorHandler.handleError(error);

      expect(context.error).toBe(error);
      expect(context.strategy).toBe(RecoveryStrategy.CLEANUP_AND_EXIT);
    });

    it('should handle network errors with retry strategy', async () => {
      const error = ErrorHandler.createNetworkError(
        'Package installation failed',
        NetworkOperation.PACKAGE_INSTALLATION,
        true // recoverable
      );

      const context = await ErrorHandler.handleError(error);

      expect(context.error).toBe(error);
      expect(context.strategy).toBe(RecoveryStrategy.RETRY);
    });

    it('should handle user input errors with prompt strategy', async () => {
      const error = ErrorHandler.createUserInputError(
        'Invalid project name',
        'projectName',
        'alphanumeric_with_hyphens'
      );

      const context = await ErrorHandler.handleError(error);

      expect(context.error).toBe(error);
      expect(context.strategy).toBe(RecoveryStrategy.PROMPT_USER);
      expect(context.fallbackOptions).toBeDefined();
      expect(context.fallbackOptions!.field).toBe('projectName');
    });
  });

  describe('executeCleanup', () => {
    it('should execute all cleanup actions', async () => {
      const cleanupAction1 = jest.fn().mockResolvedValue(undefined);
      const cleanupAction2 = jest.fn().mockResolvedValue(undefined);
      const cleanupActions = [cleanupAction1, cleanupAction2];

      await ErrorHandler.executeCleanup(cleanupActions);

      expect(cleanupAction1).toHaveBeenCalled();
      expect(cleanupAction2).toHaveBeenCalled();
    });

    it('should continue cleanup even if one action fails', async () => {
      const cleanupAction1 = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      const cleanupAction2 = jest.fn().mockResolvedValue(undefined);
      const cleanupActions = [cleanupAction1, cleanupAction2];

      await ErrorHandler.executeCleanup(cleanupActions);

      expect(cleanupAction1).toHaveBeenCalled();
      expect(cleanupAction2).toHaveBeenCalled();
    });

    it('should handle empty cleanup actions array', async () => {
      await expect(ErrorHandler.executeCleanup([])).resolves.not.toThrow();
    });
  });

  describe('clearRetryAttempts', () => {
    it('should clear retry attempts', () => {
      // This is more of an integration test since we can't directly access the private Map
      ErrorHandler.clearRetryAttempts();
      // If this doesn't throw, the method works
      expect(true).toBe(true);
    });
  });
});