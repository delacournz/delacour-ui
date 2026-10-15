---
"@delacour/react-native-ui": minor
"delacour": patch
---

Add `Attachment` — a file, image, video or recording with a thumbnail, size, upload state and remove

`AttachmentMedia` is discriminated by `kind`, so an image without a `source` is a type error. Three
layouts — `chip` for a composer, `tile` for a photo tray, `card` for inside a message — at three
sizes. Upload stays the app's: `status` is `idle`, `uploading` (determinate or looping), `error`
with the app's message, or `done`, and `onRemove` / `onRetry` compose their controls in beside the
press target so a remove tap never opens the attachment. A screen reader meets one element with a
composed label, progress in ten-point steps and remove / retry as actions. `Attachment.Group` is a
horizontal tray that fades attachments in and out and slides the rest along, stilled under calm
motion. `delacour add attachment` installs it.
