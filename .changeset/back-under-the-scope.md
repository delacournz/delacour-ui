---
"@delacour/native-ui": minor
"@delacour/charts": minor
"delacour": patch
---

Publish the libraries under the `@delacour` org

`delacour-react-native-ui` is now `@delacour/native-ui`, and `delacour-react-native-charts` is now
`@delacour/charts`. The old names are deprecated and take no further versions. Nothing about the
components changed — swap the package and the import prefix:

```bash
bun remove delacour-react-native-ui delacour-react-native-charts
bun add @delacour/native-ui@alpha @delacour/charts@alpha
```

```diff
- import { Button } from "delacour-react-native-ui/button";
+ import { Button } from "@delacour/native-ui/button";
```

and in `global.css`, `@import '@delacour/native-ui/styles';`.

The CLI keeps its name. `delacour add chart` now installs `@delacour/charts`.
