---
"delacour": minor
---

`init` copies the root provider in and `doctor` accepts `DelacourProvider` as the gesture root

`delacour init` now adds the `provider` item alongside `styles`, so `DelacourProvider` is in the
`ui` directory before anything is mounted, and its follow-up list names that import rather than a
bare `GestureHandlerRootView`. `doctor`'s Gesture Handler check passes on either name, reads a
blank template's root `App.tsx` as well as `app/` and `src/`, and no longer counts the copied
`provider.tsx` itself as the app mounting it.
