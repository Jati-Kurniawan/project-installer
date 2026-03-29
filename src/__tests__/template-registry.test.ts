import * as fs from 'fs-extra';
import * as path from 'path';
import { TemplateRegistry } from '../core/template-engine/registry';
import { Framework, TemplateType } from '../types';

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(__dirname, '../../test-templates');
    registry = new TemplateRegistry(tempDir);
    
    // Create test template structure
    await fs.ensureDir(path.join(tempDir, 'nextjs', 'minimal'));
    await fs.writeJson(path.join(tempDir, 'nextjs', 'minimal', 'template.json'), {
      name: 'Test Minimal Next.js',
      description: 'Test template',
      framework: 'nextjs',
      type: 'minimal',
      version: '1.0.0',
      author: 'Test',
      supportedLanguages: ['typescript', 'javascript'],
      supportedOptions: {
        styling: ['tailwind'],
        stateManagement: ['zustand'],
        dataFetching: ['tanstack-query'],
        devTools: ['eslint', 'prettier']
      },
      dependencies: {
        base: { 'next': '^14.0.0' },
        conditional: {}
      },
      files: {
        base: ['package.json.hbs'],
        conditional: {}
      }
    });

    // Create base directory and test file
    await fs.ensureDir(path.join(tempDir, 'nextjs', 'minimal', 'base'));
    await fs.writeFile(
      path.join(tempDir, 'nextjs', 'minimal', 'base', 'package.json.hbs'),
      '{"name": "{{projectName}}"}'
    );
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe('getAvailableTemplates', () => {
    it('should return available templates for a framework', async () => {
      const templates = await registry.getAvailableTemplates(Framework.NEXTJS);
      expect(templates).toContain(TemplateType.MINIMAL);
    });

    it('should return empty array for non-existent framework', async () => {
      const nonExistentPath = path.join(__dirname, '../../non-existent-templates');
      const emptyRegistry = new TemplateRegistry(nonExistentPath);
      const templates = await emptyRegistry.getAvailableTemplates(Framework.NEXTJS);
      expect(templates).toEqual([]);
    });
  });

  describe('loadTemplate', () => {
    it('should load template definition successfully', async () => {
      const template = await registry.loadTemplate(Framework.NEXTJS, TemplateType.MINIMAL);
      
      expect(template.id).toBe('nextjs-minimal');
      expect(template.name).toBe('Test Minimal Next.js');
      expect(template.framework).toBe(Framework.NEXTJS);
      expect(template.type).toBe(TemplateType.MINIMAL);
      expect(template.files).toHaveLength(1);
      expect(template.files[0].path).toBe('package.json.hbs');
      expect(template.files[0].content).toBe('{"name": "{{projectName}}"}');
    });

    it('should throw error for non-existent template', async () => {
      await expect(
        registry.loadTemplate(Framework.REACT_VITE, TemplateType.BASIC_SPA)
      ).rejects.toThrow('Template metadata not found');
    });
  });

  describe('discoverTemplates', () => {
    it('should discover all available templates', async () => {
      const templates = await registry.discoverTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].framework).toBe(Framework.NEXTJS);
      expect(templates[0].type).toBe(TemplateType.MINIMAL);
    });
  });

  describe('validateTemplate', () => {
    it('should validate template definition', async () => {
      const template = await registry.loadTemplate(Framework.NEXTJS, TemplateType.MINIMAL);
      const validation = registry.validateTemplate(template);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should return errors for invalid template', () => {
      const invalidTemplate = {
        id: '',
        name: '',
        description: '',
        framework: Framework.NEXTJS,
        type: TemplateType.MINIMAL,
        version: '1.0.0',
        author: 'Test',
        supportedLanguages: [],
        supportedOptions: [],
        files: [],
        dependencies: {},
        devDependencies: {},
        templatePath: '',
      };

      const validation = registry.validateTemplate(invalidTemplate);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Template ID is required');
      expect(validation.errors).toContain('Template name is required');
      expect(validation.errors).toContain('Template path is required');
    });
  });
});