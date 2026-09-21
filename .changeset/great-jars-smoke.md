---
"delacour": patch
---

`doctor` stops failing correct Metro configs, and tells you a path you can paste

- **`withUniwindConfig is not the outermost wrapper`, when it was.** The check required the export
  expression to *begin* with `withUniwindConfig`, so it failed both
  `const c = withUniwindConfig(…); module.exports = c;` and the reassignment a Metro config uses
  when it applies several wrappers in turn — `config = withUniwindConfig(config, …)`. A wrapper
  genuinely applied after Uniwind still fails, which is the point of the check.
- **`cssEntryFile does not point at the configured entry` restated the problem rather than the
  fix.** It now says which file Metro actually compiles and why that is the one that has to win.
- **The CSS import it told you to add did not resolve.** It was `./` plus the file's basename,
  which is right only when the root layout sits in the same directory as the CSS. On the ordinary
  Expo Router layout it is `../styles/global.css`, and that is what both `doctor` and `init` now
  print — from one function.
