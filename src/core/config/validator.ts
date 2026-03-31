import Joi from 'joi';
import { ProjectConfig, ValidationResult, ValidationError, ValidationWarning, UserSelections } from '../../types';
import { Framework, Language, PackageManager, TemplateType } from '../../types/enums';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Validation engine for project configurations and user inputs
 */
export class ValidationEngine {
  private readonly reservedNames = [
    'con', 'prn', 'aux', 'nul', 'com1', 'com2', 'com3', 'com4', 'com5', 
    'com6', 'com7', 'com8', 'com9', 'lpt1', 'lpt2', 'lpt3', 'lpt4', 
    'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9', 'node_modules', 'package.json',
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.git', '.gitignore',
    'dist', 'build', 'public', 'src', 'lib', 'bin', 'test', 'tests'
  ];

  private readonly frameworkTemplateCompatibility = {
    [Framework.NEXTJS]: [TemplateType.MINIMAL, TemplateType.FEATURE_BASED, TemplateType.DASHBOARD],
    [Framework.REACT_VITE]: [TemplateType.BASIC_SPA, TemplateType.FEATURE_BASED, TemplateType.COMPONENT_DRIVEN]
  };

  private readonly userSelectionsSchema = Joi.object({
    projectName: Joi.string()
      .min(1)
      .max(100)
      .custom((value, helpers) => {
        // Check for reserved names first
        if (this.reservedNames.includes(value.toLowerCase())) {
          return helpers.error('projectName.reserved', { value });
        }
        
        // Check for names starting with dots or hyphens
        if (value.startsWith('.') || value.startsWith('-')) {
          return helpers.error('projectName.invalidStart', { value });
        }
        
        // Check for names ending with dots or hyphens
        if (value.endsWith('.') || value.endsWith('-')) {
          return helpers.error('projectName.invalidEnd', { value });
        }
        
        // Check for valid characters (after other checks)
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return helpers.error('projectName.invalidCharacters', { value });
        }
        
        return value;
      })
      .required()
      .messages({
        'string.min': 'Project name must be at least 1 character long',
        'string.max': 'Project name cannot exceed 100 characters',
        'any.required': 'Project name is required',
        'projectName.reserved': 'Project name "{{#value}}" is reserved and cannot be used',
        'projectName.invalidStart': 'Project name "{{#value}}" cannot start with dots or hyphens',
        'projectName.invalidEnd': 'Project name "{{#value}}" cannot end with dots or hyphens',
        'projectName.invalidCharacters': 'Project name can only contain letters, numbers, hyphens, and underscores'
      }),
    framework: Joi.string()
      .valid(...Object.values(Framework))
      .required()
      .messages({
        'any.only': 'Framework must be one of: nextjs, react-vite',
        'any.required': 'Framework selection is required'
      }),
    template: Joi.string()
      .valid(...Object.values(TemplateType))
      .custom((value, helpers) => {
        const framework = helpers.state.ancestors[0]?.framework;
        if (framework && !this.isTemplateCompatibleWithFramework(value, framework)) {
          return helpers.error('template.incompatibleFramework', { framework, template: value });
        }
        return value;
      })
      .required()
      .messages({
        'any.only': 'Template must be one of: minimal, feature-based, dashboard, basic-spa, component-driven',
        'any.required': 'Template selection is required',
        'template.incompatibleFramework': 'Template "{{#template}}" is not compatible with {{#framework}} framework'
      }),
    language: Joi.string()
      .valid(...Object.values(Language))
      .required()
      .messages({
        'any.only': 'Language must be one of: typescript, javascript',
        'any.required': 'Language selection is required'
      }),
    includeTailwind: Joi.boolean().required(),
    includeZustand: Joi.boolean().required(),
    includeTanStackQuery: Joi.boolean().required(),
    includeESLint: Joi.boolean().required(),
    includePrettier: Joi.boolean().required(),
    packageManager: Joi.string()
      .valid(...Object.values(PackageManager))
      .required()
      .messages({
        'any.only': 'Package manager must be one of: npm, yarn, pnpm',
        'any.required': 'Package manager selection is required'
      }),
    initializeGit: Joi.boolean().required()
  });

  private readonly projectConfigSchema = Joi.object({
    projectName: Joi.string()
      .min(1)
      .max(100)
      .custom((value, helpers) => {
        if (this.reservedNames.includes(value.toLowerCase())) {
          return helpers.error('projectName.reserved', { value });
        }
        if (value.startsWith('.') || value.startsWith('-')) {
          return helpers.error('projectName.invalidStart', { value });
        }
        if (value.endsWith('.') || value.endsWith('-')) {
          return helpers.error('projectName.invalidEnd', { value });
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return helpers.error('projectName.invalidCharacters', { value });
        }
        return value;
      })
      .required()
      .messages({
        'string.min': 'Project name must be at least 1 character long',
        'string.max': 'Project name cannot exceed 100 characters',
        'any.required': 'Project name is required',
        'projectName.reserved': 'Project name "{{#value}}" is reserved and cannot be used',
        'projectName.invalidStart': 'Project name "{{#value}}" cannot start with dots or hyphens',
        'projectName.invalidEnd': 'Project name "{{#value}}" cannot end with dots or hyphens',
        'projectName.invalidCharacters': 'Project name can only contain letters, numbers, hyphens, and underscores'
      }),
    framework: Joi.string()
      .valid(...Object.values(Framework))
      .required(),
    template: Joi.string()
      .valid(...Object.values(TemplateType))
      .custom((value, helpers) => {
        const framework = helpers.state.ancestors[0]?.framework;
        if (framework && !this.isTemplateCompatibleWithFramework(value, framework)) {
          return helpers.error('template.incompatibleFramework', { framework, template: value });
        }
        return value;
      })
      .required()
      .messages({
        'template.incompatibleFramework': 'Template "{{#template}}" is not compatible with {{#framework}} framework'
      }),
    language: Joi.string()
      .valid(...Object.values(Language))
      .required(),
    styling: Joi.object({
      includeTailwind: Joi.boolean().required()
    }).required(),
    stateManagement: Joi.object({
      includeZustand: Joi.boolean().required()
    }).required(),
    dataFetching: Joi.object({
      includeTanStackQuery: Joi.boolean().required()
    }).required(),
    devTools: Joi.object({
      includeESLint: Joi.boolean().required(),
      includePrettier: Joi.boolean().required()
    }).required(),
    packageManager: Joi.string()
      .valid(...Object.values(PackageManager))
      .required(),
    gitInit: Joi.boolean().required()
  });

  /**
   * Helper method to check template-framework compatibility
   */
  private isTemplateCompatibleWithFramework(template: TemplateType, framework: Framework): boolean {
    const compatibleTemplates = this.frameworkTemplateCompatibility[framework];
    return compatibleTemplates?.includes(template) ?? false;
  }

  /**
   * Validates user selections using Joi schema
   */
  validateUserSelections(selections: UserSelections): ValidationResult {
    const { error } = this.userSelectionsSchema.validate(selections, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false
    });
    
    if (!error) {
      // Additional compatibility validation
      const compatibilityResult = this.validateSelectionCompatibility(selections);
      return compatibilityResult;
    }

    const errors: ValidationError[] = this.formatJoiErrors(error);

    return {
      isValid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Validates project configuration using Joi schema
   */
  validateProjectConfig(config: ProjectConfig): ValidationResult {
    const { error } = this.projectConfigSchema.validate(config, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false
    });
    
    if (!error) {
      // Additional compatibility validation
      const compatibilityResult = this.validateOptionCompatibility(config);
      return compatibilityResult;
    }

    const errors: ValidationError[] = this.formatJoiErrors(error);

    return {
      isValid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Formats Joi validation errors into ValidationError objects
   */
  private formatJoiErrors(joiError: Joi.ValidationError): ValidationError[] {
    return joiError.details.map(detail => ({
      field: detail.path.join('.'),
      message: this.formatErrorMessage(detail),
      code: this.generateErrorCode(detail)
    }));
  }

  /**
   * Formats error messages with better user-friendly text
   */
  private formatErrorMessage(detail: Joi.ValidationErrorItem): string {
    const { message, context } = detail;
    
    // Handle custom error messages with context
    if (context && typeof context === 'object') {
      let formattedMessage = message;
      Object.entries(context).forEach(([key, value]) => {
        formattedMessage = formattedMessage.replace(new RegExp(`{{#${key}}}`, 'g'), String(value));
      });
      return formattedMessage;
    }
    
    return message;
  }

  /**
   * Generates consistent error codes from Joi error types
   */
  private generateErrorCode(detail: Joi.ValidationErrorItem): string {
    // Handle custom error types first
    if (detail.type === 'projectName.reserved') return 'PROJECT_NAME_RESERVED';
    if (detail.type === 'projectName.invalidStart') return 'PROJECT_NAME_INVALID_START';
    if (detail.type === 'projectName.invalidEnd') return 'PROJECT_NAME_INVALID_END';
    if (detail.type === 'projectName.invalidCharacters') return 'PROJECT_NAME_INVALID_CHARACTERS';
    if (detail.type === 'template.incompatibleFramework') return 'TEMPLATE_FRAMEWORK_INCOMPATIBLE';
    
    // Default Joi error code transformation
    const baseCode = detail.type.toUpperCase().replace(/\./g, '_');
    return baseCode;
  }

  /**
   * Validates compatibility between user selections
   */
  private validateSelectionCompatibility(selections: UserSelections): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check framework-template compatibility
    if (!this.isTemplateCompatibleWithFramework(selections.template, selections.framework)) {
      errors.push({
        field: 'template',
        message: `Template '${selections.template}' is not compatible with ${selections.framework} framework`,
        code: 'TEMPLATE_FRAMEWORK_INCOMPATIBLE'
      });
    }

    // Add warnings for potentially conflicting options
    if (selections.includeESLint && selections.includePrettier) {
      warnings.push({
        field: 'devTools',
        message: 'ESLint and Prettier configurations may conflict. Ensure proper integration.',
        code: 'POTENTIAL_CONFIG_CONFLICT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  /**
   * Validates project name format and availability
   */
  validateProjectName(name: string, targetPath: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Use Joi schema for basic validation
    const nameSchema = Joi.string()
      .min(1)
      .max(100)
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .custom((value, helpers) => {
        if (this.reservedNames.includes(value.toLowerCase())) {
          return helpers.error('projectName.reserved');
        }
        if (value.startsWith('.') || value.startsWith('-')) {
          return helpers.error('projectName.invalidStart');
        }
        if (value.endsWith('.') || value.endsWith('-')) {
          return helpers.error('projectName.invalidEnd');
        }
        return value;
      })
      .required()
      .messages({
        'string.pattern.base': 'Project name can only contain letters, numbers, hyphens, and underscores',
        'string.min': 'Project name must be at least 1 character long',
        'string.max': 'Project name cannot exceed 100 characters',
        'any.required': 'Project name is required',
        'projectName.reserved': 'Project name is reserved and cannot be used',
        'projectName.invalidStart': 'Project name cannot start with dots or hyphens',
        'projectName.invalidEnd': 'Project name cannot end with dots or hyphens'
      });

    const { error } = nameSchema.validate(name);
    
    if (error) {
      errors.push(...this.formatJoiErrors(error));
    }

    // Check directory availability
    try {
      const fullPath = path.resolve(targetPath, name);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          const files = fs.readdirSync(fullPath);
          if (files.length > 0) {
            errors.push({
              field: 'projectName',
              message: `Directory '${name}' already exists and is not empty`,
              code: 'DIRECTORY_NOT_EMPTY'
            });
          } else {
            warnings.push({
              field: 'projectName',
              message: `Directory '${name}' already exists but is empty`,
              code: 'DIRECTORY_EXISTS_EMPTY'
            });
          }
        } else {
          errors.push({
            field: 'projectName',
            message: `A file named '${name}' already exists at the target location`,
            code: 'FILE_EXISTS'
          });
        }
      }
    } catch (fsError) {
      // If we can't check the file system, add a warning
      warnings.push({
        field: 'projectName',
        message: 'Unable to verify directory availability',
        code: 'FILESYSTEM_CHECK_FAILED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates compatibility between selected options
   */
  validateOptionCompatibility(config: ProjectConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate framework-template compatibility
    if (!this.isTemplateCompatibleWithFramework(config.template, config.framework)) {
      errors.push({
        field: 'template',
        message: `Template '${config.template}' is not compatible with ${config.framework} framework`,
        code: 'INCOMPATIBLE_TEMPLATE_FRAMEWORK'
      });
    }

    // Validate specific framework requirements
    if (config.framework === Framework.NEXTJS) {
      // Next.js specific validations
      if (config.template === TemplateType.DASHBOARD && !config.styling.includeTailwind) {
        warnings.push({
          field: 'styling',
          message: 'Dashboard template works best with Tailwind CSS for styling',
          code: 'RECOMMENDED_TAILWIND_FOR_DASHBOARD'
        });
      }
    }

    if (config.framework === Framework.REACT_VITE) {
      // React + Vite specific validations
      if (config.template === TemplateType.COMPONENT_DRIVEN && !config.devTools.includeESLint) {
        warnings.push({
          field: 'devTools',
          message: 'Component-driven template benefits from ESLint for component consistency',
          code: 'RECOMMENDED_ESLINT_FOR_COMPONENTS'
        });
      }
    }

    // Validate tooling combinations
    if (config.devTools.includeESLint && config.devTools.includePrettier) {
      warnings.push({
        field: 'devTools',
        message: 'ESLint and Prettier require proper integration to avoid conflicts',
        code: 'ESLINT_PRETTIER_INTEGRATION_NEEDED'
      });
    }

    // Validate state management with data fetching
    if (config.stateManagement.includeZustand && config.dataFetching.includeTanStackQuery) {
      warnings.push({
        field: 'stateManagement',
        message: 'Consider using TanStack Query for server state and Zustand for client state',
        code: 'STATE_MANAGEMENT_SEPARATION_RECOMMENDED'
      });
    }

    // Language-specific validations
    if (config.language === Language.JAVASCRIPT) {
      if (config.template === TemplateType.DASHBOARD || config.template === TemplateType.FEATURE_BASED) {
        warnings.push({
          field: 'language',
          message: 'TypeScript is recommended for complex templates to improve maintainability',
          code: 'TYPESCRIPT_RECOMMENDED_FOR_COMPLEX_TEMPLATES'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates system requirements for the configuration
   */
  validateSystemRequirements(config: ProjectConfig): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check Node.js version compatibility
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      errors.push({
        field: 'system',
        message: `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18 or higher.`,
        code: 'UNSUPPORTED_NODE_VERSION'
      });
    }

    // Check for package manager availability (basic check)
    const packageManager = config.packageManager;
    if (packageManager === PackageManager.YARN || packageManager === PackageManager.PNPM) {
      warnings.push({
        field: 'packageManager',
        message: `Ensure ${packageManager} is installed and available in your PATH`,
        code: 'PACKAGE_MANAGER_AVAILABILITY_CHECK'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Formats validation results into user-friendly messages
   */
  formatValidationResults(result: ValidationResult): string[] {
    const messages: string[] = [];

    if (result.errors.length > 0) {
      messages.push('❌ Validation Errors:');
      result.errors.forEach(error => {
        messages.push(`  • ${error.field}: ${error.message}`);
      });
    }

    if (result.warnings.length > 0) {
      messages.push('⚠️  Warnings:');
      result.warnings.forEach(warning => {
        messages.push(`  • ${warning.field}: ${warning.message}`);
      });
    }

    if (result.isValid && result.warnings.length === 0) {
      messages.push('✅ Configuration is valid');
    }

    return messages;
  }

  /**
   * Validates a complete configuration with all checks
   */
  validateComplete(config: ProjectConfig, targetPath: string = process.cwd()): ValidationResult {
    const results: ValidationResult[] = [
      this.validateProjectConfig(config),
      this.validateProjectName(config.projectName, targetPath),
      this.validateSystemRequirements(config)
    ];

    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    results.forEach(result => {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}