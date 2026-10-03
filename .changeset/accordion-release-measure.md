---
"@delacour/react-native-ui": patch
"delacour": patch
---

Fix `Accordion` and `Collapsible` panels that never opened on their first expand in Release builds

The item's effect decided "has the panel measured?" by reading the measured height's shared value
on the JS thread, straight after the panel's `onLayout` had written it. That write is queued onto
the UI runtime and the read does not drain the queue, so a Release build read the unmeasured
sentinel every time, bailed, and nothing re-ran it — the trigger said expanded and the panel stayed
shut. Debug builds were slow enough to hide it. "Measured" is now React state, the decision is a
pure `accordionTravelTarget` / `collapsibleTravelTarget`, and a test sweeps both components for any
JS-thread read of the height.
