import { Framework, Template, TemplateDefinition } from '../../types';

/**
 * Template registry for managing and discovering templates
 */
export class TemplateRegistry {
  private templates: Map<string, TemplateDefinition> = new Map();

  /**
   * Gets available templates for a specific framework
   */
  getAvailableTemplates(framework: Framework): Template[] {
    const frameworkTemplates: Template[] = [];
    
    // Placeholder implementation
    // In the future, this will load templates from the file system
    
    if (framework === Framework.NEXTJS) {
      frameworkTemplates.push('minimal', 'feature-based', 'dashboard');
    } else if (framework === Framework.REACT_VITE) {
      frameworkTemplates.push('basic-spa', 'feature-based', 'component-driven');
    }
    
    return frameworkTemplates;
  }

  /**
   * Loads a template definition by ID
   */
  async loadTemplate(templateId: string): Promise<TemplateDefinition> {
    // Placeholder implementation
    // In the future, this will load template metadata from template.json files
    
    const template: TemplateDefinition = {
      id: templateId,
      name: templateId.charAt(0).toUpperCase() + templateId.slice(1),
      description: `${templateId} template`,
      framework: Framework.NEXTJS, // This should be determined from the template
      type: templateId as any,
      files: [],
      dependencies: {},
      devDependencies: {},
      supportedOptions: [],
    };

    this.templates.set(templateId, template);
    return template;
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

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}