# Starter CLI

A command-line tool for scaffolding modern web development projects with Next.js and React + Vite templates.

## Features

- 🚀 Interactive project creation with `starter-cli init`
- 📦 Support for Next.js and React + Vite frameworks
- 🎨 Optional Tailwind CSS integration
- 🔄 State management with Zustand
- 📡 Data fetching with TanStack Query
- 🛠️ Development tools (ESLint, Prettier)
- 📋 Multiple package manager support (npm, yarn, pnpm)
- 🔧 TypeScript and JavaScript support

## Installation

```bash
npm install -g starter-cli
```

## Usage

### Create a new project

```bash
starter-cli init
```

This will start an interactive prompt to configure your new project.

### Get help

```bash
starter-cli --help
```

## Development

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Watch mode for development
- `npm run start` - Run the CLI tool
- `npm run test` - Run tests
- `npm run lint` - Lint the code
- `npm run clean` - Clean build artifacts

## License

MIT