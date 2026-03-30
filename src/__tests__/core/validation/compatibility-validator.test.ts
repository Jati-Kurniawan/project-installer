import { CompatibilityValidator } from '../../../core/validation/compatibility-validator';
import { ProjectConfig, Framework, Language, TemplateType, PackageManager } from '../../../types';

describe('CompatibilityValidator', () => {
  const createTestConfig = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
    projectName: 'test-project',
    framework: Framework.NEXTJS,
    template: TemplateType.MINIMAL,
    language: Language.TYPESCRIPT,
    styling: { includeTailwind: false },
    stateManagement: { includeZustand: false },
    dataFetching: { includeTanStackQuery: false },
    devTools: { includeESLint: false, includePrettier: false },
    packageManager: PackageManager.NPM,
    gitInit: false,
    ...overrides
  });

  describe('validateConfiguration', () => {
    it('should validate a basic Next.js configuration', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a basic React + Vite configuration', () => {
      const config = createTestConfig({
        framework: Framework.REACT_VITE,
        template: TemplateType.BASIC_SPA
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect incompatible framework and template combinations', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.BASIC_SPA // This is for React + Vite only
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INCOMPATIBLE_FRAMEWORK_TEMPLATE');
      expect(result.errors[0].field).toBe('template');
    });

    it('should detect another incompatible framework and template combination', () => {
      const config = createTestConfig({
        framework: Framework.REACT_VITE,
        template: TemplateType.DASHBOARD // This is for Next.js only
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INCOMPATIBLE_FRAMEWORK_TEMPLATE');
    });

    it('should provide warnings for TypeScript with ESLint', () => {
      const config = createTestConfig({
        language: Language.TYPESCRIPT,
        devTools: { includeESLint: true, includePrettier: false }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TYPESCRIPT_ESLINT_DEPENDENCY')).toBe(true);
    });

    it('should provide warnings for JavaScript with Dashboard template', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.DASHBOARD,
        language: Language.JAVASCRIPT
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'JAVASCRIPT_SUBOPTIMAL_TEMPLATE')).toBe(true);
    });

    it('should provide warnings for Tailwind with Next.js', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        styling: { includeTailwind: true }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAILWIND_NEXTJS_POSTCSS')).toBe(true);
    });

    it('should provide warnings for Tailwind with React + Vite', () => {
      const config = createTestConfig({
        framework: Framework.REACT_VITE,
        template: TemplateType.BASIC_SPA,
        styling: { includeTailwind: true }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TAILWIND_VITE_POSTCSS')).toBe(true);
    });

    it('should provide warnings for ESLint and Prettier together', () => {
      const config = createTestConfig({
        devTools: { includeESLint: true, includePrettier: true }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'ESLINT_PRETTIER_INTEGRATION')).toBe(true);
    });

    it('should provide warnings for TanStack Query with Next.js', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        dataFetching: { includeTanStackQuery: true }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TANSTACK_NEXTJS_HYDRATION')).toBe(true);
    });

    it('should provide warnings for TanStack Query with Zustand', () => {
      const config = createTestConfig({
        stateManagement: { includeZustand: true },
        dataFetching: { includeTanStackQuery: true }
      });

      const result = CompatibilityValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'TANSTACK_ZUSTAND_SYNERGY')).toBe(true);
    });
  });

  describe('validateTemplateSupport', () => {
    it('should validate template support for all options with feature-based templates', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.FEATURE_BASED,
        styling: { includeTailwind: true },
        stateManagement: { includeZustand: true },
        dataFetching: { includeTanStackQuery: true }
      });

      const result = CompatibilityValidator.validateTemplateSupport(
        config.framework,
        config.template,
        config
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect unsupported options for minimal templates', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        stateManagement: { includeZustand: true },
        dataFetching: { includeTanStackQuery: true }
      });

      const result = CompatibilityValidator.validateTemplateSupport(
        config.framework,
        config.template,
        config
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'TEMPLATE_NO_ZUSTAND_SUPPORT')).toBe(true);
      expect(result.errors.some(e => e.code === 'TEMPLATE_NO_TANSTACK_SUPPORT')).toBe(true);
    });

    it('should allow Tailwind for all templates', () => {
      const config = createTestConfig({
        framework: Framework.NEXTJS,
        template: TemplateType.MINIMAL,
        styling: { includeTailwind: true }
      });

      const result = CompatibilityValidator.validateTemplateSupport(
        config.framework,
        config.template,
        config
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.some(e => e.field === 'styling.includeTailwind')).toBe(false);
    });
  });

  describe('validateLanguageFrameworkCompatibility', () => {
    it('should validate TypeScript with any framework and template', () => {
      const result = CompatibilityValidator.validateLanguageFrameworkCompatibility(
        Framework.NEXTJS,
        TemplateType.DASHBOARD,
        Language.TYPESCRIPT
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should provide warnings for JavaScript with Dashboard template', () => {
      const result = CompatibilityValidator.validateLanguageFrameworkCompatibility(
        Framework.NEXTJS,
        TemplateType.DASHBOARD,
        Language.JAVASCRIPT
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.code === 'DASHBOARD_TYPESCRIPT_RECOMMENDED')).toBe(true);
    });

    it('should not provide warnings for JavaScript with basic templates', () => {
      const result = CompatibilityValidator.validateLanguageFrameworkCompatibility(
        Framework.REACT_VITE,
        TemplateType.BASIC_SPA,
        Language.JAVASCRIPT
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('createDetailedErrorMessage', () => {
    it('should create detailed error message from validation errors', () => {
      const errors = [
        {
          field: 'template',
          message: 'Template not compatible with framework',
          code: 'INCOMPATIBLE_FRAMEWORK_TEMPLATE'
        },
        {
          field: 'language',
          message: 'Language not supported',
          code: 'UNSUPPORTED_LANGUAGE'
        }
      ];

      const message = CompatibilityValidator.createDetailedErrorMessage(errors);

      expect(message).toContain('Configuration validation failed:');
      expect(message).toContain('1. template: Template not compatible with framework');
      expect(message).toContain('Error Code: INCOMPATIBLE_FRAMEWORK_TEMPLATE');
      expect(message).toContain('2. language: Language not supported');
      expect(message).toContain('Error Code: UNSUPPORTED_LANGUAGE');
      expect(message).toContain('Please review your selections and try again.');
    });

    it('should return empty string for no errors', () => {
      const message = CompatibilityValidator.createDetailedErrorMessage([]);
      expect(message).toBe('');
    });
  });

  describe('createDetailedWarningMessage', () => {
    it('should create detailed warning message from validation warnings', () => {
      const warnings = [
        {
          field: 'devTools.includeESLint',
          message: 'ESLint with TypeScript requires additional packages',
          code: 'TYPESCRIPT_ESLINT_DEPENDENCY'
        }
      ];

      const message = CompatibilityValidator.createDetailedWarningMessage(warnings);

      expect(message).toContain('Configuration warnings:');
      expect(message).toContain('1. devTools.includeESLint: ESLint with TypeScript requires additional packages');
      expect(message).toContain('Warning Code: TYPESCRIPT_ESLINT_DEPENDENCY');
    });

    it('should return empty string for no warnings', () => {
      const message = CompatibilityValidator.createDetailedWarningMessage([]);
      expect(message).toBe('');
    });
  });
});