---
"@delacour/react-native-ui": patch
---

Select: a long list mounts only the rows near the sheet's viewport. The sheet's list ran on React Native's virtualisation defaults (10 rows first, 10 more every 50ms, a window of 21 viewports), so a searchable Select with ~250 options mounted nearly every row while the sheet was still opening, and the open stuttered. The first paint and each later batch are now one sheet of rows at the sheet's cap, and the window is 5 viewports. Nothing changes visually.
