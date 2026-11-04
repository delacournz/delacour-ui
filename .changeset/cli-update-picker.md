---
"delacour": minor
---

`update` lists each component it would change — every file it updates, adds or merges, with a line
count — and asks which to take; an unticked component is left for the next run. `add` and `update`
now ask which missing packages to install, one checkbox each, instead of all or nothing.

`update` no longer adds a component the project does not hold unless the registry introduced it
since the copy: a dependency the project removed (an icon set swapped for another) is reported and
offered unticked, and a test that renders a component the project lacks is left out instead of
copying that component in.
