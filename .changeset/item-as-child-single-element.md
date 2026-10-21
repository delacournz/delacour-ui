---
"@delacour/react-native-ui": patch
---

Item, ListGroup.Item and GridItem: `asChild` takes a single child element as written. The text wrap (and GridItem's background ordering) always rebuilt the children as an array, which `Pressable`'s `Children.only` rejects even with one element, so `<Item asChild onPress={…}><View /></Item>` threw. Under `asChild` the children now pass through untouched, and without it a lone element comes back as that same element. The wrap is one shared helper, `lib/wrap-text-children`.
