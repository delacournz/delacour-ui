---
"@delacour/react-native-ui": patch
---

When a parent changes `Calendar`'s controlled `month`, the new month appears without a slide. Before this fix, the last paging direction stayed set. For example, after the user tapped next, a date picker that reopened on an earlier month slid it in from the right.
