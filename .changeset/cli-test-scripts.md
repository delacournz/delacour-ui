---
"delacour": minor
---

When `add` or `update` copies tests, it adds `test:ui` (every copied suite), `test:ui:unit` (the
logic suites) and, on Jest, `test:ui:render` (the render tests) to `package.json`, scoped to the
component directories so the project's own `test` script is untouched. A script already under one
of those names is kept as it is.
