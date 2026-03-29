import * as fs from 'fs-extra';
import * as path from 'path';
import { TemplateRegistry } from '../../core/template-engine/registry';
import { TemplateProcessor } from '../../core/template-engine/processor';
import { Framework, TemplateType, Language, PackageManager } from '../../types';

describe('Template System Integration', () => {
  let registry: TemplateRegistry;
  let processor: TemplateProcessor;
  const templatesPath = path.join(process.cwd(), 'templates');

  beforeEach(() => {
    registry = new TemplateRegistry(templatesPath);
    processor = new TemplateProcessor();
  });

  describe('Next.js Minimal Template', () => {
    it('should load and process Next.js minimal template', async () => {
      // Check if template exists
      const templatePath = path.join(templatesPath, 'nextjs', 'minimal', 'template.json');
      if (!await fs.pathExists(templatePath)) {
        console.log('Skipping test - Next.js minimal template not found');
        return;
      }

      // Load template
      const template = await registry.loadTemplate(Framework.NEXTJS, TemplateType.MINIMAL);
      
      expect(template.id).toBe('nextjs-minimal');
      expect(template.framework).toBe(Framework.NEXTJS);
      expect(template.type).toBe(TemplateType.MINIMAL);
      expect(template.files.length).toBeGreaterThan(0);

      // Test processing a template file
      const packageJsonFile = template.files.find(f => f.path.includes('package.json'));
      if (packageJsonFile) {
        const context = processor.createTemplateContext({
          projectName: 'test-app',
          framework: Framework.NEXTJS,
          template: TemplateType.MINIMAL,
          language: Language.TYPESCRIPT,
          styling: { includeTailwind: true },
          stateManagement: { includeZustand: false },
          dataFetching: { includeTanStackQuery: true },
          devTools: { includeESLint: true, includePrettier: false },
          packageManager: PackageManager.NPM,
          gitInit: true,
        });

        const result = await processor.processTemplateFile(packageJsonFile, context);
        
        expect(result).not.toBeNull();
        expect(result!.content).toContain('"name": "test-app"');
        expect(result!.content).toContain('"next"');
        expect(result!.content).toContain('"react"');
      }
    });

    it('should discover available Next.js templates', async () => {
      const templates = await registry.getAvailableTemplates(Framework.NEXTJS);
      
      // Should find at least the minimal template if it exists
      if (await fs.pathExists(path.join(templatesPath, 'nextjs', 'minimal'))) {
        expect(templates).toContain(TemplateType.MINIMAL);
      }
    });
  });

  describe('React + Vite Basic SPA Template', () => {
    it('should load React + Vite basic SPA template if it exists', async () => {
      const templatePath = path.join(templatesPath, 'react-vite', 'basic-spa', 'template.json');
      if (!await fs.pathExists(templatePath)) {
        console.log('Skipping test - React + Vite basic SPA template not found');
        return;
      }

      const template = await registry.loadTemplate(Framework.REACT_VITE, TemplateType.BASIC_SPA);
      
      expect(template.id).toBe('react-vite-basic-spa');
      expect(template.framework).toBe(Framework.REACT_VITE);
      expect(template.type).toBe(TemplateType.BASIC_SPA);
    });

    it('should discover available React + Vite templates', async () => {
      const templates = await registry.getAvailableTemplates(Framework.REACT_VITE);
      
      // Should find templates if they exist
      if (await fs.pathExists(path.join(templatesPath, 'react-vite', 'basic-spa'))) {
        expect(templates).toContain(TemplateType.BASIC_SPA);
      }
    });
  });

  describe('Template Discovery', () => {
    it('should discover all available templates', async () => {
      const templates = await registry.discoverTemplates();
      
      // Should find templates based on what exists in the file system
      expect(Array.isArray(templates)).toBe(true);
      
      // Log discovered templates for debugging
      console.log('Discovered templates:', templates.map(t => `${t.framework}/${t.type}`));
    });
  });
});