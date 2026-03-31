import { 
  ProjectConfig, 
  Framework, 
  Language, 
  TemplateType, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning 
} from '../../types';
import { ErrorHandler } from '../../utils/error-handler';
import { CompatibilityError } from '../../types/errors';

/**
 * Validation engine for checking option compatibility
 */
export class CompatibilityValidator {
  /**
   * Validates complete project configuration for compatibility issues
   */
  static validateConfiguration(config: ProjectConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate framework and template compatibility
    this.validateFrameworkTemplateCompatibility(config, result);

    // Validate language compatibility with selected tools
    this.validateLanguageCompatibility(config, result);

    // Validate tooling option compatibility
    this.validateToolingCompatibility(config, result);

    // Validate framework-specific requirements
    this.validateFrameworkRequirements(config, result);

    // Set overall validity
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validates framework and template compatibility
   */
  private static validateFrameworkTemplateCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    const frameworkTemplates = this.getValidTemplatesForFramework(config.framework);
    
    if (!frameworkTemplates.includes(config.template)) {
      result.errors.push({
        field: 'template',
        message: `Template '${config.template}' is not compatible with framework '${config.framework}'`,
        code: 'INCOMPATIBLE_FRAMEWORK_TEMPLATE'
      });
    }
  }

  /**
   * Validates language compatibility with selected tools
   */
  private static validateLanguageCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // TypeScript-specific validations
    if (config.language === Language.TYPESCRIPT) {
      // ESLint with TypeScript requires additional configuration
      if (config.devTools.includeESLint) {
        result.warnings.push({
          field: 'devTools.includeESLint',
          message: 'ESLint with TypeScript requires @typescript-eslint packages',
          code: 'TYPESCRIPT_ESLINT_DEPENDENCY'
        });
      }
    }

