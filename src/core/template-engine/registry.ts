import * as fs from 'fs-extra';
import * as path from 'path';
import { Framework, TemplateType, TemplateDefinition, TemplateMetadata, TemplateFile, ToolingOption } from '../../types';

/**
 * Template registry for managing and discovering templates
 */
export class TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();
  private templatesPath: string;

  constructor(templatesPath: string = path.join(process.cwd(), 'templates')) {
    this.templatesPath = templatesPath;
  }

  /**
   * Gets available templates for a specific framework
   */
  async getAvailableTemplates(framework: Framework): Promise<TemplateType[]> {
    const frameworkPath = path.join(this.templatesPath, framework);
    
    if (!await fs.pathExists(frameworkPath)) {
      return [];
    }

    const templateDirs = await fs.readdir(frameworkPath);
    const availableTemplates: TemplateType[] = [];

    for (const dir of templateDirs) {
      const templatePath = path.join(frameworkPath, dir);
      const metadataPath = path.join(templatePath, 'template.json');
      
      if (await fs.pathExists(metadataPath)) {
        try {
          const metadata = await this.loadTemplateMetadata(metadataPath);
          if (Object.values(TemplateType).includes(metadata.type)) {
            availableTemplates.push(metadata.type);
          }
        } catch (error) {
          console.warn(`Failed to load template metadata for ${dir}:`, error);
        }
      }
    }

    return availableTemplates;
  }

  /**
   * Loads a template definition by framework and type
   */
  async loadTemplate(framework: Framework, templateType: TemplateType): Promise<TemplateDefinition> {
    const templateId = `${framework}-${templateType}`;
    
    if (this.templates.has(templateId)) {
      return this.templates.get(templateId)!;
    }

    const templatePath = path.join(this.templatesPath, framework, templateType);
    const metadataPath = path.join(templatePath, 'template.json');

    if (!await fs.pathExists(metadataPath)) {
      throw new Error(`Template metadata not found: ${metadataPath}`);
    }

    const metadata = await this.loadTemplateMetadata(metadataPath);
    const files = await this.loadTemplateFiles(templatePath);

    const template: TemplateDefinition = {
      id: templateId,
      name: metadata.name,
      description: metadata.description,
      framework: metadata.framework,
      type: metadata.type,
      version: metadata.version,
      author: metadata.author,
      supportedLanguages: metadata.supportedLanguages,
      supportedOptions: this.convertSupportedOptions(metadata.supportedOptions),
      files,
      dependencies: metadata.dependencies.base,
      devDependencies: {},
      templatePath,
    };

    this.templates.set(templateId, template);
    return template;
  }

  /**
   * Loads template metadata from template.json
   */
  private async loadTemplateMetadata(metadataPath: string): Promise<TemplateMetadata> {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content) as TemplateMetadata;
    
    const validation = this.validateTemplateMetadata(metadata);
    if (!validation.isValid) {
      throw new Error(`Invalid template metadata: ${validation.errors.join(', ')}`);
    }

    return metadata;
  }

  /**
   * Loads all template files from the template directory
   */
  private async loadTemplateFiles(templatePath: string): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];
    const basePath = path.join(templatePath, 'base');

    if (await fs.pathExists(basePath)) {
      await this.loadFilesRecursively(basePath, basePath, files);
    }

    return files;
  }

  /**
   * Recursively loads files from a directory
   */
  private async loadFilesRecursively(
    currentPath: string,
    basePath: string,
    files: TemplateFile[]
  ): Promise<void> {
    const items = await fs.readdir(currentPath);

    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stat = await fs.stat(itemPath);

      if (stat.isDirectory()) {
        await this.loadFilesRecursively(itemPath, basePath, files);
      } else {
        const relativePath = path.relative(basePath, itemPath);
        const content = await fs.readFile(itemPath, 'utf-8');
        
        files.push({
          path: relativePath,
          content,
          encoding: 'utf-8',
          conditional: false,
          conditions: [],
        });
      }
    }
  }

  /**
   * Converts supported options from metadata format to ToolingOption array
   */
  private convertSupportedOptions(supportedOptions: TemplateMetadata['supportedOptions']): ToolingOption[] {
    const options: ToolingOption[] = [];
    
    Object.entries(supportedOptions).forEach(([category, categoryOptions]) => {
      categoryOptions.forEach(option => {
        if (this.isValidToolingOption(option)) {
          options.push(option as ToolingOption);
        }
      });
    });

    return options;
  }

  /**
   * Checks if a string is a valid ToolingOption
   */
  private isValidToolingOption(option: string): boolean {
    const validOptions = [
      'typescript',
      'javascript',
      'tailwind',
      'zustand',
      'tanstack-query',
      'eslint',
      'prettier'
    ];
    return validOptions.includes(option);
  }

  /**
   * Validates template metadata
   */
  private validateTemplateMetadata(metadata: TemplateMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!metadata.name) {
      errors.push('Template name is required');
    }

    if (!metadata.description) {
      errors.push('Template description is required');
    }

    if (!metadata.framework || !Object.values(Framework).includes(metadata.framework)) {
      errors.push('Valid template framework is required');
    }

    if (!metadata.type || !Object.values(TemplateType).includes(metadata.type)) {
      errors.push('Valid template type is required');
    }

    if (!metadata.version) {
      errors.push('Template version is required');
    }

    if (!metadata.supportedLanguages || metadata.supportedLanguages.length === 0) {
      errors.push('At least one supported language is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates a template definition
   */
  validateTemplate(template: TemplateDefinition): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.id) {
      errors.push('Template ID is required');
    }

    if (!template.name) {
      errors.push('Template name is required');
    }

    if (!template.framework) {
      errors.push('Template framework is required');
    }

    if (!template.templatePath) {
      errors.push('Template path is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Discovers all available templates
   */
  async discoverTemplates(): Promise<TemplateDefinition[]> {
    const templates: TemplateDefinition[] = [];

    for (const framework of Object.values(Framework)) {
      const availableTypes = await this.getAvailableTemplates(framework);
      
      for (const templateType of availableTypes) {
        try {
          const template = await this.loadTemplate(framework, templateType);
          templates.push(template);
        } catch (error) {
          console.warn(`Failed to load template ${framework}/${templateType}:`, error);
        }
      }
    }

    return templates;
  }
}