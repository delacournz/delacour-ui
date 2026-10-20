---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `SearchBar`, the query field at the top of a list, on `Input.Group` with no chrome of its own. A clear button that keeps focus and the keyboard, a Cancel action shown never, on focus or always that empties the text and dismisses the keyboard, `debounce` with `onDebouncedChange` (flushed by the search key, immediate on clear), `isLoading` swapping clear for a spinner, and `tokens` drawn as removable chips with Backspace removing the last. `pill` and `rounded` shapes over `Input`'s variants and sizes, and it joins an enclosing `Field`. `delacour add search-bar` copies it.
