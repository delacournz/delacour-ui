---
"@delacour/react-native-ui": minor
---

Add `Swipe`, a row that slides aside to reveal actions behind it. `Swipe.Start` and `Swipe.End` hold `Swipe.Action` tiles; a drag far past them fires the outermost (`isFullSwipe`, on by default), `Swipe.Group` keeps one row open at a time, and a ref opens or closes the row from code. Every action is also published as an accessibility action on the row.
