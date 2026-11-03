---
"@delacour/react-native-ui": patch
---

`Sortable.Item` ignores a Move up / Move down accessibility action on a row that cannot be dragged — a disabled, list-disabled or pinned row. Those rows advertise no actions, but one sent anyway used to reorder them.
