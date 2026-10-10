# QA flows — Bottom sheet

Fragments, one per acceptance check from the BottomSheet rewrite plan. Each one runs against the
chrome-free preview route named in its `executionPrerequisite`, opened with the deep link the
capture script uses:

```
dlc-ui-playground://preview?component=<component>&demo=<facet>/<demo>&theme=dark
```

Run one against the running app — open the deep link and go, from the repo root. A restart is only
needed when argent's devtools bridge is not live (`argent run native-devtools-status` reports
anything but `connected`); then `restart-app` once, and the deep link:

```bash
argent flow run qa/bottom-sheet/<name> --device <UDID> --json
```

Screenshots in these flows are human evidence for the geometry checks — footer on the keyboard's
top edge, rounded corners, the card mid-drag — that no selector can assert. The structural checks
around them are the executable verdict.
