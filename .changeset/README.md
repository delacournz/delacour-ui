# Changesets

This folder is the release queue. Every change that should reach npm adds a file here describing
which packages moved and by how much; CI turns the accumulated files into a version bump, a
changelog entry and a publish.

```bash
bun run changeset
```

Pick the packages, pick `patch` / `minor` / `major`, write the line that a consumer of the package
should read. Commit the generated markdown file with the change it describes.

Only three packages are releasable: `delacour` (the CLI), `@delacour/react-native-ui` and
`@delacour/react-native-charts`. Everything else in the workspace is private.

Once merged into `develop`, a changeset publishes an `x.y.z-alpha.<datetime>` snapshot of every
package it names to npm under `alpha`, and stays pending. `gh workflow run release.yml --ref develop`
consumes every pending changeset into a stable release on `latest` and fast-forwards `main`. See
[the root AGENTS.md](../AGENTS.md#releases) for the whole flow, diagrams included.
