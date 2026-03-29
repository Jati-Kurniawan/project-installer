import { TemplateProcessor } from '../core/template-engine/processor';
import { Framework, Language, TemplateFile, ProjectConfig, TemplateType, PackageManager } from '../types';

describe('TemplateProcessor Enhanced Features', () => {
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

  describe('Enhanced Handlebars helpers', () => {
    it('should process string case helpers', async () => {
      const templateFile: TemplateFile = {
        path: 'test.hbs',
        content: `
{{uppercase projectName}}
{{lowercase projectName}}
{{capitalize projectName}}
{{kebabCase projectName}}
{{camelCase "test-project"}}
{{pascalCase "test-project"}}
        `.trim(),
        encoding: 'utf-8',
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.content).toContain('TEST-PROJECT');
      expect(result!.content).toContain('test-project');
      expect(result!.content).toContain('Test-project');
      expect(result!.content).toContain('test-project');
      expect(result!.content).toContain('testProject');
      expect(result!.content).toContain('TestProject');
    });

    it('should process framework-specific helpers', async () => {
      const templateFile: TemplateFile = {
        path: 'test.hbs',
        content: `
{{#if (isNextjs framework)}}Next.js detected{{/if}}
{{#if (isReactVite framework)}}React+Vite detected{{/if}}
{{#if (isTypeScript language)}}TypeScript enabled{{/if}}
{{#if (isJavaScript language)}}JavaScript enabled{{/if}}
        `.trim(),
        encoding: 'utf-8',
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.content).toContain('Next.js detected');
      expect(result!.content).not.toContain('React+Vite detected');
      expect(result!.content).toContain('TypeScript enabled');
      expect(result!.content).not.toContain('JavaScript enabled');
    });

    it('should process file extension helpers', async () => {
      const templateFile: TemplateFile = {
        path: 'test.hbs',
        content: `
Component.{{reactExt language}}
Utils.{{jsExt language}}
        `.trim(),
        encoding: 'utf-8',
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.content).toContain('Component.tsx');
      expect(result!.content).toContain('Utils.ts');
    });

    it('should handle {{jsext}} in file paths', async () => {
      const templateFile: TemplateFile = {
        path: 'src/utils/helper.{{jsext}}.hbs',
        content: 'export const helper = () => {};',
        encoding: 'utf-8',
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.path).toBe('src/utils/helper.ts');
    });

    it('should process logical helpers (and, or)', async () => {
      const templateFile: TemplateFile = {
        path: 'test.hbs',
        content: `
{{#if options.styling.includeTailwind}}Tailwind enabled{{/if}}
{{#if options.dataFetching.includeTanStackQuery}}TanStack Query enabled{{/if}}
        `.trim(),
        encoding: 'utf-8',
      };

      const context = processor.createTemplateContext(mockConfig);
      const result = await processor.processTemplateFile(templateFile, context);

      expect(result).not.toBeNull();
      expect(result!.content).toContain('Tailwind enabled');
      expect(result!.content).toContain('TanStack Query enabled');
    });
  });

  describe('Batch processing', () => {
    it('should process multiple template files', async () => {
      const templateFiles: TemplateFile[] = [
        {
          path: 'package.json.hbs',
          content: '{"name": "{{projectName}}"}',
          encoding: 'utf-8',
        },
        {
          path: 'README.md.hbs',
          content: '# {{projectName}}',
          encoding: 'utf-8',
        },
      ];

      const context = processor.createTemplateContext(mockConfig);
      const results = await processor.processTemplateFiles(templateFiles, context);

      expect(results).toHaveLength(2);
      expect(results[0].path).toBe('package.json');
      expect(results[0].content).toContain('test-project');
      expect(results[1].path).toBe('README.md');
      expect(results[1].content).toContain('# test-project');
    });
  });

  describe('Template validation', () => {
    it('should validate correct template syntax', () => {
      const validTemplate = '{{projectName}} - {{framework}}';
      const result = processor.validateTemplate(validTemplate);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});