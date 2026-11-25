---
"@delacour/react-native-ui": minor
---

Fifteen more components read their spoken and visible strings from the `DelacourProvider` `labels` catalog and take a `labels` prop of their own: Popover, Post, Progress, ProgressButton, QRCode, Questionnaire, Rating, Screen, SearchBar, SectionProgress, SectionRail, Select, SelectionMode, Sketch and SlideButton. Every default is today's English, so nothing changes until an app passes labels. The per-string props these components already had (`accessibilityLabel`, `placeholder`, `cancelLabel`, `searchPlaceholder`, `emptyText`, `doneText`, `title`, `getErrorMessage`, `accessibilityActionLabel` and the rest) still win over `labels`. The pure resolvers take the labels as a defaulted trailing argument, so existing calls keep their English. Exported English constants (`SKETCH_LABELS`, `PROGRESS_BUTTON_DEFAULT_HINT`, `SELECTION_MODE_START_ACTION`, `formatSelectedCount` and the like) stay, deprecated, as aliases of the defaults.