    // JavaScript-specific validations
    if (config.language === Language.JAVASCRIPT) {
      // Some templates may be optimized for TypeScript
      if (config.template === TemplateType.DASHBOARD && config.framework === Framework.NEXTJS) {
        result.warnings.push({
          field: 'language',
          message: 'Dashboard template is optimized for TypeScript. Consider using TypeScript for better type safety.',
          code: 'JAVASCRIPT_SUBOPTIMAL_TEMPLATE'
        });
      }
    }
  }

  /**
   * Validates tooling option compatibility
   */
  private static validateToolingCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // Tailwind CSS compatibility
    if (config.styling.includeTailwind) {
      this.validateTailwindCompatibility(config, result);
    }

    // State management compatibility
    if (config.stateManagement.includeZustand) {
      this.validateZustandCompatibility(config, result);
    }

    // Data fetching compatibility
    if (config.dataFetching.includeTanStackQuery) {
      this.validateTanStackQueryCompatibility(config, result);
    }

    // Development tools compatibility
    this.validateDevToolsCompatibility(config, result);
  }

  /**
   * Validates Tailwind CSS compatibility
   */
  private static validateTailwindCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // Tailwind works with both frameworks, but has different setup requirements
    if (config.framework === Framework.NEXTJS) {
      // Next.js has built-in PostCSS support
      result.warnings.push({
        field: 'styling.includeTailwind',
        message: 'Tailwind CSS will be configured with Next.js built-in PostCSS support',
        code: 'TAILWIND_NEXTJS_POSTCSS'
      });
    } else if (config.framework === Framework.REACT_VITE) {
      // Vite requires PostCSS configuration
      result.warnings.push({
        field: 'styling.includeTailwind',
        message: 'Tailwind CSS requires PostCSS configuration with Vite',
        code: 'TAILWIND_VITE_POSTCSS'
      });
    }
  }

  /**
   * Validates Zustand compatibility
   */
  private static validateZustandCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // Zustand works with both frameworks and languages
    // No specific compatibility issues, but provide guidance
    if (config.language === Language.TYPESCRIPT) {
      result.warnings.push({
        field: 'stateManagement.includeZustand',
        message: 'Zustand with TypeScript provides excellent type safety for state management',
        code: 'ZUSTAND_TYPESCRIPT_BENEFIT'
      });
    }
  }

  /**
   * Validates TanStack Query compatibility
   */
  private static validateTanStackQueryCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // TanStack Query works with both frameworks
    if (config.framework === Framework.NEXTJS) {
      result.warnings.push({
        field: 'dataFetching.includeTanStackQuery',
        message: 'TanStack Query with Next.js requires careful hydration handling',
        code: 'TANSTACK_NEXTJS_HYDRATION'
      });
    }

    // Works well with Zustand for state management
    if (config.stateManagement.includeZustand) {
      result.warnings.push({
        field: 'dataFetching.includeTanStackQuery',
        message: 'TanStack Query and Zustand work well together for comprehensive state management',
        code: 'TANSTACK_ZUSTAND_SYNERGY'
      });
    }
  }

  /**
   * Validates development tools compatibility
   */
  private static validateDevToolsCompatibility(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // ESLint and Prettier work well together
    if (config.devTools.includeESLint && config.devTools.includePrettier) {
      result.warnings.push({
        field: 'devTools',
        message: 'ESLint and Prettier will be configured to work together without conflicts',
        code: 'ESLINT_PRETTIER_INTEGRATION'
      });
    }

    // ESLint configuration depends on framework
    if (config.devTools.includeESLint) {
      if (config.framework === Framework.NEXTJS) {
        result.warnings.push({
          field: 'devTools.includeESLint',
          message: 'ESLint will use Next.js recommended configuration',
          code: 'ESLINT_NEXTJS_CONFIG'
        });
      } else if (config.framework === Framework.REACT_VITE) {
        result.warnings.push({
          field: 'devTools.includeESLint',
          message: 'ESLint will use React and Vite recommended configurations',
          code: 'ESLINT_REACT_VITE_CONFIG'
        });
      }
    }
  }

  /**
   * Validates framework-specific requirements
   */
  private static validateFrameworkRequirements(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    if (config.framework === Framework.NEXTJS) {
      this.validateNextJsRequirements(config, result);
    } else if (config.framework === Framework.REACT_VITE) {
      this.validateReactViteRequirements(config, result);
    }
  }

  /**
   * Validates Next.js specific requirements
   */
  private static validateNextJsRequirements(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // Next.js works best with TypeScript
    if (config.language === Language.JAVASCRIPT) {
      result.warnings.push({
        field: 'language',
        message: 'Next.js has excellent TypeScript support. Consider using TypeScript for better development experience.',
        code: 'NEXTJS_TYPESCRIPT_RECOMMENDED'
      });
    }

    // App Router templates require specific structure
    if ([TemplateType.FEATURE_BASED, TemplateType.DASHBOARD].includes(config.template)) {
      result.warnings.push({
        field: 'template',
        message: 'This template uses Next.js App Router which requires Next.js 13+',
        code: 'NEXTJS_APP_ROUTER_VERSION'
      });
    }
  }

  /**
   * Validates React + Vite specific requirements
   */
  private static validateReactViteRequirements(
    config: ProjectConfig, 
    result: ValidationResult
  ): void {
    // Vite has fast HMR with both languages
    result.warnings.push({
      field: 'framework',
      message: 'Vite provides fast Hot Module Replacement for rapid development',
      code: 'VITE_HMR_BENEFIT'
    });

    // Component-driven template works well with Vite
    if (config.template === TemplateType.COMPONENT_DRIVEN) {
      result.warnings.push({
        field: 'template',
        message: 'Component-driven template is optimized for Vite\'s fast build system',
        code: 'VITE_COMPONENT_DRIVEN_OPTIMIZED'
      });
    }
  }

  /**
   * Gets valid templates for a framework
   */
  private static getValidTemplatesForFramework(framework: Framework): TemplateType[] {
    switch (framework) {
      case Framework.NEXTJS:
        return [TemplateType.MINIMAL, TemplateType.FEATURE_BASED, TemplateType.DASHBOARD];
      case Framework.REACT_VITE:
        return [TemplateType.BASIC_SPA, TemplateType.FEATURE_BASED, TemplateType.COMPONENT_DRIVEN];
      default:
        return [];
    }
  }

  /**
   * Validates template support for selected tooling options
   */
  static validateTemplateSupport(
    framework: Framework, 
    template: TemplateType, 
    config: ProjectConfig
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Get template capabilities
    const templateCapabilities = this.getTemplateCapabilities(framework, template);

    // Check if template supports selected options
    if (config.styling.includeTailwind && !templateCapabilities.supportsTailwind) {
      result.errors.push({
        field: 'styling.includeTailwind',
        message: `Template '${template}' does not support Tailwind CSS integration`,
        code: 'TEMPLATE_NO_TAILWIND_SUPPORT'
      });
    }

    if (config.stateManagement.includeZustand && !templateCapabilities.supportsZustand) {
      result.errors.push({
        field: 'stateManagement.includeZustand',
        message: `Template '${template}' does not have Zustand integration examples`,
        code: 'TEMPLATE_NO_ZUSTAND_SUPPORT'
      });
    }

    if (config.dataFetching.includeTanStackQuery && !templateCapabilities.supportsTanStackQuery) {
      result.errors.push({
        field: 'dataFetching.includeTanStackQuery',
        message: `Template '${template}' does not have TanStack Query integration examples`,
        code: 'TEMPLATE_NO_TANSTACK_SUPPORT'
      });
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Gets capabilities for a specific template
   */
  private static getTemplateCapabilities(framework: Framework, template: TemplateType) {
    // Define template capabilities based on what's implemented
    const capabilities = {
      supportsTailwind: true,    // All templates support Tailwind
      supportsZustand: true,     // All templates support Zustand
      supportsTanStackQuery: true, // All templates support TanStack Query
      supportsTypeScript: true,  // All templates support TypeScript
      supportsESLint: true,      // All templates support ESLint
      supportsPrettier: true     // All templates support Prettier
    };

    // Minimal templates might have limited examples
    if (template === TemplateType.MINIMAL || template === TemplateType.BASIC_SPA) {
      capabilities.supportsZustand = false; // No state management examples in minimal templates
      capabilities.supportsTanStackQuery = false; // No data fetching examples in minimal templates
    }

    return capabilities;
  }

  /**
   * Validates language compatibility with framework and template (public method)
   */
  static validateLanguageFrameworkCompatibility(
    framework: Framework, 
    template: TemplateType, 
    language: Language
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // All combinations are technically valid, but some are more optimal
    if (language === Language.JAVASCRIPT) {
      if (template === TemplateType.DASHBOARD) {
        result.warnings.push({
          field: 'language',
          message: 'Dashboard templates benefit from TypeScript for better type safety with complex state',
          code: 'DASHBOARD_TYPESCRIPT_RECOMMENDED'
        });
      }
    }

    return result;
  }

  /**
   * Creates detailed error messages for validation failures
   */
  static createDetailedErrorMessage(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    let message = 'Configuration validation failed:\n\n';
    
    errors.forEach((error, index) => {
      message += `${index + 1}. ${error.field}: ${error.message}\n`;
      message += `   Error Code: ${error.code}\n\n`;
    });

    message += 'Please review your selections and try again.';
    return message;
  }

  /**
   * Creates detailed warning messages
   */
  static createDetailedWarningMessage(warnings: ValidationWarning[]): string {
    if (warnings.length === 0) {
      return '';
    }

    let message = 'Configuration warnings:\n\n';
    
    warnings.forEach((warning, index) => {
      message += `${index + 1}. ${warning.field}: ${warning.message}\n`;
      message += `   Warning Code: ${warning.code}\n\n`;
    });

    return message;
  }
}