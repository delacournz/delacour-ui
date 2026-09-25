---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Surface`, a rounded container on the theme's fill ladder

Four fills — `default`, `secondary`, `tertiary` and `transparent` — and four padding steps. A
surface that names no variant steps to the next fill from the one it sits in, so a panel inside a
card never vanishes into it, and a transparent surface passes the plane beneath it through.
`useSurface()` exposes the resolved fill to custom children, and `padding="none"` clips, for
content bled to the corners. `bunx delacour add surface` copies it into a project.
