# Test Protocol - AI Calendar Generator

Comprehensive testing strategy and protocol for ensuring code quality.

**Author**: Thomas J McLeish  
**Created**: 2026-01-08  
**Last Updated**: 2026-01-08

---

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Linting](#linting)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Writing New Tests](#writing-new-tests)
7. [CI/CD Integration](#cicd-integration)
8. [Coverage Goals](#coverage-goals)

---

## Overview

This project uses a multi-layered testing approach:
- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test components with dependencies
- **Linting**: Enforce code style and catch common errors
- **Type Checking**: TypeScript static analysis
- **Manual Testing**: User-facing functionality verification

**Test Stack:**
- Jest - Test framework
- React Testing Library - Component testing
- @swc/jest - Fast TypeScript transforms
- ESLint - Code linting
- TypeScript - Type checking

---

## Test Types

### 1. Unit Tests

Test individual functions in isolation.

**Location**: `__tests__/lib/`  
**Pattern**: `*.test.ts`  
**Examples**:
- `calendar-utils.test.ts` - Date generation, formatting
- `repository.test.ts` - Data storage operations

**When to Write**:
- Pure functions (no side effects)
- Business logic
- Utility functions
- Data transformations

### 2. Integration Tests

Test components with their dependencies.

**Location**: `__tests__/components/`  
**Pattern**: `*.test.tsx`  
**Examples**:
- Calendar component with state
- Forms with validation
- API integration

**When to Write**:
- React components
- User interactions
- API calls
- State management

### 3. End-to-End Tests (Future)

Test complete user flows.

**Not yet implemented** - Recommended for Phase 2:
- Playwright or Cypress
- Critical user paths
- Cross-browser testing

---

## Running Tests

### Quick Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Type check without building
npm run type-check

# Run all validation (lint + types + tests)
npm run validate
```

### Individual Test Files

```bash
# Run specific test file
npm test -- calendar-utils.test.ts

# Run tests matching pattern
npm test -- repository

# Update snapshots (if using)
npm test -- -u
```

### Watching for Changes

During development, keep tests running:

```bash
npm run test:watch
```

This will:
- Re-run tests when files change
- Only run tests related to changed files
- Show interactive menu for filtering

---

## Linting

### ESLint Rules

**Enforced Rules**:
- `@typescript-eslint/no-explicit-any`: No `any` types allowed
- `@typescript-eslint/no-unused-vars`: Catch unused variables
- `no-console`: Warn on console.log (error/warn allowed)
- `prefer-const`: Use const when variable doesn't change
- `react-hooks/exhaustive-deps`: Catch missing dependencies

### Running Lint Checks

```bash
# Check for issues
npm run lint

# Auto-fix simple issues
npm run lint:fix
```

### Fixing Common Issues

**1. Unused Variables**
```typescript
// ❌ Bad
const unused = 5;

// ✅ Good - prefix with underscore if intentional
const _unused = 5;
```

**2. Console Statements**
```typescript
// ❌ Bad
console.log('Debug info');

// ✅ Good
console.error('Error occurred');  // Allowed
console.warn('Warning');          // Allowed
```

**3. No Any Types**
```typescript
// ❌ Bad
function process(data: any) {}

// ✅ Good
function process(data: CalendarNote) {}
function process(data: unknown) {}  // If truly unknown
```

---

## Manual Testing Checklist

### Pre-Deployment Checks

Run these manual tests before deploying:

#### Authentication
- [ ] Can sign in with any credentials (demo mode)
- [ ] Session persists across page refreshes
- [ ] Sign out redirects to login
- [ ] Unauthenticated users redirect to /auth/signin

#### Calendar Display
- [ ] Current month displays correctly
- [ ] Previous/next month navigation works
- [ ] Today's date is highlighted
- [ ] Dates with notes show colored background
- [ ] Clicking date opens detail panel

#### Date Detail Panel
- [ ] Opens when date is clicked
- [ ] Displays all notes for the date
- [ ] Can add new note
- [ ] Can edit existing note
- [ ] Can delete note
- [ ] Time field works (optional)
- [ ] Category field works (optional)
- [ ] Color picker works
- [ ] Close button closes panel

#### Data Persistence
- [ ] Notes save to localStorage
- [ ] Notes persist after page refresh
- [ ] Notes survive browser restart
- [ ] Multiple notes per date work
- [ ] Notes sorted by time (if present)

#### Responsive Design
- [ ] Works on desktop (1920px)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)
- [ ] Calendar grid responsive
- [ ] Detail panel responsive

#### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Writing New Tests

### Test File Structure

```typescript
/**
 * Component/Function Name Tests
 * 
 * Description of what's being tested.
 * 
 * @author Thomas J McLeish
 * @license MIT
 * @created YYYY-MM-DD
 */

import { functionToTest } from '@/path/to/file';

describe('functionName', () => {
  // Setup that runs before each test
  beforeEach(() => {
    // Reset state, clear mocks, etc.
  });

  describe('specific feature', () => {
    test('does something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  test('renders with correct text', () => {
    render(<MyComponent />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Code

```typescript
test('loads data asynchronously', async () => {
  const promise = fetchData();
  
  // Wait for promise to resolve
  const data = await promise;
  
  expect(data).toEqual({ success: true });
});

// Or with Testing Library
test('displays loaded data', async () => {
  render(<DataComponent />);
  
  // Wait for element to appear
  const element = await screen.findByText('Loaded data');
  expect(element).toBeInTheDocument();
});
```

### Mocking

```typescript
// Mock a module
jest.mock('@/lib/api', () => ({
  fetchData: jest.fn(() => Promise.resolve({ data: 'test' })),
}));

// Mock localStorage (already done in jest.setup.ts)
beforeEach(() => {
  localStorage.clear();
});

// Mock timers
jest.useFakeTimers();
jest.advanceTimersByTime(1000);
jest.useRealTimers();
```

---

## CI/CD Integration

### GitHub Actions (Recommended)

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Vercel Integration

Tests run automatically on Vercel deployments if configured in `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm run validate && next build"
  }
}
```

---

## Coverage Goals

### Current Thresholds

Set in `jest.config.ts`:

```typescript
coverageThresholds: {
  global: {
    branches: 50,    // 50% of branches covered
    functions: 50,   // 50% of functions covered
    lines: 50,       // 50% of lines covered
    statements: 50,  // 50% of statements covered
  },
}
```

### Viewing Coverage

```bash
npm run test:coverage
```

Opens HTML report in `coverage/lcov-report/index.html`

### Priority Files for Coverage

**High Priority** (aim for 80%+):
- `lib/repositories/*.ts` - Data layer
- `lib/calendar-utils.ts` - Core logic
- `lib/auth/*.ts` - Authentication

**Medium Priority** (aim for 60%+):
- `components/calendar/*.tsx` - UI components
- `app/page.tsx` - Main routes

**Low Priority** (aim for 40%+):
- Configuration files
- Type definitions
- Mock data

---

## Debugging Tests

### Common Issues

**1. Tests timing out**
```typescript
// Increase timeout for slow tests
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

**2. Act warnings**
```typescript
// Wrap state updates in act()
import { act } from '@testing-library/react';

act(() => {
  // State updates here
});
```

**3. Module not found**
```typescript
// Check path aliases in jest.config.ts
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Debug Mode

```bash
# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open Chrome DevTools:
# chrome://inspect
```

---

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the user sees/does
   - Don't test internal state
   - Don't test implementation details

2. **Keep Tests Simple**
   - One concept per test
   - Clear arrange/act/assert sections
   - Descriptive test names

3. **Use Meaningful Assertions**
   ```typescript
   // ❌ Bad
   expect(result).toBeTruthy();
   
   // ✅ Good
   expect(result).toBe('expected value');
   ```

4. **Avoid Test Interdependence**
   - Each test should run independently
   - Clean up after tests
   - Don't rely on test execution order

5. **Mock External Dependencies**
   - API calls
   - Browser APIs
   - Third-party libraries
   - Current date/time

6. **Test Edge Cases**
   - Empty inputs
   - Null/undefined
   - Large datasets
   - Error conditions

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://testingjavascript.com/)
- [ESLint Rules](https://eslint.org/docs/rules/)

---

## Questions?

For testing questions or issues:
1. Check this document first
2. Review existing tests for examples
3. Consult Jest/RTL documentation
4. Ask the team

**Remember**: Good tests = Confident deployments
