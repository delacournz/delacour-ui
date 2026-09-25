---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Label`, a form control's name with required, invalid and disabled states

`Label` renders `Text.Label` and takes a colour, never a scale, so it keeps the type scale the rest
of a form uses. `isRequired` appends a destructive asterisk as a nested run behind a no-break space,
so a label that wraps carries the mark after its last word, and announces the label as
"Email, required" rather than reading the asterisk aloud. `isInvalid` turns it destructive and
`isDisabled` fades it and reports it disabled to assistive technology.

```tsx
import { Label } from "@delacour/react-native-ui/label";

<Label isRequired>Email</Label>
```

`bunx delacour add label` copies it in, bringing `text` and `tv` with it.
