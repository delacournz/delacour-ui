---
"delacour-react-native-ui": minor
"delacour": minor
---

One theme file, the same shape everywhere

`theme.css` is now the one file in `styles/` that is yours, and its header says so. What
`delacour init` ships, what the docs site's `/theme` page emits with no preset, and what
`delacour theme` writes are held to the same shape, declaration for declaration.

**`delacour theme` converts `theme.css` in place.** Paste a shadcn or tweakcn `globals.css` over
the file and run the command with no argument: a file already in Uniwind's shape is left alone, a
shadcn-shaped one is rewritten, and anything else is named. `delacour doctor` fails on a `theme.css`
still in shadcn's `:root` / `.dark` shape, which Uniwind reads as a utility class named `dark` and a
dark theme that never arrives.

**The converter fills what shadcn v4 stopped declaring.** `--destructive-foreground` — which
`Button`, `Badge`, `Switch`, `Slider` and `Checkbox` all paint with — and the shadow scale are now
derived when a source omits them, and the light `--elevated` derivation follows the card, as the
shipped file already did.

**The shipped defaults are shadcn's current ones.** The chart ramp is the neutral greys `shadcn
init` writes today, and the default typeface is each platform's own sans rather than Geist, which a
fresh app had never loaded. The `/theme` page shows `theme.css` first, with shadcn's `globals.css`
in a second tab for a web app sharing the theme.
