# Starter CLI

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

## Installation

### Global Installation (Recommended)

```bash
npm install -g starter-cli
```

### Using npx (No Installation Required)

```bash
npx starter-cli init my-project
```

### Verify Installation

```bash
starter-cli --version
starter-cli --help
```

## Usage

### Interactive Mode

Start the interactive project creation process:

```bash
starter-cli init
```

This will guide you through:
1. Project name selection
2. Framework choice (Next.js or React + Vite)
3. Template selection
4. Language preference (TypeScript/JavaScript)
5. Tooling options (Tailwind, Zustand, TanStack Query, ESLint, Prettier)
6. Package manager selection
7. Git initialization

### Command Line Options

```bash
# Create project with specific name
starter-cli init my-awesome-project

# Force creation in non-empty directory
starter-cli init my-project --force

# Skip dependency installation
starter-cli init my-project --skip-install

# Show help
starter-cli --help
starter-cli init --help
```

### Example Workflow

```bash
# 1. Create a new project
starter-cli init my-dashboard

# 2. Navigate to project directory
cd my-dashboard

# 3. Start development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

## What Gets Created

After running the CLI, you'll have a fully configured project with:

- ✅ Complete project structure
- ✅ Framework-specific configuration files
- ✅ TypeScript/JavaScript setup
- ✅ Tailwind CSS (if selected)
- ✅ State management setup (if selected)
- ✅ Data fetching configuration (if selected)
- ✅ ESLint and Prettier configuration
- ✅ Package.json with all dependencies
- ✅ Git repository (if selected)
- ✅ README with next steps

## Available Templates

### Next.js Templates
- **Minimal App Router**: Basic Next.js setup with App Router
- **Feature-Based**: Organized by feature modules
- **Dashboard**: Admin dashboard with layout components

### React + Vite Templates
- **Basic SPA**: Simple single-page application
- **Feature-Based**: Modular architecture
- **Component-Driven**: Component library focused

## Requirements

- **Node.js**: Version 18.0.0 or higher
- **Package Manager**: npm (included with Node.js), yarn, or pnpm

## Troubleshooting

### Common Issues

**Permission Errors on Global Install:**
```bash
# Use npm prefix to install globally without sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g starter-cli
```

**Node.js Version Issues:**
```bash
# Check your Node.js version
node --version

# Update Node.js if needed (using nvm)
nvm install 18
nvm use 18
```

**Template Loading Issues:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall the CLI
npm uninstall -g starter-cli
npm install -g starter-cli
```

## Development

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Setup
```bash
# Clone and install
git clone <repository-url>
cd starter-cli
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
- `npm run build:prod` - Production build
- `npm run dev` - Build and watch for changes
- `npm test` - Run tests
- `npm test:watch` - Run tests in watch mode
- `npm test:coverage` - Run tests with coverage
- `npm run lint` - Check linting
- `npm run lint:fix` - Fix linting issues
- `npm start` - Run the CLI locally

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
- 🐛 [Issue Tracker](https://github.com/starter-cli/starter-cli/issues)
- 💬 [Discussions](https://github.com/starter-cli/starter-cli/discussions)