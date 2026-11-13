---
"@delacour/react-native-ui": minor
---

Add a cross-platform screen-reader announcer. The pure helper is `lib/announce` and the React Native binding is `hooks/use-announce`: `announce()`, `useAnnounce()` and `useAnnouncement()`. iOS speaks through an announcement. Android uses a live region or an announcement, never both. The web uses a live region. Messages are throttled and coalesced per key, and every caller can opt out.

Components now use it, and each takes an `announce` opt-out:

- **Alert** is now heard on iOS. It speaks once on appear, re-open or change.
- **Field.Error** is now heard on iOS.
- **Toast** and **Support** are no longer spoken twice on Android, and **Support.Status** is now heard on iOS.
- **Countdown** speaks at milestones and says "Time is up" on both platforms, instead of reading every second on Android.
- **Textarea** announces its character count only at thresholds.
- **NumberInput** speaks the value after a stepper press.
- **ProgressButton**, **SlideButton** and **Splitter** announce their results.
- **Feedback** announces the result of a send.
- **StackCard** announces the next card and moves focus to it.
- **Post.Votes** speaks a vote change.
- **Skeleton** says when its content has loaded.
- **Screen.Loading** and **Screen.Error** speak when they appear.
- **Spinner** is named "Loading" by default. Inside a loading **Button** the spinner adds nothing to the button's name, because the button already reads as busy.
