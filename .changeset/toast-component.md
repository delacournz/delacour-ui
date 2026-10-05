---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Toast` — a brief message shown with `toast()` from anywhere, including outside React, and drawn by one `<ToastViewport />` mounted inside `OverlayProvider`. Toasts stack at the top or bottom edge, three drawn with the newest in front and the rest queued; they sit above the home indicator and the keyboard, pause their clock while touched or backgrounded, and swipe away toward their edge or sideways. Statuses, glyphs and title colours are `Alert`'s; `toast.promise` turns one loading toast into the success or the failure in place; `render` composes a custom card from `<Toast>`'s parts. Each toast is announced as it appears and stays at least ten seconds under a screen reader. Alert's status glyphs move to the `alert-glyphs.ts` leaf so the two share them. `delacour add toast` copies it.
