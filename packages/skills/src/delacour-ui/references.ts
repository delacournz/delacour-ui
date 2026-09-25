/**
 * The two reference files that travel beside `SKILL.md`.
 *
 * Split out because an agent loads `SKILL.md` on every turn and these only when
 * it is actually writing or debugging a screen — the same reason the docs site
 * keeps reasoning in a component's own `AGENTS.md` rather than on its page.
 *
 * Everything here is sourced from `apps/web/content/docs/native/**`, which is
 * itself sourced from the library. Nothing is invented; when one of those pages
 * changes, this is the file that has to change with it.
 */

export const RULES_MD = `# Delacour UI — the rules a compiler will not tell you

Companion to \`SKILL.md\`. Read this before writing a component of your own, overriding a size, or
reaching for a Tailwind feature that does not exist here.

## Colour tokens

Semantic names only. Never a hex, never a \`dark:\` prefix — swapping the variable *is* the theme,
so a \`dark:\` class is a second theme that will disagree with the first.

The set is shadcn's, name for name and meaning for meaning: \`background\` / \`foreground\`,
\`card\`, \`popover\`, \`primary\`, \`secondary\`, \`muted\`, \`accent\`, \`destructive\`, \`border\`, \`input\`,
\`ring\`, each with a \`-foreground\` partner. Paint content on a surface with that surface's
\`-foreground\`, never with \`foreground\`.

These are the library's additions, which a theme brought across from the web will not declare — each
is **derived** from one the theme does declare, so it follows the palette rather than staying on a
default:

| Token | What it is |
| --- | --- |
| \`elevated\` | a surface that must sit *above* \`muted\` in both themes — \`Tabs\`' selected capsule is what it exists for |
| \`tertiary\` | a fill quieter than \`secondary\` |
| \`success\`, \`warning\`, \`info\` | states shadcn names no counterpart for |
| \`destructive-soft\`, \`success-soft\`, \`warning-soft\`, \`info-soft\` | each state as a tint rather than a fill |
| \`overlay\` | the scrim behind a sheet — literal black in both themes, only the alpha differs |

Declaring a token in one theme and not the other does not degrade: Uniwind refuses to build, with
*"All themes must have the same variables"*.

## Sizes

One scale, named for what it sizes. \`--spacing-button-*\` and \`--spacing-input-*\` name the same
36/44/52 so a field and the button beside it can be retuned independently and still sit level.

| Utility | Sizes |
| --- | --- |
| \`h-button-md\`, \`text-button-md\`, \`rounded-button-md\` | a button's height, label and corner |
| \`h-input-md\`, \`text-input-md\` | a field's height and value |
| \`size-icon-md\` | any glyph — \`Icon\`, \`Spinner\`, a row's chevron |
| \`h-navbar-row\`, \`px-screen-gutter\` | the navbar row, and the gutter \`Screen\` shares |

\`Icon\` and \`Spinner\` share one scale — \`xs\` to \`2xl\`, 14/16/18/20/24/32pt — which is what makes a
button's loading swap cost no layout: both are drawn at the button's own \`size-icon-*\`.

Every generic \`rounded-*\` step is a multiple of one \`--radius\`, so a \`--radius\` copied out of a web
app retunes every corner at once. \`rounded-button-*\` is deliberately outside that scale: it is half
each button height, so a button is a capsule and a square one a circle whatever \`--radius\` is set.

**Override with \`size-*\`, not \`w-*\` plus \`h-*\`.** tailwind-merge conflicts \`size\` into \`w\`/\`h\`
but not the reverse, so a trailing \`w-6\` will not clear a leading \`size-5\`.

## Composition

A root publishes its axes — \`variant\`, \`size\`, \`isDisabled\` — through context, so a part never
takes them as props:

\`\`\`tsx
<Button variant="destructive" size="lg">
  <Icon icon={IconTrash} />
  <Button.Label>Delete</Button.Label>
</Button>
\`\`\`

- **Every compound root exports a \`useX()\` hook** — \`useButton()\`, \`useField()\` — so a custom child
  matches the parent with no prop drilling.
- **A context reports the prop verbatim.** \`useButton()\` on \`<Button size="icon-lg">\` returns
  \`"icon-lg"\`, not \`"lg"\`. Match the family or the suffix, never a bare step.
- **Icons and text inherit** inside a root that can publish one treatment for its whole subtree
  (\`Button\`, \`Badge\`). A root whose parts carry two treatments (\`ListGroup\` row, \`Screen.Error\`)
  keeps per-part classes — one provider cannot serve both.
- **String children are wrapped** in the component's own label part, and consecutive strings
  collapse into one so a \`gap\` does not space them apart.
- **Precedence differs between components on purpose.** \`Input.Group\` is \`group → own → field\`,
  because it owns the one box. \`Checkbox.Group\` is \`own → group → field → default\`, because it owns
  no box. Both are \`??\` chains, never \`||\`, so \`isDisabled={false}\` opts a child out of a disabled
  group.

Writing a part of your own: read the context hook, merge the caller's \`className\` through \`cn()\`,
and give it a \`displayName\`.

## Merging classes

Two mergers, and both need the semantic size tokens.

\`\`\`tsx
import { cn } from "@/lib/cn";   // a caller's className
import { tv } from "@/lib/tv";   // slots and variants
\`\`\`

- **A caller's \`className\` must go through \`cn()\`** or it will not beat the component's own classes.
  Uniwind does not deduplicate conflicting utilities on its own.
- **\`tv\` comes from \`@/lib/tv\`, never from \`tailwind-variants\`.** A bare \`tv\` does not know what
  \`button-md\` is: it files \`text-button-md\` under tailwind-merge's text *colour* group and silently
  strips the label's colour.
- **A variant may not name a line height.** tailwind-merge lists \`leading\` among \`font-size\`'s
  conflicting groups, so a \`text-lg\` from a size axis silently deletes a \`leading-6\` beside a
  \`text-base\`. Every step already carries a paired leading; prose needing its own gets a pair.

## Four Tailwind features that do not exist here

Each applies the class, moves nothing, and reports nothing.

1. **\`group-*\`, \`peer-*\` and \`:has()\`.** Uniwind reads \`data-*\` off a single flat selector and
   matches it against props on the component carrying the class. No class on a parent can reach a
   child — which is why \`<Field isInvalid>\` reddens its \`Input\` through a React context. There is
   no selector-based path; do not go looking for one.
2. **Safe-area utilities.** \`pt-safe\` compiles to \`env(safe-area-inset-top)\`, which is nothing on
   React Native, so a navbar draws over the status bar with no error anywhere. Use
   \`useSafeAreaInsets()\`.
3. **A runtime template class.** Tailwind's scanner is static, so \`\\\`size-[\\\${n}px]\\\`\` has nothing in
   Uniwind's store to look up and draws nothing. Named sizes are classes; a number stays a prop or
   an inline \`style\`.
4. **A \`.dark { … }\` block in \`theme.css\`.** Uniwind registers it as a utility class named \`dark\`
   that contributes nothing. Themes live under \`@variant light\` / \`@variant dark\`;
   \`delacour theme\` is what converts a web file into that shape.

## Reading a token in JavaScript

\`useThemeColor("primary")\` reads the **raw** \`--primary\`, which is the only one of the two names
that survives to runtime — the \`@theme inline\` block substitutes \`--color-primary\` into each
utility rather than emitting a variable. The same is true of the radius scale: \`--radius\` exists at
runtime, \`--radius-md\` does not, so anything computing a corner applies the multiplier itself.
`;

