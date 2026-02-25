# AGENTS.md

Guidelines for AI assistants working with the Elevator UI codebase.

## Research & Planning Docs

Feature research, implementation plans, and technical analyses live in `vibes/`. Before starting work on any non-trivial feature, check whether a relevant doc exists.

1. Read `vibes/README.md` to understand the conventions
2. Glob `vibes/*.md` and scan each file's front matter (`status`, `feature`, `type`)
3. Skip `status: implemented` docs unless doing archaeology
4. Read the `## Summary` section to confirm relevance before loading the full doc

---

## Backend Repository

The backend is a **CodeIgniter 3 / Doctrine ORM** PHP application backed by PostgreSQL. Its local path varies per developer — set it in your `CLAUDE.local.md` (gitignored).

**When a feature requires backend changes, read and modify the backend code directly.** Don't work around missing endpoints with mock-only solutions when the real backend needs to change.

### Key Backend Paths

```
<backend-root>/
  application/controllers/api/v1/  # RESTful API endpoints — add new endpoints here
  application/models/Entity/       # Doctrine ORM entities (generated from XML mappings)
  application/models/              # Business logic
  application/libraries/           # Shared application libraries
  assets/elevator-ui/              # The Vue SPA also lives here as a submodule
```

### Backend Patterns

- Controllers extend `MY_Controller` (handles auth, permissions, common setup)
- Use Doctrine entities and repositories for data access — no raw SQL
- Follow Laravel conventions where possible, even though the framework is CodeIgniter
- After schema changes: regenerate entities, preview SQL, apply it, then flush Redis (`redis-cli flushdb`)

### Full-Stack Development Flow

When a feature touches both repos:

1. Check `<backend-root>/AGENTS.md` for backend-specific conventions and Docker commands
2. Add or modify the API endpoint in `<backend-root>/application/controllers/api/v1/`
3. Update TypeScript types in `src/types/` to match
4. Update fetchers in `src/api/fetchers.ts`
5. Add a mock handler in `mock-server/` mirroring the real endpoint
6. Implement the frontend feature and write e2e tests

---

## Core Principles

### Code Style & Quality

- Write clean, simple, and readable code
- Follow accessibility best practices
- Use functional programming best practices and **pure** functions where possible
- Prefer declarative code over imperative code
- **Avoid deep nesting** - use early returns and guard clauses to keep code flat and readable
- Break complex logic into smaller, clearly named functions without excessive fragmentation
- Use comments to clarify intent (why), not just what
- Think about code readers - explain unfamiliar techniques or apis
- Avoid overengineering.
- **Don't add docblocks or JSDoc** when functionality is clear from the method signature
- **Don't add obvious comments** like `// Initialize variables` or `// Return result`
- If you need comments to explain what code does, consider refactoring for clarity instead

### Vue 3 Patterns

- Use Composition API with `<script setup>`
- Follow existing component patterns in `src/components/`
- Implement proper TypeScript interfaces from `src/types/`
- See "Key Project Patterns" below for state management, API integration, and component development details

### Type Safety

- **Never use `any` type** - use explicit types or `unknown`
- Always run `yarn vue-tsc` before completing tasks - fix all errors
- Use explicit typing for function parameters and return values
- Leverage type inference where it improves readability

### Testing

**E2E Testing is Critical - Prioritize Over Unit Tests**

- New features and bug fixes MUST have e2e tests. Use Playwright to test user workflows.
- Prioritize e2e tests over unit tests - They provide more value and catch real issues
- Don't waste time with excessive unit testing. Save the effort for exercising complex utility functions or composables that may not be covered by e2e tests.
- When a feature or bug fix may impact existing functionality, **begin by adding an e2e test for existing functionality** to ensure we don't introduce regressions.

**⚠️ IMPORTANT: How to Run E2E Tests**

Playwright does NOT auto-start the dev server. You must start it manually first, then run the tests in a separate step:

```bash
# Step 1 — start dev + mock server (keep running in background)
yarn dev:mock

# Step 2 — run e2e tests (in a separate terminal, once the server is up)
yarn test:e2e
```

Never run `yarn test:e2e` without first confirming `yarn dev:mock` is running on ports 5173 and 3001. If those ports are already occupied, kill the existing processes before starting.

**Mock Server for Testing**

