import { ProjectConfig, TemplateContext, TemplateFile, ProcessedFile } from '../../types';

/**
 * Template processor for handling template files and variable replacement
 */
export class TemplateProcessor {
  /**
   * Processes a template file with the given context
   */
  async processTemplateFile(file: TemplateFile, context: TemplateContext): Promise<ProcessedFile> {
    // Placeholder implementation
    // In the future, this will use Handlebars.js for template processing
    
    let processedContent = file.content;
    
    // Simple variable replacement for now
    processedContent = processedContent.replace(/{{projectName}}/g, context.projectName);
    processedContent = processedContent.replace(/{{framework}}/g, context.framework);
    processedContent = processedContent.replace(/{{language}}/g, context.language);
    
    return {
      path: file.path,
      content: processedContent,
      encoding: file.encoding || 'utf8',
    };
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
}