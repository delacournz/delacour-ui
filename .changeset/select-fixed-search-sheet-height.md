---
"@delacour/react-native-ui": patch
---

A searchable `Select` opens its sheet at its cap and holds that height while it is open, instead of sizing it to the filtered rows — typing no longer resizes the sheet, and the keyboard covers its bottom rather than moving its top. A `Select` without search still sizes to its rows. `resolveSelectListMinHeight` is the new pure resolver behind it.
