# QA flows — Bottom sheet

Fragments, one per acceptance check from the BottomSheet rewrite plan. Each one runs against the
chrome-free preview route named in its `executionPrerequisite`, opened with the deep link the
capture script uses:

```
dlc-ui-playground://preview?component=<component>&demo=<facet>/<demo>&theme=dark
```

Run one with the app restarted so argent's devtools bridge is live (`restart-app`, then the deep
link), from the repo root:

```bash
argent flow run qa/bottom-sheet/<name> --device <UDID> --json
```

Screenshots in these flows are human evidence for the geometry checks — footer on the keyboard's
top edge, rounded corners, the card mid-drag — that no selector can assert. The structural checks
around them are the executable verdict.