export const TROUBLESHOOTING_MD = `# Delacour UI — symptom to cause

Run \`bunx delacour@latest doctor\` first. Every symptom below is configuration, produces no error of
its own, and \`doctor\` names the file and the fix for nine of them. Changing component code before
running it is how an afternoon goes.

| Symptom | Almost always |
| --- | --- |
| Components render, but unstyled | Nothing imports the CSS entry, or the import is not the **first** statement of the root layout |
| Styled in dev, unstyled in a release build | Tailwind's \`@source\` globs do not cover where the components landed — the scanner does not follow a monorepo's symlink, so the glob must be a real path |
| Some classes work, others do nothing | \`withUniwindConfig\` is present but not the **outermost** Metro wrapper; an outer wrapper replaced the transformer |
| Light works, dark never arrives | \`theme.css\` has a literal \`.dark { … }\` block. Run \`bunx delacour@latest theme\` to convert it |
| Classes resolve oddly, or the build fails naming no library | NativeWind is installed. It compiles \`className\` and wraps Metro too, and two Tailwind transforms cannot share one Metro config — move across with [Uniwind's migration guide](https://docs.uniwind.dev/migration-from-nativewind) |
| Presses do nothing | No \`GestureHandlerRootView\` above the component — mount \`DelacourProvider\` at the root |
| \`Unable to resolve "@/components/ui/button"\` | \`experiments.tsconfigPaths\` is not \`true\` in the Expo config; Metro ignores tsconfig paths without it |
| A red box naming a module you just installed | A native module needs a rebuilt dev client. \`npx expo run:ios\` — a JS reload will not pick it up |
| Every \`className\` is a type error | \`uniwind-env.d.ts\` is not inside the app's own \`tsconfig\` include. It is one triple-slash reference and only works from there |
| \`Ref<never>\`, or two copies of React Native's types | Two realpaths for one package. A Bun workspace needs \`linker = "hoisted"\` in \`bunfig.toml\` |
| \`add\` overwrote something you had edited | A file that differs is a conflict and \`add\` asks; \`--overwrite\` answers yes. \`bunx delacour@latest diff <name>\` shows what upstream changed |
| A component on the docs site is not in the registry | The published CLI reads the registry at the commit it shipped against. \`--ref main\` opts into what has landed since |

## What \`doctor\` checks

Metro's Uniwind wrapper and its position · the Tailwind \`@source\` coverage · whether anything
actually imports the CSS entry · New Architecture · path aliases and \`tsconfigPaths\` ·
\`GestureHandlerRootView\` at the root · the shape of \`theme.css\` · the Uniwind type shim · duplicate
copies of a native module.

\`\`\`bash
bunx delacour@latest doctor          # a report, with a fix per failure
bunx delacour@latest doctor --json   # the same, for a tool to read
bunx delacour@latest info            # the resolved config, and what was detected
\`\`\`

## When none of it fits

The full page is <https://ui.delacour.co.nz/docs/native/cli/troubleshooting> — fetch it as Markdown
by appending \`.md\`. The component's own reasoning is in
\`components/ui/<name>/AGENTS.md\`, copied in beside its source.
`;
