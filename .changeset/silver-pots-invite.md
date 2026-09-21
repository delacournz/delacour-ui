---
"delacour": patch
---

Work correctly on a project that already has Uniwind

Three bugs, all found against Expo's `with-router-uniwind` example — a scaffold that arrives with
Uniwind, Tailwind and Metro already wired.

- **`init` wrote its `@source` block into a file Metro does not compile.** A wired Metro config
  names its own `cssEntryFile`, and `init` recorded `<src>/styles/global.css` regardless — so
  Tailwind scanned a file with no globs in it, every class the components use was dropped, and
  every component rendered unstyled with nothing logged. It now reads `cssEntryFile` and `dtsFile`
  off the wrapped config and records those.
- **`doctor` failed the official template.** Its outermost-wrapper check required the export
  expression to begin with `withUniwindConfig`, and that template assigns the wrapped config to a
  variable before exporting it. The exported name is now followed to the last thing assigned to it
  above the export, a few hops deep.
- **`init` asked for a CSS import that was already there.** The follow-up list is now built from
  what the project actually has, so neither the CSS import nor the provider is listed once it is
  mounted.
