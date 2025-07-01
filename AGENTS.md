# Agent Guidelines for AWS Glue Raycast Extension

## Build/Lint/Test Commands
- `pnpm run build` - Build the extension
- `pnpm run dev` - Start development mode
- `pnpm run lint` - Run ESLint checks
- `pnpm run fix-lint` - Auto-fix ESLint issues
- No test commands configured

## Code Style Guidelines
- Uses @raycast ESLint config with strict TypeScript
- Prettier: 120 char line width, double quotes
- File naming: kebab-case for files, PascalCase for React components
- Import order: External packages first, then relative imports
- Use `type` imports for TypeScript types (e.g., `type Job`)
- Prefer named exports over default exports for utilities
- Use interface for object types, type for unions/primitives

## TypeScript
- Strict mode enabled with ES2022 target
- Use explicit return types for functions
- Prefer optional chaining (`?.`) and nullish coalescing (`??`)
- Use Record<string, T> for object maps

## Error Handling
- Use Raycast's Toast API for user-facing errors
- Handle async operations with proper error boundaries
- Validate form inputs with custom validation functions