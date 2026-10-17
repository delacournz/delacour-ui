---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `ThemeSelector`, a System, Light or Dark choice read from the live Uniwind theme and applied to
it. System is selected while the app follows the device, so a theme changed anywhere else
re-selects it. `segmented` joins the options into one attached run; `cards` stands them apart as
tiles. `applyTheme={false}` with `value` turns it into a presentation layer so the app can persist
the preference itself — there is no storage dependency — and `restoreThemeMode` validates a stored
string before it reaches `Uniwind.setTheme`. `useThemeSelection` reads and sets the mode with no
selector mounted. `delacour add theme-selector` copies it, with `toggle-button`, `icon` and `field`
as registry dependencies.
