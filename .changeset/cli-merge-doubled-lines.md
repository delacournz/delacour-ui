---
"delacour": patch
---

`update` no longer reports a merge as clean when the project and the registry each added the same line
in different places. The merge used to keep both — a duplicate parameter in a file that then failed to
parse — and now writes the region as a conflict to resolve.
