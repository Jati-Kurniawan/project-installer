import { ProjectConfig, UserSelections, Framework, Language, PackageManager } from '../../types';

/**
 * Configuration resolver that merges user selections into a coherent project configuration
 */
export class ConfigurationResolver {
  /**
   * Resolves user selections into a complete project configuration
   */
  resolveConfiguration(selections: UserSelections): ProjectConfig {
    const config: ProjectConfig = {
      projectName: selections.projectName,
      framework: selections.framework,
      template: selections.template,
      language: selections.language,
      styling: {
        includeTailwind: selections.includeTailwind,
      },
      stateManagement: {
        includeZustand: selections.includeZustand,
      },
      dataFetching: {
        includeTanStackQuery: selections.includeTanStackQuery,
      },
      devTools: {
        includeESLint: selections.includeESLint,
        includePrettier: selections.includePrettier,
      },
      packageManager: selections.packageManager,
      gitInit: selections.initializeGit,
    };

    return this.applyDefaults(config);
  }

  /**
   * Applies framework-specific defaults to the configuration
   */
  applyDefaults(config: Partial<ProjectConfig>): ProjectConfig {
    const defaults: ProjectConfig = {
      projectName: config.projectName || 'my-project',
      framework: config.framework || Framework.NEXTJS,
      template: config.template || 'minimal',
      language: config.language || Language.TYPESCRIPT,
      styling: {
        includeTailwind: config.styling?.includeTailwind ?? false,
      },
      stateManagement: {
        includeZustand: config.stateManagement?.includeZustand ?? false,
      },
      dataFetching: {
        includeTanStackQuery: config.dataFetching?.includeTanStackQuery ?? false,
      },
      devTools: {
        includeESLint: config.devTools?.includeESLint ?? true,
        includePrettier: config.devTools?.includePrettier ?? true,
      },
      packageManager: config.packageManager || PackageManager.NPM,
      gitInit: config.gitInit ?? true,
    };

    return defaults;
  }
}