- Use `yarn dev:mock` to run the development server with the mock backend. This allows you to test without needing the actual backend running.
- Mock server code is in `mock-server/`
- When writing tests that need new API endpoints:

1. **Check existing API types** - Look at `src/types/` and `src/api/fetchers.ts` for request/response types
2. **Infer the response structure** - Use the TypeScript types to understand what data the backend returns
3. **Add mock endpoint** - Create or update handlers in `mock-server/` to return data matching those types
4. **Match real backend behavior** - Mock endpoints should return realistic data structures

**Protecting Existing Features**

When making changes that may impact existing functionality:

1. **Check for existing e2e tests** - Look in Playwright test files
2. **If no e2e tests exist for affected features** - FIRST write e2e tests for the existing behavior before making changes. This ensures your changes don't break existing functionality

**Testing Guidelines**

- Run e2e tests: `yarn test:e2e` (Playwright)
- Run unit tests: `yarn test` (Vitest) - only for utilities/composables
- Test user interactions and workflows, not implementation details
- Cover common use cases and edge cases - **don't aim for 100% coverage**
- Use the mock server for consistent test data

**What to Test**

- ✅ **E2E**: User workflows, page interactions, form submissions, navigation
- ✅ **Unit**: Pure functions, composables, utility functions with complex logic
- ❌ **Don't unit test**: Components, stores, API calls (use e2e instead)

**When to Write Tests First**

- Before refactoring code that lacks test coverage
- Before fixing bugs in areas without e2e tests

---

## Key Project Patterns

### Widget System

- Templates define widget schemas
- Assets contain widget content following template structure
- Field names follow pattern: `{fieldTitle}_{widgetId}`
- Widgets handle both display and edit modes
- Check existing widgets in `src/components/Widget/`

### State Management

- Use Pinia stores for global state (see `src/stores/`)
- Use TanStack Query for server data fetching (see `src/queries/`)
- Queries use fetchers from `src/api/fetchers.ts`
- State should be immutable - avoid direct mutations
- Keep stores focused and single-purpose

### API Integration

- Use Axios-based API client in `src/api/fetchers.ts`
- Configuration merges env vars, runtime config, and defaults (see `src/config.ts`)
- Use `getBasePath()` and `getBaseOrigin()` from config
- Handle authentication via instanceStore

### Component Development

- Check similar components first to maintain consistency
- Props and emits should be fully typed and explicitly defined
- Use TailwindCSS following design tokens in `tailwind.config.js`
- Ensure accessibility (ARIA attributes, keyboard navigation)
- Extract complex/reusable logic into composables (`src/helpers/use*.ts`)

---

## Common Commands

```bash
# Type checking (do this often!)
yarn vue-tsc
yarn vue-tsc:watch        # Watch mode

# Development
yarn dev                  # Start dev server (localhost:5173)
yarn dev:mock             # Start dev server with mock backend (ports 5173 + 3001)

# Testing
yarn test                 # Run Vitest unit tests (for utilities/composables only)

# E2E Testing — TWO STEPS REQUIRED:
#   1. Start the server first (keep it running):
#      yarn dev:mock
#   2. Then in a separate terminal run:
#      yarn test:e2e
# Playwright does NOT auto-start the server!

# Build
yarn build                # Production build
```

---

## Pull Request Strategy

**Keep PRs Small and Focused**

- Each PR should do one thing and be independently reviewable
- Aim for < 400 lines of changes when possible
- Large features should be broken into multiple PRs

**Preparatory Refactoring**

When a new feature requires significant refactoring:

1. **First PR**: Refactoring only - make the change easy
2. **Second PR**: Feature implementation - make the easy change
3. Each PR should pass all tests and not break existing functionality

This approach:
- Makes code review manageable
- Reduces risk of bugs
- Allows incremental merging
- Makes it easier to identify issues if they arise

---

## Checklist Before Completing Tasks

- [ ] No `any` types used
- [ ] Run `yarn vue-tsc` - no TypeScript errors
- [ ] Run `yarn test` - unit tests pass
- [ ] E2E tests written for new features/bug fixes
- [ ] PR is focused and < 400 lines (break into multiple PRs if needed)
- [ ] Only changed files in scope (no unnecessary linting/refactoring)
- [ ] Tested with `yarn test:e2e`
