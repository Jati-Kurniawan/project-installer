# Project Architecture

## Overview

The CLI Scaffolding Tool follows a modular, layered architecture designed for maintainability, testability, and extensibility.

## Directory Structure

```
src/
├── bin/                    # CLI entry points
│   └── cli.ts             # Main CLI executable
├── lib/                   # Library exports
│   └── index.ts          # Main library entry point
├── core/                  # Core business logic
│   ├── config/           # Configuration management
│   │   ├── resolver.ts   # Configuration resolver
│   │   └── validator.ts  # Validation engine
│   ├── template-engine/  # Template processing
│   │   ├── processor.ts  # Template processor
│   │   └── registry.ts   # Template registry
│   └── project-generator/ # Project generation
│       ├── generator.ts   # Project generator
│       └── dependency-installer.ts # Dependency installer
├── commands/             # CLI commands
│   ├── index.ts         # Commands exports
│   └── init.ts          # Init command implementation
├── utils/               # Utility functions
│   ├── file-system.ts   # File system utilities
│   ├── validation.ts    # Validation utilities
│   ├── prompts.ts       # Interactive prompts
│   └── logger.ts        # Logging utilities
├── types/               # TypeScript type definitions
│   ├── config.ts        # Configuration types
│   ├── enums.ts         # Enums and constants
│   ├── template.ts      # Template types
│   ├── validation.ts    # Validation types
│   └── generation.ts    # Generation types
├── __tests__/           # Test files
│   ├── cli.test.ts      # CLI tests
│   ├── commands/        # Command tests
│   └── utils/           # Utility tests
└── index.ts             # Main library entry
```

## Architecture Layers

### 1. CLI Layer (`bin/`)
- Entry point for the CLI application
- Handles command parsing and routing
- Manages global error handling

### 2. Commands Layer (`commands/`)
- Implements specific CLI commands
- Orchestrates core functionality
- Handles command-specific logic

### 3. Core Layer (`core/`)
- Contains business logic
- Framework-agnostic implementations
- Reusable components

#### Configuration Management (`core/config/`)
- **Resolver**: Merges user selections into project configuration
- **Validator**: Validates configurations and user inputs

#### Template Engine (`core/template-engine/`)
- **Processor**: Handles template file processing and variable replacement
- **Registry**: Manages template discovery and loading

#### Project Generator (`core/project-generator/`)
- **Generator**: Creates project files and directory structure
- **Dependency Installer**: Manages package installation

### 4. Utilities Layer (`utils/`)
- Cross-cutting concerns
- Reusable helper functions
- System interactions

### 5. Types Layer (`types/`)
- TypeScript type definitions
- Interfaces and enums
- Type safety across the application

## Design Principles

### Separation of Concerns
Each module has a single responsibility and clear boundaries.

### Dependency Injection
Core components accept dependencies through constructors, making them testable.

### Interface-Based Design
Components depend on interfaces, not concrete implementations.

### Error Handling
Comprehensive error handling with typed error objects and recovery mechanisms.

### Testability
Clear separation allows for easy unit testing and mocking.

## Data Flow

1. **CLI Input** → Command parsing and validation
2. **Interactive Prompts** → User selection collection
3. **Configuration Resolution** → Merge selections with defaults
4. **Validation** → Ensure compatibility and correctness
5. **Template Processing** → Load and process templates
6. **Project Generation** → Create files and directories
7. **Dependency Installation** → Install packages
8. **Success Reporting** → Display results and next steps

## Extension Points

### Adding New Commands
1. Create command file in `commands/`
2. Add command registration in `bin/cli.ts`
3. Add tests in `__tests__/commands/`

### Adding New Templates
1. Create template directory structure
2. Add template metadata
3. Update template registry
4. Add template-specific types

### Adding New Frameworks
1. Add framework enum value
2. Create framework-specific templates
3. Update validation logic
4. Add framework-specific configuration

This architecture provides a solid foundation for the CLI tool while maintaining flexibility for future enhancements.