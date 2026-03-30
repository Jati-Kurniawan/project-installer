import { TemplateRegistry } from '../../core/template-engine/registry';
import { TemplateProcessor } from '../../core/template-engine/processor';
import { Framework, TemplateType, Language, ProjectConfig, PackageManager } from '../../types';

describe('Language Filtering Integration', () => {
  let templateRegistry: TemplateRegistry;
  let templateProcessor: TemplateProcessor;

  beforeEach(() => {
    templateRegistry = new TemplateRegistry();
    templateProcessor = new TemplateProcessor();
  });

  it('should only generate TypeScript files when TypeScript is selected', async () => {
    // Load React Vite template
    const template = await templateRegistry.loadTemplate(Framework.REACT_VITE, TemplateType.BASIC_SPA);
    
    // Create TypeScript configuration
    const config: ProjectConfig = {
      projectName: 'test-ts-project',
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

    const context = templateProcessor.createTemplateContext(config);
    
    // Process all template files
    const processedFiles = await templateProcessor.processTemplateFiles(template.files, context);
    
    // Check that only TypeScript files are generated
    const filePaths = processedFiles.map(f => f.path.replace(/\\/g, '/'));
    
    // Should have TypeScript files
    expect(filePaths).toContain('src/main.tsx');
    expect(filePaths).toContain('src/App.tsx');
    
    // Should NOT have JavaScript files
    expect(filePaths).not.toContain('src/main.jsx');
    expect(filePaths).not.toContain('src/App.jsx');
    
    // Should have common files
    expect(filePaths).toContain('src/App.css');
    expect(filePaths).toContain('src/index.css');
    expect(filePaths).toContain('index.html');
  });

  it('should only generate JavaScript files when JavaScript is selected', async () => {
    // Load React Vite template
    const template = await templateRegistry.loadTemplate(Framework.REACT_VITE, TemplateType.BASIC_SPA);
    
    // Create JavaScript configuration
    const config: ProjectConfig = {
      projectName: 'test-js-project',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.JAVASCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const context = templateProcessor.createTemplateContext(config);
    
    // Process all template files
    const processedFiles = await templateProcessor.processTemplateFiles(template.files, context);
    
    // Check that only JavaScript files are generated
    const filePaths = processedFiles.map(f => f.path.replace(/\\/g, '/'));
    
    // Should have JavaScript files
    expect(filePaths).toContain('src/main.jsx');
    expect(filePaths).toContain('src/App.jsx');
    
    // Should NOT have TypeScript files
    expect(filePaths).not.toContain('src/main.tsx');
    expect(filePaths).not.toContain('src/App.tsx');
    
    // Should have common files
    expect(filePaths).toContain('src/App.css');
    expect(filePaths).toContain('src/index.css');
    expect(filePaths).toContain('index.html');
  });

  it('should filter Zustand store files based on language selection', async () => {
    // Load React Vite template
    const template = await templateRegistry.loadTemplate(Framework.REACT_VITE, TemplateType.BASIC_SPA);
    
    // Create TypeScript configuration with Zustand
    const config: ProjectConfig = {
      projectName: 'test-zustand-project',
      framework: Framework.REACT_VITE,
      template: TemplateType.BASIC_SPA,
      language: Language.TYPESCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: true },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const context = templateProcessor.createTemplateContext(config);
    
    // Process all template files
    const processedFiles = await templateProcessor.processTemplateFiles(template.files, context);
    
    // Check that only TypeScript store files are generated
    const filePaths = processedFiles.map(f => f.path.replace(/\\/g, '/'));
    
    // Should have TypeScript store file
    expect(filePaths).toContain('src/stores/counter.ts');
    
    // Should NOT have JavaScript store file
    expect(filePaths).not.toContain('src/stores/counter.js');
  });

  it('should filter Next.js files based on language selection', async () => {
    // Load Next.js template
    const template = await templateRegistry.loadTemplate(Framework.NEXTJS, TemplateType.MINIMAL);
    
    // Create JavaScript configuration
    const config: ProjectConfig = {
      projectName: 'test-nextjs-js',
      framework: Framework.NEXTJS,
      template: TemplateType.MINIMAL,
      language: Language.JAVASCRIPT,
      styling: { includeTailwind: false },
      stateManagement: { includeZustand: false },
      dataFetching: { includeTanStackQuery: false },
      devTools: { includeESLint: false, includePrettier: false },
      packageManager: PackageManager.NPM,
      gitInit: false,
    };

    const context = templateProcessor.createTemplateContext(config);
    
    // Process all template files
    const processedFiles = await templateProcessor.processTemplateFiles(template.files, context);
    
    // Check that only JavaScript files are generated
    const filePaths = processedFiles.map(f => f.path.replace(/\\/g, '/'));
    
    // Should have JavaScript files
    expect(filePaths).toContain('src/app/layout.jsx');
    expect(filePaths).toContain('src/app/page.jsx');
    
    // Should NOT have TypeScript files
    expect(filePaths).not.toContain('src/app/layout.tsx');
    expect(filePaths).not.toContain('src/app/page.tsx');
    
    // Should have common files
    expect(filePaths).toContain('src/app/globals.css');
  });
});