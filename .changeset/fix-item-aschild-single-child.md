---
"@delacour/react-native-ui": patch
---

Fix `Item` and `ListGroup.Item` throwing with `asChild` and one child. Their text wrapping always returned an array, and `Pressable`'s `asChild` path calls `Children.only`, which rejects an array of one — so `<Item asChild onPress={…}><View /></Item>` threw. A single child now passes through as itself.
