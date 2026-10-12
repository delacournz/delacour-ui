---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `Input.Group.Button`, `Input.Group.Separator` and `Input.Group.Block`, decorative decorators, and `Textarea` inside a group

- `Input.Group.Prefix` / `.Suffix` take `isDecorative`, which hides them from screen readers and lets
  touches through to the field. It defaults to true when every child is bare text or an `Icon`.
- `Input.Group.Button` is a `Button` sized one step below the box (square when icon-only), disabled
  with the group without fading twice, and warns in development when icon-only with no label.
- `Input.Group.Separator` draws a hairline whose direction comes from where it is written: vertical
  in the row, horizontal between a block and the row.
- `Input.Group.Block` adds a full-width section above (`position="start"`) or below (`"end"`) the
  field inside the same border and focus ring. The group always renders an inner row, so adding a
  block never remounts the field.
- `Textarea` reads the group's context and drops its own box, so a message composer is one box.
