---
"@delacour/native-ui": minor
---

Add `Button.Group`, which joins several controls into one segmented run — with
`Button.Group.Separator` for a rule between two members and `Button.Group.Text`
for a chunk that says something rather than doing something. An `Input` joins the
same way.

```tsx
<Button.Group variant="outline">
  <Button onPress={archive}>Archive</Button>
  <Button onPress={report}>Report</Button>
  <Button onPress={snooze}>Snooze</Button>
</Button.Group>

<Button.Group>
  <Button onPress={save}>Save</Button>
  <Button.Group.Separator />
  <Button accessibilityLabel="More" size="icon-md" onPress={openMenu}>
    <Icon icon={IconChevronDownSmall} />
  </Button>
</Button.Group>
```

Each member squares the pair of corners crossing a seam and overlaps its
neighbour by a point, so two adjacent borders draw as one hairline. React Native
has no sibling selector, so a member's place is computed in JavaScript and
published through context rather than matched with CSS — which also means a
control this package has never heard of can join a run by reading
`useButtonGroupItem()`.

The group owns its members' axes: their step outright, since controls of
different heights do not join, and `variant`, `isDisabled` and `feedback` as
defaults a member may override. A member keeps its own *shape*, so a square
button still works inside a run — an `icon-md` member of an `sm` group comes out
`icon-sm`.

Nothing existing changes behaviour: a button outside a group draws exactly the
corner it drew before.

- New exports: `BUTTON_GROUP_ORIENTATIONS`, `BUTTON_GROUP_POSITIONS`,
  `BUTTON_GROUP_SEPARATOR_ORIENTATION`, `BUTTON_FEEDBACK`,
  `BUTTON_GROUP_FEEDBACK`, `useButtonGroup`, `useButtonGroupContext`,
  `useButtonGroupItem`, `useButtonGroupItemContext`, `ButtonGroupProvider`,
  `ButtonGroupItemProvider`, and the pure resolvers `resolveGroupPositions`,
  `resolveGroupSeams`, `resolveButtonFeedback`, `resolveGroupedButtonSize` and
  `resolveButtonSizeStep`.
