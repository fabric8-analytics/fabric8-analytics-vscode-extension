# Coding Conventions

<!-- This file documents project-specific coding standards for fabric8-analytics-vscode-extension. -->

## Language and Framework

- **Primary Language**: TypeScript 5.8.3
- **Target**: ES2022 with CommonJS module system
- **VS Code API**: vscode 1.76.0
- **Bundler**: Webpack 5 with `ts-loader`
- **Key Libraries**: `@trustify-da/trustify-da-javascript-client`, `web-tree-sitter`, `openid-client`, `mustache`

## Code Style

- **Linter**: ESLint 8.51.0 with `@typescript-eslint` plugins
- **Formatter**: Prettier (single quotes)
- **File header**: `'use strict';` required at top of every file
- **Semicolons**: Always required (`@typescript-eslint/semi: ['error', 'always']`)
- **Quotes**: Single quotes enforced (`@typescript-eslint/quotes: ['error', 'single']`)
- **Curly braces**: Required (`curly: 'error'`)
- **No `var`**: `no-var: 'error'`
- **No require imports**: `@typescript-eslint/no-require-imports: 'error'`
- **Equality**: Strict equality required except for null (`eqeqeq: ['warn', 'always', { 'null': 'never' }]`)

## Naming Conventions

- **Classes/Interfaces/Enums**: PascalCase (`Vulnerability`, `Config`, `DependencyProvider`)
- **Interfaces**: PascalCase with descriptive prefix (`CANotificationData`)
- **Functions/Methods/Variables**: camelCase (`imageAnalysisService()`, `parseImageReference()`, `mockUri`)
- **Constants**: UPPER_CASE (`DEFAULT_RHDA_REPORT_FILE_PATH`, `EXTENSION_QUALIFIED_ID`)
- **Enum members**: UPPER_CASE (`VERSION`, `UTM_SOURCE`)
- **Private members**: `private readonly` prefix
- **File names**: camelCase (`caNotification.ts`, `codeActionHandler.ts`) or ecosystem names (`pom.xml.ts`, `package.json.ts`)

## File Organization

```
src/
├── extension.ts                    # Main entry point
├── constants.ts                    # Enums and constants
├── config.ts                       # Configuration class
├── vulnerability.ts                # Vulnerability data class
├── exhortServices.ts               # Service functions
├── utils.ts                        # Utility functions
├── providers/                      # Manifest file parsers (per ecosystem)
│   ├── pom.xml.ts
│   ├── package.json.ts
│   ├── build.gradle.ts
│   ├── requirements.txt.ts
│   ├── go.mod.ts
│   └── docker.ts
├── imageAnalysis/                  # Image analysis feature
└── dependencyAnalysis/             # Dependency analysis feature

test/
├── *.test.ts                       # Test files mirror src with .test.ts suffix
└── resources/                      # Test fixtures
```

## Error Handling

- **Error chaining**: Traverse `error.cause` chain for root cause
- **Dual messages**: `buildNotificationErrorMessage()` (user-facing) and `buildLogErrorMessage()` (detailed with stdout/stderr)
- **Type casting**: `as` for error handling (`error.cause as Error`)
- **Switch on status codes**: HTTP response status handling via switch statements

## Testing Conventions

- **Framework**: Mocha 10.8.2 with TDD UI (`suite()` / `test()`)
- **Assertions**: Chai 4.3.10 with `expect()` syntax, plus `sinon-chai`
- **Mocking**: Sinon 16.1.0 for stubs/spies
- **Coverage**: nyc 17.0.0
- **Test naming**: `"should [expected behavior]"`
- **Mock pattern**: Mock classes defined within test suites
- **Test scripts**: `npm run test-compile && node ./out/test/runTest.js`

## Commit Messages

- **Conventional Commits** (configured via `.conventional-changelog-config.js`)
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
- Changelog sections: enhancement, fixes, documentation, style, refactor, performance, tests, chore

## Dependencies

- **Package manager**: npm with `package-lock.json`
- **Bundling**: Webpack bundles to `dist/extension.js` (CommonJS)
- **VS Code**: Peer dependency, externalized
- **Node built-ins**: Externalized (fs, path, os, crypto, child_process)
- **Output**: `.vsix` packages for VS Code marketplace
- **Key scoped packages**: `@trustify-da/*`, `@vscode/*`, `@typescript-eslint/*`, `@xml-tools/*`
