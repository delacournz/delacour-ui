---
"delacour": patch
---

`update` no longer crashes with `EPIPE` when the project's formatter exits before reading its input; the file is compared unformatted and the failure reported once.
