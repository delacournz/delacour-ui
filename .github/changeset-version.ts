/**
 * `changeset version` bumps every package.json and writes the changelogs, but it
 * does not touch `bun.lock` — and a lockfile that disagrees with the manifests
 * fails `bun install --frozen-lockfile`, which is the first thing every CI job
 * runs. The Version Packages PR would land red.
 *
 * So bump, then regenerate the lockfile alone. `--lockfile-only` writes it
 * without installing, which is all the commit needs.
 *
 * Run by `changesets/action` in `.github/workflows/release.yml`.
 */
import { $ } from "bun";

await $`bunx changeset version`;
await $`bun install --lockfile-only`;
