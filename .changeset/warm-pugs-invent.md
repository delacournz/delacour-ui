---
"delacour": patch
---

Refuse to stack a second Tailwind transform

Nothing noticed when a project already had **NativeWind**. It is Tailwind for React Native too: it
compiles `className`, and it does that by wrapping Metro. Wrapping Metro again on top of it leaves
classes resolving through whichever wrapper ran last and a build that fails naming neither library.

`init` now warns before it touches `metro.config.js`, and `doctor` carries a `Styling` check that
keeps saying so.

It is deliberately not fixed automatically. Which of the two a project keeps is the owner's call,
and uninstalling someone's styling library is not a thing a component CLI gets to do — so the
message points at Uniwind's migration guide instead.
