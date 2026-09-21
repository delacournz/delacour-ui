---
"delacour": patch
---

Adopt the Tailwind entry an app already has, and print the root layout

**One entry, never two.** `init` picked `<src>/styles/global.css` unless a wrapped Metro config
named another, so an app that had installed Uniwind and written its own `global.css` — without
wiring Metro to it yet — got a second entry. Tailwind then compiled the file holding the `@source`
globs while the app imported the one without them: every component unstyled, nothing logged, and
`doctor` reporting that nothing imports the entry. An entry already on disk is now adopted.

**The root layout is printed whole.** Two of the three follow-ups are edits to one file, so `init`
shows that file rather than describing it — and detects Expo Router, whose root layout is a
different file with a different shape (`app/_layout.tsx` rendering a `<Slot />`, not `App.tsx`).
The bullet and the snippet take their import paths from one function, so they cannot disagree.
