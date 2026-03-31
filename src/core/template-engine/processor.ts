import * as Handlebars from 'handlebars';
import { ProjectConfig, TemplateContext, TemplateFile, ProcessedFile, Language } from '../../types';

/**
 * Template processor for handling template files and variable replacement
 */
export class TemplateProcessor {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Processes a template file with the given context
   */
  async processTemplateFile(file: TemplateFile, context: TemplateContext): Promise<ProcessedFile | null> {
    let processedContent = file.content;
    let processedPath = file.path;

    // Process file path for extension replacement
    processedPath = this.processFilePath(processedPath, context);

    // Skip processing if file is conditional and conditions aren't met
    if (file.conditional && file.conditions) {
      const shouldInclude = this.evaluateConditions(file.conditions, context);
      if (!shouldInclude) {
        return null; // File should be excluded
      }
    }

    // Process template content with Handlebars
    try {
      const template = this.handlebars.compile(processedContent);
      processedContent = template(context);
    } catch (error) {
      console.warn(`Failed to process template ${file.path}:`, error);
      // Fall back to simple replacement if Handlebars fails
      processedContent = this.simpleVariableReplacement(processedContent, context);
    }

    return {
      path: processedPath,
      content: processedContent,
      encoding: file.encoding || 'utf8',
    };
  }

  /**
   * Processes file path to replace placeholders like {{ext}}
   */
  private processFilePath(filePath: string, context: TemplateContext): string {
    let processedPath = filePath;

    // Replace {{ext}} with appropriate file extension
    if (processedPath.includes('{{ext}}')) {
      const extension = context.language === Language.TYPESCRIPT ? 'tsx' : 'jsx';
      processedPath = processedPath.replace(/{{ext}}/g, extension);
    }

    // Replace {{jsext}} for non-React files
    if (processedPath.includes('{{jsext}}')) {
      const extension = context.language === Language.TYPESCRIPT ? 'ts' : 'js';
      processedPath = processedPath.replace(/{{jsext}}/g, extension);
    }

    // Remove .hbs extension
    if (processedPath.endsWith('.hbs')) {
      processedPath = processedPath.slice(0, -4);
    }

    return processedPath;
  }

  /**
   * Evaluates conditional file inclusion based on context
   */
  private evaluateConditions(conditions: string[], context: TemplateContext): boolean {
    return conditions.every(condition => {
      switch (condition) {
        case 'typescript':
          return context.language === Language.TYPESCRIPT;
        case 'javascript':
          return context.language === Language.JAVASCRIPT;
        case 'tailwind':
          return context.options.styling.includeTailwind;
        case 'zustand':
          return context.options.stateManagement.includeZustand;
        case 'tanstack-query':
          return context.options.dataFetching.includeTanStackQuery;
        case 'eslint':
          return context.options.devTools.includeESLint;
        case 'prettier':
          return context.options.devTools.includePrettier;
        default:
          return false;
      }
    });
  }

  /**
   * Simple variable replacement fallback
   */
  private simpleVariableReplacement(content: string, context: TemplateContext): string {
    let processedContent = content;

    processedContent = processedContent.replace(/{{projectName}}/g, context.projectName);
    processedContent = processedContent.replace(/{{framework}}/g, context.framework);
    processedContent = processedContent.replace(/{{language}}/g, context.language);
    processedContent = processedContent.replace(/{{packageManager}}/g, context.packageManager);

    return processedContent;
  }

  /**
   * Registers Handlebars helpers for template processing
   */
  private registerHelpers(): void {
    // Equality helper
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);

    // Not equal helper
    this.handlebars.registerHelper('neq', (a: any, b: any) => a !== b);

    // And helper for multiple conditions
    this.handlebars.registerHelper('and', (...args: any[]) => {
      const options = args.pop();
      return args.every(Boolean) ? options.fn(this) : options.inverse(this);
    });

    // Or helper for multiple conditions
    this.handlebars.registerHelper('or', (...args: any[]) => {
      const options = args.pop();
      return args.some(Boolean) ? options.fn(this) : options.inverse(this);
    });

    // String case helpers
    this.handlebars.registerHelper('lowercase', (str: string) => str.toLowerCase());
    this.handlebars.registerHelper('uppercase', (str: string) => str.toUpperCase());
    this.handlebars.registerHelper('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    );

    // Kebab case helper for CSS classes and file names
    this.handlebars.registerHelper('kebabCase', (str: string) =>
      str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
    );

    // Camel case helper
    this.handlebars.registerHelper('camelCase', (str: string) =>
      str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
    );

    // Pascal case helper
    this.handlebars.registerHelper('pascalCase', (str: string) => {
      const camelCase = str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    });

    // JSON stringify helper
    this.handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));

    // Framework-specific helpers
    this.handlebars.registerHelper('isNextjs', (framework: string) => framework === 'nextjs');
    this.handlebars.registerHelper('isReactVite', (framework: string) => framework === 'react-vite');

    // Language-specific helpers
    this.handlebars.registerHelper('isTypeScript', (language: string) => language === 'typescript');
    this.handlebars.registerHelper('isJavaScript', (language: string) => language === 'javascript');

    // Package manager helpers
    this.handlebars.registerHelper('isNpm', (pm: string) => pm === 'npm');
    this.handlebars.registerHelper('isYarn', (pm: string) => pm === 'yarn');
    this.handlebars.registerHelper('isPnpm', (pm: string) => pm === 'pnpm');

    // File extension helpers
    this.handlebars.registerHelper('jsExt', (language: string) =>
      language === 'typescript' ? 'ts' : 'js'
    );
    this.handlebars.registerHelper('reactExt', (language: string) =>
      language === 'typescript' ? 'tsx' : 'jsx'
    );
  }

  /**
   * Creates template context from project configuration
   */
  createTemplateContext(config: ProjectConfig): TemplateContext {
    return {
      projectName: config.projectName,
      framework: config.framework,
      language: config.language,
      options: {
        styling: config.styling,
        stateManagement: config.stateManagement,
        dataFetching: config.dataFetching,
        devTools: config.devTools,
      },
      packageManager: config.packageManager,
    };
  }

  /**
   * Processes multiple template files in batch
   */
  async processTemplateFiles(files: TemplateFile[], context: TemplateContext): Promise<ProcessedFile[]> {
    const processedFiles: ProcessedFile[] = [];

    for (const file of files) {
      const processedFile = await this.processTemplateFile(file, context);
      if (processedFile) {
        processedFiles.push(processedFile);
      }
    }

    return processedFiles;
  }

  /**
   * Validates template syntax before processing
   */
  validateTemplate(content: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      this.handlebars.compile(content);
      return { isValid: true, errors: [] };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown template error');
      return { isValid: false, errors };
    }
  }
}
