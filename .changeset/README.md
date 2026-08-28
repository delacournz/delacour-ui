# Changesets

This folder is the release queue. Every change that should reach npm adds a file here describing
which packages moved and by how much; CI turns the accumulated files into a version bump, a
changelog entry and a publish.

```bash
bun run changeset
```

Pick the packages, pick `patch` / `minor` / `major`, write the line that a consumer of the package
should read. Commit the generated markdown file with the change it describes.

Only two packages are releasable: `delacour` (the CLI) and `@delacour/native-ui`. Everything else
in the workspace is private.

See [the root AGENTS.md](../AGENTS.md#releases) for what happens after the changeset is merged.
