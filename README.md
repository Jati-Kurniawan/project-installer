# CLI Scaffolding Tool

A modern CLI tool for scaffolding web development projects with Next.js and React + Vite templates, featuring TypeScript support, integrated tooling, and interactive project setup.

## Features

- 🚀 **Multiple Frameworks**: Next.js (App Router) and React + Vite
- 📁 **Template Variety**: Minimal, Feature-Based, Dashboard, and Component-Driven templates
- 🔧 **Language Support**: TypeScript and JavaScript
- 🎨 **Styling Options**: Tailwind CSS integration
- 📦 **State Management**: Zustand support
- 🔄 **Data Fetching**: TanStack Query integration
- 🛠️ **Development Tools**: ESLint and Prettier configuration
- 📋 **Package Managers**: npm, yarn, and pnpm support
- 🔄 **Git Integration**: Automatic repository initialization
- ✨ **Interactive Setup**: Guided project configuration

## Quick Start

### Installation

```bash
# Install globally
npm install -g starter-cli

# Or use with npx
npx starter-cli init my-project
```

### Usage

```bash
# Interactive project creation
starter-cli init

# Create project with specific name
starter-cli init my-awesome-project

# Force creation in non-empty directory
starter-cli init my-project --force

# Skip dependency installation
starter-cli init my-project --skip-install
```

## Project Structure

```
src/
├── bin/                    # CLI entry points
├── lib/                    # Library exports
├── core/                   # Core business logic
│   ├── config/            # Configuration management
│   ├── template-engine/   # Template processing
│   └── project-generator/ # Project generation
├── commands/              # CLI commands
├── utils/                 # Utility functions
├── types/                 # TypeScript definitions
└── __tests__/             # Test files
```

## Available Templates

### Next.js Templates
- **Minimal App Router**: Basic Next.js setup with App Router
- **Feature-Based**: Organized by feature modules
- **Dashboard**: Admin dashboard with layout components

### React + Vite Templates
- **Basic SPA**: Simple single-page application
- **Feature-Based**: Modular architecture
- **Component-Driven**: Component library focused

## Development

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Setup
```bash
# Clone and install
git clone <repository-url>
cd cli-scaffolding-tool
npm install

# Build the project
npm run build

# Run tests
npm test

# Start development
npm run dev
```

### Scripts
- `npm run build` - Build the project
- `npm run dev` - Build and watch for changes
- `npm test` - Run tests
- `npm test:watch` - Run tests in watch mode
- `npm run lint` - Check linting
- `npm run lint:fix` - Fix linting issues
- `npm start` - Run the CLI

## Architecture

The project follows a modular, layered architecture:

- **CLI Layer**: Command parsing and routing
- **Commands Layer**: Command implementations
- **Core Layer**: Business logic and processing
- **Utils Layer**: Helper functions and utilities
- **Types Layer**: TypeScript type definitions

For detailed architecture information, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed development guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)