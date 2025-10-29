# Vitest Unit Testing Design Document

## Overview

This design establishes Vitest as the primary unit testing framework for the Next.js CRM application. The implementation will provide comprehensive testing capabilities for utility functions, React hooks, and UI components, with proper configuration for TypeScript, React, and Next.js integration.

## Architecture

### Testing Framework Stack
- **Vitest**: Core testing framework and test runner
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Additional DOM matchers
- **@testing-library/react-hooks**: Hook testing utilities (if needed)
- **jsdom**: DOM environment simulation for browser APIs

### Project Structure
```
├── __tests__/                    # Test files directory
│   ├── components/               # Component tests
│   │   └── ui/                   # UI component tests
│   ├── hooks/                    # Hook tests
│   ├── lib/                      # Utility function tests
│   └── setup.ts                  # Test setup file
├── vitest.config.ts              # Vitest configuration
└── package.json                  # Updated with test scripts
```

## Components and Interfaces

### 1. Vitest Configuration
**File**: `vitest.config.ts`
- Environment setup (jsdom for React components)
- Path aliases matching Next.js configuration
- Test file patterns and exclusions
- Coverage configuration
- Setup files registration

### 2. Test Setup
**File**: `__tests__/setup.ts`
- Global test utilities import
- Custom matchers registration
- Mock configurations for Supabase client
- Global test environment setup

### 3. Utility Function Tests
**Directory**: `__tests__/lib/`
- Test the `cn` utility function with various class combinations
- Test the `formatDate` function with different date inputs
- Edge case testing for invalid inputs

### 4. React Hook Tests
**Directory**: `__tests__/hooks/`
- Test `useAuth` hook behavior and state management
- Mock Supabase client for authentication testing
- Test hook return values and state transitions
- Test cleanup and subscription management

### 5. UI Component Tests
**Directory**: `__tests__/components/ui/`
- Test Button component rendering with different variants
- Test component props and accessibility attributes
- Test user interaction handling
- Snapshot testing for consistent rendering

## Data Models

### Test Configuration Interface
```typescript
interface VitestConfig {
  environment: 'jsdom' | 'node';
  setupFiles: string[];
  alias: Record<string, string>;
  coverage: {
    provider: 'v8';
    reporter: string[];
    exclude: string[];
  };
}
```

### Mock Data Structures
```typescript
interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

interface MockAuthState {
  user: MockUser | null;
  loading: boolean;
}
```

## Error Handling

### Test Failure Management
- Clear error messages for failed assertions
- Proper cleanup of mocks between tests
- Timeout handling for async operations
- Memory leak prevention in hook tests

### Mock Error Scenarios
- Network failures in Supabase operations
- Invalid authentication states
- Component rendering errors
- Utility function edge cases

## Testing Strategy

### Unit Test Categories

#### 1. Utility Functions (`lib/utils.ts`)
- **cn function**: Test class name merging with various inputs
- **formatDate function**: Test date formatting with different date objects
- Edge cases: null/undefined inputs, invalid dates

#### 2. React Hooks (`hooks/use-auth.ts`)
- Initial state testing
- Authentication state changes
- Supabase client integration
- Cleanup and subscription management
- Loading states and error handling

#### 3. UI Components (`components/ui/button.tsx`)
- Rendering with different variants (default, destructive, outline, etc.)
- Size variations (default, sm, lg, icon)
- Props passing and className merging
- Accessibility attributes
- AsChild prop functionality

### Test Organization Principles
- One test file per source file
- Descriptive test names following "should [expected behavior] when [condition]" pattern
- Grouped tests using `describe` blocks for related functionality
- Setup and teardown using `beforeEach`/`afterEach` where needed

### Coverage Goals
- **Functions**: 90%+ coverage for utility functions
- **Hooks**: 85%+ coverage for custom hooks
- **Components**: 80%+ coverage for UI components
- **Exclude**: Configuration files, build artifacts, node_modules

### Mock Strategy
- Mock Supabase client for authentication tests
- Mock external dependencies but test internal logic
- Use real implementations for utility functions
- Minimal mocking to maintain test reliability

## Implementation Phases

### Phase 1: Framework Setup
- Install Vitest and testing dependencies
- Configure Vitest with TypeScript and React support
- Set up test scripts in package.json
- Create basic test setup file

### Phase 2: Utility Testing
- Implement tests for `lib/utils.ts` functions
- Test edge cases and error conditions
- Establish testing patterns and conventions

### Phase 3: Hook Testing
- Implement tests for `useAuth` hook
- Mock Supabase client appropriately
- Test async behavior and state management

### Phase 4: Component Testing
- Implement tests for Button component
- Test rendering, props, and interactions
- Establish component testing patterns

### Phase 5: Coverage and Optimization
- Configure coverage reporting
- Optimize test performance
- Add additional test utilities as needed