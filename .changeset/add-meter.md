---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Meter` — a measurement on a fixed scale, coloured by where it falls.

- Built on `Progress`: `Meter.Header`, `Meter.Label`, `Meter.Output`, `Meter.Track` and `Meter.Fill` are the progress bar's parts, with a root that clamps the reading and judges it. A bare `<Meter value={68} />` draws the scale on its own.
- Judge a reading by `low`, `high` and `optimum` — good, worse and worst regions painted success, warning and destructive, with `optimum` saying which end is good — or by a `thresholds` list naming the colour from points along the scale. The prop type allows one or the other, never both.
- `segments` draws the scale as whole blocks that fade on and off; any reading above the floor lights at least one.
- `valueLabel` takes a function handed the judged reading and its `region`, so the judgement is put into words that are drawn and spoken alike rather than left to colour. One accessible element with the `progressbar` role, spoken the way `Progress` speaks its value.
- `delacour add meter` copies it into a project, along with `progress`.
