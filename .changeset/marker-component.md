---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Marker`, a centred inline note for steps and day breaks between conversation turns

It comes as a bare `default` row, a hairline `border` capsule, or a `separator` label ruled to both edges. With no handler it is a plain view read as text; give it `onPress` or `onLongPress` and it becomes a pressable announced as a button. `Marker.Content shimmer` breathes the text on the UI thread while a step runs and announces the marker busy, stilled under reduce motion. `bunx delacour add marker` copies it in.
