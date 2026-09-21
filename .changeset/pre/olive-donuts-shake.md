---
"@delacour/react-native-ui": minor
"@delacour/react-native-charts": minor
---

Name both libraries for what they are

`@delacour/react-native-ui` and `@delacour/react-native-charts` — the names they published under
before the scope, with the `delacour-` prefix traded for `@delacour/` rather than dropped. Every
subpath keeps its spelling (`@delacour/react-native-ui/button`, `@delacour/react-native-charts/core`),
so only the package half of an import changes.

The pair now matches: the charts package was briefly `@delacour/charts`, which did not say React
Native and did not sit beside its sibling. Neither intermediate spelling reached npm.

The CLI stays `delacour`, unscoped, because it is the thing people type:
`bunx delacour@alpha add button`.

`@types/react` is pinned in the workspace catalog as part of this: four packages declared three
different ranges, so two copies were always installed and only hoisting order decided which reached
the root. The rename changed that order, split `Ref` types across two copies and collapsed every
`ComponentRef<typeof Animated.View>` to `never`.
