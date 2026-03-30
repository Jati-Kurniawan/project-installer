import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { ProjectConfig, TemplateDefinition, GenerationResult, DirectoryStructure, Framework, Language, TemplateContext } from '../../types';
import { TemplateProcessor } from '../template-engine/processor';
import { GitService } from '../git/git-service';
import { ErrorHandler } from '../../utils/error-handler';
import { FileSystemOperation, TemplateProcessingStage } from '../../types/errors';
import { Logger } from '../../utils/logger';

/**
 * Project generator for creating project files and directory structure
 */
export class ProjectGenerator {
  private templateProcessor: TemplateProcessor;
  private gitService: GitService;

  constructor() {
    this.templateProcessor = new TemplateProcessor();
    this.gitService = new GitService();
  }

  /**
   * Generates a complete project from configuration and template
   */
  async generateProject(config: ProjectConfig, template: TemplateDefinition): Promise<GenerationResult> {
    const result: GenerationResult = {
      success: true,
      projectPath: `./${config.projectName}`,
      filesCreated: [],
      errors: [],
      duration: 0,
    };

    const startTime = Date.now();
    const cleanupActions: (() => Promise<void>)[] = [];

    try {
      // Create project directory with error handling
      try {
        await fs.ensureDir(result.projectPath);
        cleanupActions.push(async () => {
          if (await fs.pathExists(result.projectPath)) {
            await fs.remove(result.projectPath);
          }
        });
      } catch (error) {
        const fsError = ErrorHandler.createFileSystemError(
          `Failed to create project directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
          FileSystemOperation.CREATE_DIRECTORY,
          result.projectPath
        );
        const recoveryContext = await ErrorHandler.handleError(fsError);
        
        if (recoveryContext.strategy === 'cleanup_and_exit') {
          result.success = false;
          result.errors.push({
            message: fsError.message,
            code: fsError.code,
          });
          return result;
        }
      }

      // Create template context
      const context = this.templateProcessor.createTemplateContext(config);

      // Create directory structure first
      await this.createProjectDirectoryStructure(config, template, result, cleanupActions);

      // Process and create all template files with error handling
      for (const templateFile of template.files) {
        try {
          const processedFile = await this.templateProcessor.processTemplateFile(templateFile, context);
          
          if (processedFile) {
            const filePath = path.join(result.projectPath, processedFile.path);
            
            // Ensure directory exists
            await fs.ensureDir(path.dirname(filePath));
            
            // Write file with error handling
            try {
              await fs.writeFile(filePath, processedFile.content, processedFile.encoding as BufferEncoding);
              result.filesCreated.push(processedFile.path);
            } catch (writeError) {
              const fsError = ErrorHandler.createFileSystemError(
                `Failed to write file ${processedFile.path}: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
                FileSystemOperation.WRITE_FILE,
                filePath
              );
              const recoveryContext = await ErrorHandler.handleError(fsError);
              
              if (recoveryContext.strategy !== 'skip') {
                result.errors.push({
                  message: fsError.message,
                  code: fsError.code,
                  file: processedFile.path,
                });
              }
            }
          }
        } catch (templateError) {
          const tError = ErrorHandler.createTemplateError(
            `Failed to process template file: ${templateError instanceof Error ? templateError.message : 'Unknown error'}`,
            TemplateProcessingStage.FILE_GENERATION,
            template.templatePath,
            templateFile.path
          );
          const recoveryContext = await ErrorHandler.handleError(tError);
          
          if (recoveryContext.strategy === 'skip') {
            Logger.warn(`Skipping problematic template file: ${templateFile.path}`);
            continue;
          } else {
            result.errors.push({
              message: tError.message,
              code: tError.code,
              file: templateFile.path,
            });
          }
        }
      }

      // Create conditional files based on selected options
      await this.createConditionalFiles(config, template, result, cleanupActions);

      // Generate configuration files
      await this.generateConfigurationFiles(config, result, cleanupActions);

      // Initialize Git repository if requested
      if (config.gitInit) {
        await this.initializeGitRepository(config, result);
      }

      result.duration = Date.now() - startTime;
      
      // If we have errors but some files were created, it's a partial success
      if (result.errors.length > 0 && result.filesCreated.length > 0) {
        Logger.warn(`Project created with ${result.errors.length} errors. Some files may be missing.`);
      }
      
    } catch (error) {
      result.success = false;
      result.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'GENERATION_FAILED',
      });
      
      // Execute cleanup on critical failure
      Logger.error('Critical error during project generation. Cleaning up...');
      await ErrorHandler.executeCleanup(cleanupActions);
    }

    return result;
  }

  /**
   * Creates conditional files based on user selections
   */
  private async createConditionalFiles(
    config: ProjectConfig,
    template: TemplateDefinition,
    result: GenerationResult,
    cleanupActions: (() => Promise<void>)[]
  ): Promise<void> {
    try {
      // Load template metadata to get conditional files
      const metadataPath = path.join(template.templatePath, 'template.json');
      if (!await fs.pathExists(metadataPath)) {
        return;
      }

      const metadata = await fs.readJson(metadataPath);
      const conditionalFiles = metadata.files?.conditional || {};

      // Process conditional files based on configuration
      const conditions = this.getActiveConditions(config);
      
      for (const condition of conditions) {
        const files = conditionalFiles[condition];
        if (files && Array.isArray(files)) {
          for (const fileName of files) {
            await this.createConditionalFile(fileName, condition, config, template, result, cleanupActions);
          }
        }
      }
    } catch (error) {
      const tError = ErrorHandler.createTemplateError(
        `Failed to process conditional files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        TemplateProcessingStage.CONDITIONAL_PROCESSING,
        template.templatePath
      );
      await ErrorHandler.handleError(tError);
      
      result.errors.push({
        message: tError.message,
        code: tError.code,
      });
    }
  }

  /**
   * Creates a single conditional file
   */
  private async createConditionalFile(
    fileName: string,
    condition: string,
    config: ProjectConfig,
    template: TemplateDefinition,
    result: GenerationResult,
    cleanupActions: (() => Promise<void>)[]
  ): Promise<void> {
    try {
      // Look for the file in variants directory first, then base
      const variantPath = path.join(template.templatePath, 'variants', condition, fileName);
      const basePath = path.join(template.templatePath, 'base', fileName);
      
      let sourceFile: string;
      if (await fs.pathExists(variantPath)) {
        sourceFile = variantPath;
      } else if (await fs.pathExists(basePath)) {
        sourceFile = basePath;
      } else {
        // Create default content for common files
        const defaultContent = this.getDefaultFileContent(fileName, config);
        if (defaultContent) {
          const targetPath = path.join(result.projectPath, fileName);
          
          try {
            await fs.ensureDir(path.dirname(targetPath));
            await fs.writeFile(targetPath, defaultContent, 'utf-8');
            result.filesCreated.push(fileName);
            
            // Add cleanup action
            cleanupActions.push(async () => {
              if (await fs.pathExists(targetPath)) {
                await fs.remove(targetPath);
              }
            });
          } catch (writeError) {
            const fsError = ErrorHandler.createFileSystemError(
              `Failed to write default file ${fileName}: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
              FileSystemOperation.WRITE_FILE,
              targetPath
            );
            await ErrorHandler.handleError(fsError);
            
            result.errors.push({
              message: fsError.message,
              code: fsError.code,
              file: fileName,
            });
          }
        }
        return;
      }

      // Read and process the file
      const content = await fs.readFile(sourceFile, 'utf-8');
      const context = this.templateProcessor.createTemplateContext(config);
      
      // Process as template if it's a .hbs file
      let processedContent = content;
      if (sourceFile.endsWith('.hbs')) {
        try {
          const template = Handlebars.compile(content);
          processedContent = template(context);
        } catch (templateError) {
          const tError = ErrorHandler.createTemplateError(
            `Failed to process template ${fileName}: ${templateError instanceof Error ? templateError.message : 'Unknown error'}`,
            TemplateProcessingStage.VARIABLE_SUBSTITUTION,
            template.templatePath,
            fileName
          );
          await ErrorHandler.handleError(tError);
          
          result.errors.push({
            message: tError.message,
            code: tError.code,
            file: fileName,
          });
          return;
        }
      }

      // Write to target location
      const targetPath = path.join(result.projectPath, fileName);
      
      try {
        await fs.ensureDir(path.dirname(targetPath));
        await fs.writeFile(targetPath, processedContent, 'utf-8');
        result.filesCreated.push(fileName);
        
        // Add cleanup action
        cleanupActions.push(async () => {
          if (await fs.pathExists(targetPath)) {
            await fs.remove(targetPath);
          }
        });
      } catch (writeError) {
        const fsError = ErrorHandler.createFileSystemError(
          `Failed to write conditional file ${fileName}: ${writeError instanceof Error ? writeError.message : 'Unknown error'}`,
          FileSystemOperation.WRITE_FILE,
          targetPath
        );
        await ErrorHandler.handleError(fsError);
        
        result.errors.push({
          message: fsError.message,
          code: fsError.code,
          file: fileName,
        });
      }

    } catch (error) {
      result.errors.push({
        message: `Failed to create conditional file ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CONDITIONAL_FILE_FAILED',
        file: fileName,
      });
    }
  }

  /**
   * Gets active conditions based on configuration
   */
  private getActiveConditions(config: ProjectConfig): string[] {
    const conditions: string[] = [];

    if (config.language === Language.TYPESCRIPT) {
      conditions.push('typescript');
    } else {
      conditions.push('javascript');
    }

    if (config.styling.includeTailwind) {
      conditions.push('tailwind');
    }

    if (config.stateManagement.includeZustand) {
      conditions.push('zustand');
    }

    if (config.dataFetching.includeTanStackQuery) {
      conditions.push('tanstack-query');
    }

    if (config.devTools.includeESLint) {
      conditions.push('eslint');
    }

    if (config.devTools.includePrettier) {
      conditions.push('prettier');
    }

    return conditions;
  }

  /**
   * Gets default content for common configuration files
   */
  private getDefaultFileContent(fileName: string, config: ProjectConfig): string | null {
    switch (fileName) {
      case 'tsconfig.json':
        return this.getDefaultTsConfig(config);
      case '.eslintrc.json':
        return this.getDefaultEslintConfig(config);
      case '.prettierrc':
        return this.getDefaultPrettierConfig();
      case 'tailwind.config.js':
        return this.getDefaultTailwindConfig(config);
      case 'postcss.config.js':
        return this.getDefaultPostcssConfig();
      default:
        return null;
    }
  }

  /**
   * Default TypeScript configuration
   */
  private getDefaultTsConfig(config: ProjectConfig): string {
    const baseConfig = {
      compilerOptions: {
        target: "es5",
        lib: ["dom", "dom.iterable", "es6"],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noFallthroughCasesInSwitch: true,
        module: "esnext",
        moduleResolution: "node",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx"
      } as any,
      include: ["src"],
      exclude: ["node_modules"]
    };

    if (config.framework === Framework.NEXTJS) {
      baseConfig.compilerOptions.plugins = [{ name: "next" }];
      baseConfig.compilerOptions.paths = { "@/*": ["./src/*"] };
      baseConfig.include = ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"];
    }

    return JSON.stringify(baseConfig, null, 2);
  }

  /**
   * Default ESLint configuration
   */
  private getDefaultEslintConfig(config: ProjectConfig): string {
    const baseConfig: any = {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: ["eslint:recommended"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      rules: {}
    };

    if (config.language === Language.TYPESCRIPT) {
      baseConfig.extends.push("@typescript-eslint/recommended");
      baseConfig.parser = "@typescript-eslint/parser";
      baseConfig.plugins = ["@typescript-eslint"];
    }

    if (config.framework === Framework.NEXTJS) {
      baseConfig.extends.push("next/core-web-vitals");
    } else if (config.framework === Framework.REACT_VITE) {
      baseConfig.extends.push("plugin:react/recommended", "plugin:react-hooks/recommended");
      baseConfig.plugins = [...(baseConfig.plugins || []), "react", "react-hooks", "react-refresh"];
      baseConfig.settings = { react: { version: "detect" } };
    }

    return JSON.stringify(baseConfig, null, 2);
  }

  /**
   * Default Prettier configuration
   */
  private getDefaultPrettierConfig(): string {
    return JSON.stringify({
      semi: true,
      trailingComma: "es5",
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2
    }, null, 2);
  }

  /**
   * Default Tailwind configuration
   */
  private getDefaultTailwindConfig(config: ProjectConfig): string {
    const contentPaths = config.framework === Framework.NEXTJS 
      ? ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"]
      : ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"];

    return `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(contentPaths, null, 4)},
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  }

  /**
   * Default PostCSS configuration
   */
  private getDefaultPostcssConfig(): string {
    return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  }

  /**
   * Creates the directory structure for the project
   */
  async createDirectoryStructure(structure: DirectoryStructure): Promise<void> {
    await fs.ensureDir(structure.path);
    
    if (structure.children) {
      for (const child of structure.children) {
        await this.createDirectoryStructure(child);
      }
    }
  }

  /**
   * Creates project directory structure based on framework and template
   */
  private async createProjectDirectoryStructure(
    config: ProjectConfig,
    template: TemplateDefinition,
    result: GenerationResult,
    cleanupActions: (() => Promise<void>)[]
  ): Promise<void> {
    const baseStructure = this.getBaseDirectoryStructure(config);
    
    for (const dir of baseStructure) {
      const dirPath = path.join(result.projectPath, dir);
      
      try {
        await fs.ensureDir(dirPath);
        
        // Add cleanup action for each directory
        cleanupActions.push(async () => {
          if (await fs.pathExists(dirPath)) {
            await fs.remove(dirPath);
          }
        });
      } catch (error) {
        const fsError = ErrorHandler.createFileSystemError(
          `Failed to create directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          FileSystemOperation.CREATE_DIRECTORY,
          dirPath
        );
        await ErrorHandler.handleError(fsError);
        
        result.errors.push({
          message: fsError.message,
          code: fsError.code,
        });
      }
    }
  }

  /**
   * Gets base directory structure based on framework
   */
  private getBaseDirectoryStructure(config: ProjectConfig): string[] {
    const commonDirs = ['src', 'public'];
    
    if (config.framework === Framework.NEXTJS) {
      return [
        ...commonDirs,
        'src/app',
        'src/components',
        'src/lib',
        'src/styles'
      ];
    } else if (config.framework === Framework.REACT_VITE) {
      return [
        ...commonDirs,
        'src/components',
        'src/hooks',
        'src/utils',
        'src/styles'
      ];
    }
    
    return commonDirs;
  }

  /**
   * Generates configuration files based on selected options
   */
  private async generateConfigurationFiles(
    config: ProjectConfig,
    result: GenerationResult,
    cleanupActions: (() => Promise<void>)[]
  ): Promise<void> {
    const configFiles: Array<{ name: string; content: string; condition?: boolean }> = [];

    // TypeScript configuration
    if (config.language === Language.TYPESCRIPT) {
      configFiles.push({
        name: 'tsconfig.json',
        content: this.getDefaultTsConfig(config)
      });
    }

    // ESLint configuration
    if (config.devTools.includeESLint) {
      configFiles.push({
        name: '.eslintrc.json',
        content: this.getDefaultEslintConfig(config)
      });
    }

    // Prettier configuration
    if (config.devTools.includePrettier) {
      configFiles.push({
        name: '.prettierrc',
        content: this.getDefaultPrettierConfig()
      });
    }

    // Tailwind configuration
    if (config.styling.includeTailwind) {
      configFiles.push({
        name: 'tailwind.config.js',
        content: this.getDefaultTailwindConfig(config)
      });
      configFiles.push({
        name: 'postcss.config.js',
        content: this.getDefaultPostcssConfig()
      });
    }

    // Write configuration files with error handling
    for (const configFile of configFiles) {
      if (configFile.condition !== false) {
        const filePath = path.join(result.projectPath, configFile.name);
        
        try {
          await fs.writeFile(filePath, configFile.content, 'utf-8');
          result.filesCreated.push(configFile.name);
          
          // Add cleanup action
          cleanupActions.push(async () => {
            if (await fs.pathExists(filePath)) {
              await fs.remove(filePath);
            }
          });
        } catch (error) {
          const fsError = ErrorHandler.createFileSystemError(
            `Failed to write configuration file ${configFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            FileSystemOperation.WRITE_FILE,
            filePath
          );
          await ErrorHandler.handleError(fsError);
          
          result.errors.push({
            message: fsError.message,
            code: fsError.code,
            file: configFile.name,
          });
        }
      }
    }
  }

  /**
   * Initializes Git repository and creates .gitignore
   */
  private async initializeGitRepository(
    config: ProjectConfig,
    result: GenerationResult
  ): Promise<void> {
    try {
      // Create .gitignore file
      const gitignoreResult = await this.gitService.createGitignore(result.projectPath, config);
      if (gitignoreResult.success) {
        result.filesCreated.push('.gitignore');
      } else {
        result.errors.push({
          message: gitignoreResult.message,
          code: 'GITIGNORE_FAILED',
        });
      }

      // Initialize Git repository
      const gitInitResult = await this.gitService.initializeRepository(result.projectPath);
      if (!gitInitResult.success) {
        result.errors.push({
          message: gitInitResult.message,
          code: 'GIT_INIT_FAILED',
        });
      }
    } catch (error) {
      result.errors.push({
        message: `Git initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'GIT_SETUP_FAILED',
      });
    }
  }

  /**
   * Copies template files from source to destination with processing
   */
  async copyTemplateFiles(
    sourcePath: string,
    destinationPath: string,
    context: TemplateContext,
    result: GenerationResult
  ): Promise<void> {
    try {
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        await fs.ensureDir(destinationPath);
        const files = await fs.readdir(sourcePath);
        
        for (const file of files) {
          const sourceFile = path.join(sourcePath, file);
          const destFile = path.join(destinationPath, file);
          await this.copyTemplateFiles(sourceFile, destFile, context, result);
        }
      } else if (stats.isFile()) {
        const content = await fs.readFile(sourcePath, 'utf-8');
        
        // Process as template if it's a .hbs file
        let processedContent = content;
        let processedPath = destinationPath;
        
        if (sourcePath.endsWith('.hbs')) {
          const template = Handlebars.compile(content);
          processedContent = template(context);
          processedPath = destinationPath.replace(/\.hbs$/, '');
        }
        
        // Handle file extension replacement
        if (processedPath.includes('{{ext}}')) {
          const extension = context.language === Language.TYPESCRIPT ? 'tsx' : 'jsx';
          processedPath = processedPath.replace(/{{ext}}/g, extension);
        }
        
        if (processedPath.includes('{{jsext}}')) {
          const extension = context.language === Language.TYPESCRIPT ? 'ts' : 'js';
          processedPath = processedPath.replace(/{{jsext}}/g, extension);
        }
        
        await fs.ensureDir(path.dirname(processedPath));
        await fs.writeFile(processedPath, processedContent, 'utf-8');
        
        const relativePath = path.relative(result.projectPath, processedPath);
        result.filesCreated.push(relativePath);
      }
    } catch (error) {
      result.errors.push({
        message: `Failed to copy template file ${sourcePath}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TEMPLATE_COPY_FAILED',
        file: sourcePath,
      });
    }
  }
}