# Changesets

This folder is the release queue. Every change that should reach npm adds a file here describing
which packages moved and by how much; CI turns the accumulated files into a version bump, a
changelog entry and a publish.

```bash
bun run changeset
```

Pick the packages, pick `patch` / `minor` / `major`, write the line that a consumer of the package
should read. Commit the generated markdown file with the change it describes.

Only four packages are releasable: `delacour` (the CLI), `@delacour/react-native-ui`,
`@delacour/react-native-charts` and `@delacour/react-native-bottom-sheet`. Everything else in the
workspace is private.

The four are one `fixed` group: a changeset naming any of them bumps all four to the same version,
so the CLI and the libraries always ship together.

Once merged into `develop`, a changeset publishes an `x.y.z-alpha.<datetime>` snapshot of all four
to npm under `alpha`, and stays pending. The same merge opens or updates the
`🔖 chore(release): vX.Y.Z` pull request against `develop`; merging that consumes every pending
changeset, fast-forwards `main`, tags `vX.Y.Z`, and the tag publishes all four on `latest`. See
[the root AGENTS.md](../AGENTS.md#releases) for the whole flow, diagrams included.
