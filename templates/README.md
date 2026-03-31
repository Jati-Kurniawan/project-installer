# Templates Directory

This directory contains all project templates for the CLI scaffolding tool.

## Structure

```
templates/
├── nextjs/
│   ├── minimal/
│   ├── feature-based/
│   └── dashboard/
└── react-vite/
    ├── basic-spa/
    ├── feature-based/
    └── component-driven/
```

## Template Metadata

Each template directory contains:
- `template.json` - Template metadata and configuration
- `base/` - Base template files
- `variants/` - Optional feature variants (TypeScript, Tailwind, etc.)

## Template.json Format

```json
{
  "name": "Template Name",
  "description": "Template description",
  "framework": "nextjs|react-vite",
  "type": "minimal|feature-based|dashboard|basic-spa|component-driven",
  "version": "1.0.0",
  "author": "CLI Scaffolding Tool",
  "supportedLanguages": ["typescript", "javascript"],
  "supportedOptions": {
    "styling": ["tailwind"],
    "stateManagement": ["zustand"],
    "dataFetching": ["tanstack-query"],
    "devTools": ["eslint", "prettier"]
  },
  "dependencies": {
    "base": {},
    "conditional": {}
  },
  "files": {
    "base": [],
    "conditional": {}
  }
}
```