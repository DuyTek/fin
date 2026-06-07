# Quality gate:
- Linter passed
- Build production passed
- Bun test passed
- Coverage: >= 80%

# Scripts:
```json
"build": "bun run build.ts",
"lint": "eslint src",
"test": "bun test"
```

# Test directory:
src/tests

# Tools:
- `bun:test` package

# CI/CD:
.github/workflows/test.yaml

# Testing practice

**Do not test impossible cases that cannot be reproduced**
- Tests only relevants, edge cases with possible

**Code hierarchy: Imports --> Mock --> Describe --> Pre-run setup blocks --> Test Cases**

Example:
```tsx
// Imports here
import { test } from "bun:test";

// Mock, constants, file-scoped variables
mock('bla-bla', () => ({
    ...actual imports,
    mocked: () => "Hello World",
}))

// Describe here
describe("origin-file-name", () => {
    // Pre-run setup here
    // beforeEach, afterEach, afterAll,...

    // Test case here
    test("test case")
})

```