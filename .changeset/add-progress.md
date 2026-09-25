---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Progress` — a bar showing how far a task has got, or a looping segment while it is under way.

- Compound anatomy: `Progress.Header`, `Progress.Label`, `Progress.Output`, `Progress.Track` and `Progress.Fill`; a bare `<Progress value={40} />` draws the track and fill on its own.
- The fill animates on the UI thread as a clipped `translateX`, with no layout pass per frame. `isIndeterminate` sweeps a segment across the track, and breathes in place instead when Reduce Motion is on.
- Six colours and three sizes, shared with `Slider`. `formatOptions`, a function child on `Progress.Output`, or `valueLabel` word the readout.
- One accessible element with the `progressbar` role: the value is spoken as a percentage over 0–100 and as a count (`18 of 24`) over any other range, and an indeterminate bar reports busy with no value.
- `delacour add progress` copies it into a project.
