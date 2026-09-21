---
"@delacour/react-native-ui": minor
"@delacour/react-native-charts": minor
"delacour": patch
---

Publish the libraries under the `@delacour` org

`delacour-react-native-ui` is now `@delacour/react-native-ui`, and `delacour-react-native-charts` is now
`@delacour/react-native-charts`. The old names are deprecated and take no further versions. (Both were briefly spelled
`@delacour/native-ui` and `@delacour/charts` in this repository; neither reached npm, so the line
above is the whole story for anyone installing.) Nothing about the
components changed — swap the package and the import prefix:

```bash
bun remove delacour-react-native-ui delacour-react-native-charts
bun add @delacour/react-native-ui@alpha @delacour/react-native-charts@alpha
```

```diff
- import { Button } from "delacour-react-native-ui/button";
+ import { Button } from "@delacour/react-native-ui/button";
```

and in `global.css`, `@import '@delacour/react-native-ui/styles';`.

The CLI keeps its name. `delacour add chart` now installs `@delacour/react-native-charts`.
