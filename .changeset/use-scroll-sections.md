---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `useScrollSections` — section-aware scroll tracking for long screens.

- `useScrollSections({ readingLine })` returns a `scrollHandler` for an `Animated.ScrollView`, a `register(id)` that hands back each section's `onLayout`, the `activeId` (React state that changes only when the reader crosses into another section), `progress` and `scrollY` as shared values, and `scrollTo(id)`.
- The active section is resolved on the UI thread and crosses to React only on a change, so scrolling never re-renders the screen.
- The pure resolvers behind it — `resolveActiveSection`, `resolveScrollProgress` and `resolveSectionScrollTarget` — are worklet-safe and exported from `lib/scroll-sections`.
- `delacour add use-scroll-sections` copies the hook and its resolvers into a project.
