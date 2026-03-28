# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd cli-scaffolding-tool

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Workflow

#### Building
```bash
# Build once
npm run build

# Build and watch for changes
npm run dev
```

#### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test -- src/__tests__/cli.test.ts
```

#### Linting
```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

#### Running the CLI
```bash
# Run the built CLI
npm start

# Or run directly
node dist/bin/cli.js init
```

## Project Structure

### Core Components

#### CLI Entry Point (`src/bin/cli.ts`)
- Main executable file
- Command registration and parsing
- Global error handling

#### Commands (`src/commands/`)
- Individual command implementations
- Command-specific logic and orchestration

#### Core Logic (`src/core/`)
- Business logic separated by domain
- Framework-agnostic implementations
- Reusable components

#### Utilities (`src/utils/`)
- Helper functions and utilities
- Cross-cutting concerns
- System interactions

#### Types (`src/types/`)
- TypeScript type definitions
- Interfaces and enums
- Type safety across the application

### Testing Structure

#### Unit Tests (`src/__tests__/`)
- Test files mirror the source structure
- Comprehensive test coverage
- Mock external dependencies

#### Test Categories
- **CLI Tests**: Command parsing and execution
- **Command Tests**: Command-specific functionality
- **Core Tests**: Business logic validation
- **Utility Tests**: Helper function validation

## Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Define explicit types for all public APIs
- Use interfaces for object shapes
- Use enums for constants

### Error Handling
- Use typed error objects
- Provide meaningful error messages
- Implement graceful degradation
- Clean up resources on failure

### Testing
- Write tests for all public APIs
- Use descriptive test names
- Mock external dependencies
- Test both success and failure cases

### Documentation
- Document all public APIs
- Use JSDoc comments for functions
- Keep README and docs up to date
- Include examples in documentation

## Adding New Features

### Adding a New Command

1. **Create Command File**
   ```typescript
   // src/commands/new-command.ts
   export async function newCommand(options: CommandOptions): Promise<void> {
     // Implementation
   }
   ```

2. **Register Command**
   ```typescript
   // src/bin/cli.ts
   program
     .command('new-command')
     .description('Description of new command')
     .action(newCommand);
   ```

3. **Add Tests**
   ```typescript
   // src/__tests__/commands/new-command.test.ts
   describe('New Command', () => {
     // Test cases
   });
   ```

4. **Update Exports**
   ```typescript
   // src/commands/index.ts
   export * from './new-command';
   ```

### Adding a New Core Component

1. **Create Component**
   ```typescript
   // src/core/new-component/index.ts
   export class NewComponent {
     // Implementation
   }
   ```

2. **Add Types**
   ```typescript
   // src/types/new-component.ts
   export interface NewComponentOptions {
     // Type definitions
   }
   ```

3. **Add Tests**
   ```typescript
   // src/__tests__/core/new-component.test.ts
   describe('NewComponent', () => {
     // Test cases
   });
   ```

4. **Update Exports**
   ```typescript
   // src/core/index.ts
   export * from './new-component';
   ```

### Adding a New Template

1. **Create Template Directory**
   ```
   templates/framework/template-name/
   ├── template.json
   ├── base/
   └── variants/
   ```

2. **Add Template Metadata**
   ```json
   {
     "name": "Template Name",
     "description": "Template description",
     "framework": "framework-name",
     "supportedOptions": ["option1", "option2"]
   }
   ```

3. **Update Template Registry**
   ```typescript
   // Add template to registry discovery
   ```

4. **Add Template Tests**
   ```typescript
   // Test template processing and generation
   ```

## Debugging

### CLI Debugging
```bash
# Enable debug output
DEBUG=starter-cli* npm start

# Run with Node.js debugger
node --inspect dist/bin/cli.js init
```

### Test Debugging
```bash
# Run tests with debugger
node --inspect node_modules/.bin/jest --runInBand

# Debug specific test
node --inspect node_modules/.bin/jest --runInBand src/__tests__/cli.test.ts
```

## Release Process

1. **Update Version**
   ```bash
   npm version patch|minor|major
   ```

2. **Build and Test**
   ```bash
   npm run build
   npm test
   ```

3. **Publish**
   ```bash
   npm publish
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following coding standards
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Troubleshooting

### Common Issues

#### Build Errors
- Check TypeScript configuration
- Verify all imports are correct
- Ensure all dependencies are installed

#### Test Failures
- Check mock configurations
- Verify test data and expectations
- Ensure proper cleanup in tests

#### CLI Issues
- Verify binary path in package.json
- Check file permissions
- Ensure proper shebang in CLI file

For more help, check the issue tracker or create a new issue.