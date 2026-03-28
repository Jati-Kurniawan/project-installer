import { ProjectConfig, ValidationResult, ValidationError } from '../../types';

/**
 * Validation engine for project configurations and user inputs
 */
export class ValidationEngine {
  /**
   * Validates project name format and availability
   */
  validateProjectName(name: string, targetPath: string): ValidationResult {
    const errors: ValidationError[] = [];

    // Check for empty name
    if (!name || name.trim().length === 0) {
      errors.push({
        field: 'projectName',
        message: 'Project name cannot be empty',
        code: 'EMPTY_NAME',
      });
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name)) {
      errors.push({
        field: 'projectName',
        message: 'Project name contains invalid characters',
        code: 'INVALID_CHARACTERS',
      });
    }

    // Check for reserved names
    const reservedNames = ['con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9'];
    if (reservedNames.includes(name.toLowerCase())) {
      errors.push({
        field: 'projectName',
        message: 'Project name is a reserved system name',
        code: 'RESERVED_NAME',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validates compatibility between selected options
   */
  validateOptionCompatibility(config: ProjectConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Add compatibility validation logic here
    // For now, all combinations are considered compatible

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validates system requirements for the configuration
   */
  validateSystemRequirements(config: ProjectConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Add system requirement validation logic here
    // For now, assume all requirements are met

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}