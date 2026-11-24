---
"@delacour/react-native-ui": patch
---

Combobox and ContextMenu no longer hide their inner controls silently. The Combobox trigger stays one screen-reader stop and offers its clear button and each chip's remove as named actions (`clear`, `remove:<value>`), hiding the drawn duplicates. While the placeholder shows, the trigger's name includes it ("Country, Choose a country", `labels.combobox.triggerInField`), and the trigger reports busy while loading. The create row is named by its visible text, so `labels.combobox.createAccessibility` is deprecated and no longer read. `ContextMenu.Trigger` warns in development when its held content composes a control a screen reader cannot reach.
