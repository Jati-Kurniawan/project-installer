import { TemplateProcessor } from '../../core/template-engine/processor';
import { Framework, Language, PackageManager, TemplateType } from '../../types';

describe('Simple Tooling Integration Test', () => {
  let processor: TemplateProcessor;

  beforeEach(() => {
    processor = new TemplateProcessor();
  });

  it('should process React Vite template with all tooling options', () => {
    const config = {
      projectName: 'test-app',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: true },
      dataFetching: { includeTanStackQuery: true },
      devTools: { includeESLint: true, includePrettier: true },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const context = processor.createTemplateContext(config);

    // Test that context has correct structure
    expect(context.projectName).toBe('test-app');
    expect(context.framework).toBe(Framework.REACT_VITE);
    expect(context.language).toBe(Language.TYPESCRIPT);
    expect(context.options.styling.includeTailwind).toBe(true);
    expect(context.options.stateManagement.includeZustand).toBe(true);
    expect(context.options.dataFetching.includeTanStackQuery).toBe(true);
    expect(context.options.devTools.includeESLint).toBe(true);
    expect(context.options.devTools.includePrettier).toBe(true);
  });

  it('should process template with conditional content for TanStack Query', async () => {
    const config = {
      projectName: 'test-app',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: true },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const templateContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

{{#if options.dataFetching.includeTanStackQuery}}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

{{/if}}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
{{#if options.dataFetching.includeTanStackQuery}}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
{{else}}
    <App />
{{/if}}
  </React.StrictMode>,
)`;

    const templateFile = {
      path: 'src/main.tsx',
      content: templateContent,
      encoding: 'utf-8' as const,
      conditional: false,
      conditions: [],
    };

    const context = processor.createTemplateContext(config);
    const result = await processor.processTemplateFile(templateFile, context);

    expect(result).not.toBeNull();
    expect(result!.content).toContain('QueryClient');
    expect(result!.content).toContain('QueryClientProvider');
    expect(result!.content).toContain('<QueryClientProvider client={queryClient}>');
  });

  it('should process template without TanStack Query when not selected', async () => {
    const config = {
      projectName: 'test-app',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const templateContent = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

{{#if options.dataFetching.includeTanStackQuery}}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

{{/if}}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
{{#if options.dataFetching.includeTanStackQuery}}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
{{else}}
    <App />
{{/if}}
  </React.StrictMode>,
)`;

    const templateFile = {
      path: 'src/main.tsx',
      content: templateContent,
      encoding: 'utf-8' as const,
      conditional: false,
      conditions: [],
    };

    const context = processor.createTemplateContext(config);
    const result = await processor.processTemplateFile(templateFile, context);

    expect(result).not.toBeNull();
    expect(result!.content).not.toContain('QueryClient');
    expect(result!.content).not.toContain('QueryClientProvider');
    expect(result!.content).toContain('<App />');
    expect(result!.content).not.toContain('<QueryClientProvider');
  });

  it('should process Tailwind CSS conditional content', async () => {
    const config = {
      projectName: 'test-app',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: true },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const templateContent = `{{#if options.styling.includeTailwind}}
@tailwind base;
@tailwind components;
@tailwind utilities;
{{else}}
/* Regular CSS styles */
body {
  margin: 0;
  font-family: sans-serif;
}
{{/if}}`;

    const templateFile = {
      path: 'src/index.css',
      content: templateContent,
      encoding: 'utf-8' as const,
      conditional: false,
      conditions: [],
    };

    const context = processor.createTemplateContext(config);
    const result = await processor.processTemplateFile(templateFile, context);

    expect(result).not.toBeNull();
    expect(result!.content).toContain('@tailwind base');
    expect(result!.content).toContain('@tailwind components');
    expect(result!.content).toContain('@tailwind utilities');
    expect(result!.content).not.toContain('Regular CSS styles');
  });
});