---
"@delacour/react-native-ui": minor
---

Add the etched material, the tray and the kicker — opt-in, the default look is unchanged

`Surface` and `Card` take `material`: `flat` (default), `etched` (a one-pixel highlight set into the edge, with a very soft drop) and `tray` (a muted frame, 4pt padding, 2xl corner, whose panels take the xl corner and the card fill). `Button` and `Badge` take `material="etched"` — the primary button gains a white inset top edge, the quiet fills the light/dark edge, and an etched badge squares to the small corner with 8%/16% alpha soft status fills. `Input` and `Textarea` gain an `etched` variant that rings on focus. `Text.Kicker` is the ten-point, 0.2em-tracked uppercase mono label.

New tokens in `tokens.css`: `--text-kicker`, `--tracking-kicker`, `--shadow-etched`, `--shadow-etched-dark`, `--shadow-etched-primary`, `--shadow-focus` and `--shadow-focus-dark`, registered with `tailwind-merge`. `theme.css` is untouched.
