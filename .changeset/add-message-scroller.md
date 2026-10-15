---
"@delacour/react-native-ui": minor
"delacour": minor
---

Add `MessageScroller`, a conversation list anchored at the newest message

It follows new messages while the reader is at the end and leaves them alone once they have
scrolled up, with a floating "jump to latest" button carrying an unread count. Older history loads
when the reader reaches the top, guarded to one request per page, and lands without moving the
viewport. The list rises with the keyboard, draws day separators and an unread divider, and passes
each message's place in its sender's run to `renderMessage`. `useMessageScrollerState` drives the
same behaviour on another list, such as `Screen.ChatList`.
