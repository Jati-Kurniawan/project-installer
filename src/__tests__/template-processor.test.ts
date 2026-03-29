import { TemplateProcessor } from '../core/template-engine/processor';
import { Framework, Language, TemplateFile, ProjectConfig, TemplateType, PackageManager } from '../types';

describe('TemplateProcessor', () => {
  let processor: TemplateProcessor;
  let mockConfig: ProjectConfig;

  beforeEach(() => {
    processor = new TemplateProcessor();
    mockConfig = {
      projectName: 'test-project',
      framework: Framework.NEXTJS,
      template: TemplateType.MINIMAL,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: true },
      devTools: { includeESLint: true, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: true,
    };
  });

  describe('processTemplateFile', () => {
    it('should process simple template variables', async () => {
      const templateFile: TemplateFile = {
        path: 'package.json.hbs',
        content: '{"name": "{{projectName}}"}',
        encoding: 'utf-8',
        conditional: false,
        conditions: [],
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.path).toBe('package.json');
      expect(result!.content).toBe('{"name": "test-project"}');
    });

    it('should handle file extension replacement for TypeScript', async () => {
      const templateFile: TemplateFile = {
        path: 'src/App.{{ext}}.hbs',
        content: 'export default function App() {}',
        encoding: 'utf-8',
        conditional: false,
        conditions: [],
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.path).toBe('src/App.tsx');
    });

    it('should handle file extension replacement for JavaScript', async () => {
      const jsConfig = { ...mockConfig, language: Language.JAVASCRIPT };
      const templateFile: TemplateFile = {
        path: 'src/App.{{ext}}.hbs',
        content: 'export default function App() {}',
        encoding: 'utf-8',
        conditional: false,
        conditions: [],
      };

      const context = processor.createTemplateContext(jsConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.path).toBe('src/App.jsx');
    });

    it('should process conditional templates with Handlebars', async () => {
      const templateFile: TemplateFile = {
        path: 'package.json.hbs',
        content: `{
  "name": "{{projectName}}",
  "dependencies": {
    "react": "^18.0.0"{{#if options.styling.includeTailwind}},
    "tailwindcss": "^3.3.0"{{/if}}
  }
}`,
        encoding: 'utf-8',
        conditional: false,
        conditions: [],
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.content).toContain('"tailwindcss": "^3.3.0"');
    });

    it('should exclude conditional files when conditions are not met', async () => {
      const templateFile: TemplateFile = {
        path: 'zustand-store.ts.hbs',
        content: 'export const useStore = create(() => ({}))',
        encoding: 'utf-8',
        conditional: true,
        conditions: ['zustand'],
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).toBeNull(); // Should be excluded because zustand is false
    });

    it('should include conditional files when conditions are met', async () => {
      const configWithZustand = {
        ...mockConfig,
        stateManagement: { includeZustand: true }
      };
      
      const templateFile: TemplateFile = {
        path: 'zustand-store.ts.hbs',
        content: 'export const useStore = create(() => ({}))',
        encoding: 'utf-8',
        conditional: true,
        conditions: ['zustand'],
      };

      const context = processor.createTemplateContext(configWithZustand);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.path).toBe('zustand-store.ts');
    });
  });

  describe('createTemplateContext', () => {
    it('should create proper template context from config', () => {
      const context = processor.createTemplateContext(mockConfig);

      expect(context.projectName).toBe('test-project');
      expect(context.framework).toBe(Framework.NEXTJS);
      expect(context.language).toBe(Language.TYPESCRIPT);
      expect(context.packageManager).toBe(PackageManager.NPM);
      expect(context.options.styling.includeTailwind).toBe(true);
      expect(context.options.stateManagement.includeZustand).toBe(false);
      expect(context.options.dataFetching.includeTanStackQuery).toBe(true);
      expect(context.options.devTools.includeESLint).toBe(true);
      expect(context.options.devTools.includePrettier).toBe(false);
    });
  });
});