# skills — The agent skill

One skill, `delacour-ui`, authored here and consumed twice: `delacour skills` writes it into a
project, and `apps/web` serves it at `/skills/delacour-ui/<file>`. A second copy of the prose in
either place is a copy that drifts, which is the whole reason this is a package rather than a
folder inside `packages/cli` — that package has no `exports` map for `apps/web` to import from.

```
src/
├── index.ts                  SKILLS, findSkill, COMPONENT_COUNT
├── delacour-ui/skill.ts      SKILL.md
├── delacour-ui/references.ts references/rules.md, references/troubleshooting.md
├── render-components.ts      the generator's one pure function
└── components.generated.ts   derived from registry/registry.json — do not edit
scripts/gen-components.ts     bun run gen-skill
```

## Markdown is a template-string module, not a `.md` file

`packages/cli` bundles to a single `dist/index.js` with tsdown, and a bundler moves TypeScript. An
asset-copy step would mean the CLI's `package.json` `files` array had to grow a second entry — and a
published tarball that silently lacked it fails at the one moment nobody is watching, a stranger's
first `bunx delacour skills`.

## The skill teaches commands, not a catalogue

`SKILL.md` names no component. It tells the agent to run `delacour list`, `view`, `add` and
`doctor`, and spends its own words on the rules those commands do not reveal.

That is not minimalism. A component list written into a file on someone's disk is stale the day the
next component ships, and the staleness is **silent** — the agent simply never offers the new
component, and nobody finds out. The same failure `apps/web/AGENTS.md` records for the landing
page's "Nineteen components".

Everything the file *does* assert is a failure that produces **no error message**: the CSS import
first, `DelacourProvider` at the root, `expo install` for native modules, the dev-client rebuild,
the project's own import path, and the component's `AGENTS.md` travelling with its source. If `tsc`,
Metro or a red box would have caught it, it does not belong in the skill.

`index.test.ts` holds both halves: the body must contain no backticked component name, and it must
name no command the CLI does not have. A skill that tells an agent to run a command that does not
exist is worse than no skill, because the agent reports the failure as the library's.

## `components.generated.ts` is excluded from Biome

`bun run gen-skill` writes it; `biome.jsonc` excludes it. Without the exclusion the pre-commit hook
reformats it, the next generation writes it straight back, and the CI drift check can never pass —
the same arrangement `registry/` and `apps/web`'s two generated modules have.

It exists for `skills --list` and the docs page's count, which both need the names with no network.
It is not what the skill reads.

## The frontmatter is the routing surface

`name` and `description`, and the description is long on purpose: it names concrete components and
concrete situations, because a one-line description is why a skill never triggers. The test asserts
a floor on its length. It is also the one place a component name is allowed to appear, which is why
the catalogue test strips the frontmatter before it looks.

## Changing the prose

Its source is `apps/web/content/docs/native/**`, which is sourced from the library. Nothing here is
invented — when one of those pages changes, `references.ts` changes with it. Reasoning belongs on
the page; this file carries the rule.
