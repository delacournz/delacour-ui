---
"@delacour/react-native-ui": minor
"delacour": minor
---

The default theme clears WCAG 2.2 AA. `theme.css` darkens `--muted-foreground`, `--input` and `--ring` so captions read at 4.5:1 and a control's edge and the focus ring at 3:1; light `--success` and `--info` move to emerald-700 and blue-600 under white ink; dark `--info` moves to blue-400, and dark `--destructive-foreground` and `--info-foreground` carry dark ink; `--warning-soft-foreground` leans further toward the text. `delacour theme` fills the same values into a converted shadcn file. Switch's off state, ScrollText's un-revealed text and Tree's selected row no longer rely on contrast or colour they did not have. `/theme` lists every token pair a built theme leaves below AA.
