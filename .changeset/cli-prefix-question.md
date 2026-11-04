---
"delacour": minor
---

`init` asks what components should call the library in place of `DelacourUI` (`--prefix <name>` on
`init` or the first `add` answers it), and `update` asks a project that has no `prefix` even after
components are copied: answering renames it through every copy, merging into edited files, and lists
the project's own files that still import `DelacourProvider`. A `prefix` set by hand in
`native-components.json` is renamed through on the next `update` the same way.
