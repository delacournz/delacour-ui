---
"@delacour/react-native-ui": minor
---

Toast: `useToastOffset` (and `setToastOffset` outside React) lifts each toast stack clear of app chrome — a tab bar, a bottom toolbar, a custom header — and follows it live on the UI thread. Pass a number to animate to or a Reanimated shared value you drive; the newest registration wins per edge, `null` slides back to 0, and the keyboard and chrome never add up. `ToastViewport` takes an `offsetStore` prop.
