/**
 * The skill body — what an agent reads before it writes a screen.
 *
 * It is deliberately **procedural, not a catalogue**. A component list written
 * into a file on someone's disk is stale the day the next component ships, and
 * the failure is silent: the agent simply never offers the component. So this
 * teaches the agent to ask the registry — `list`, `view`, `add` — and spends
 * its own words on the handful of rules no command reveals.
 *
 * Every rule here is a failure that produces **no error message**. That is the
 * bar: if `tsc`, Metro or a red box would have caught it, it does not belong.
 */
export const SKILL_MD = `---
name: delacour-ui
description: >-
  Build React Native and Expo user interfaces with Delacour UI — Button, Input, Field, Switch,
  Slider, Checkbox, Radio, Tabs, Accordion, BottomSheet, ListGroup, Screen, Chart and the rest.
  Use when adding, styling, theming or debugging UI in an Expo app, when the project has a
  native-components.json or a components/ui directory, or when asked for a screen, form, sheet,
  chart or component on iOS or Android. Covers installing components with the delacour CLI,
  Uniwind/Tailwind classNames, the token palette, and the silent failures that make a component
  render unstyled or stop responding to touch.
---

# Delacour UI

A React Native component library for Expo apps. The CLI copies each component's \`.tsx\` **into the
project**, so the code is the user's to read and edit — not a package to configure around.

Styling is [Uniwind](https://docs.uniwind.dev) (Tailwind v4 for React Native), so components take
\`className\`. Motion is Reanimated and Gesture Handler. Icons are Central Icons.

\`add\` sets Uniwind up on a project that has none — it installs \`uniwind\` and \`tailwindcss\`, wraps
Metro and writes the Tailwind entry — so there is no separate setup step. **Check for NativeWind
first**: it compiles \`className\` and wraps Metro too, two Tailwind transforms cannot share one
Metro config, and the owner has to choose which to keep before anything here will build.

## Never write one of these from memory

A hand-written \`Button\` looks right and is subtly wrong: it misses the icon that inherits its size
from the button's context, the spinner that *replaces* the icon so the label does not shift, and
the \`expo install\` route for the native modules underneath.

Copy the real one instead. The CLI resolves the whole dependency closure, rewrites every import
onto this project's own aliases, and reports what it needs from npm.

## The four commands

Run them with the project's package manager — \`bunx\`, \`npx\`, \`pnpm dlx\` or \`yarn dlx\`.

| You need | Run |
| --- | --- |
| what exists, and what each one is for | \`bunx delacour@alpha list\` |
| one component's files, props, closure and packages | \`bunx delacour@alpha view <name>\` |
| to add one | \`bunx delacour@alpha add <name>\` |
| to find out why something renders wrong with no error | \`bunx delacour@alpha doctor\` |

**Always \`list\` before writing any React Native UI in this project.** A component that exists here
should be added, never reimplemented.

\`add\` sets the project up on its first run — it writes \`native-components.json\`, wraps Metro with
Uniwind's transform, points Tailwind at where the components landed, and copies the theme and the
root provider in. There is no separate setup step to run first.

\`\`\`bash
bunx delacour@alpha add button input field
\`\`\`

It prints what the components need from npm and **installs nothing** unless told to. Add
\`--install\` when the user has asked for a working app; leave it off and hand them the commands when
they have not.

If the layout is not the default — a monorepo where the components belong to a shared package, or a
source directory this project does not call \`src\` — run \`init\` deliberately instead:

\`\`\`bash
bunx delacour@alpha init --src app --package-name @acme/ui --package-path packages/ui
\`\`\`

## Six things that fail silently

Each of these produces **no error, no warning, and no red box**. They are the whole reason this
skill exists; everything else a compiler will tell you.

1. **The CSS import is the first statement of the root layout.** Not the second, and not in
   \`index.js\` where the root component is registered. Without it every component renders unstyled.
   \`\`\`tsx
   import "@/styles/global.css";   // ← first
   \`\`\`
2. **\`DelacourProvider\` wraps the app, once, at the root.** It is the gesture root every press needs
   above it. Leave it out and presses stop landing — the component still renders, and nothing says
   why.
3. **Native modules go through \`expo install\`, never \`bun add\` / \`npm install\`.** The package
   manager fetches the newest release, which on the project's SDK fails at the linker rather than at
   install. \`add\` already spells each command correctly — run what it prints, verbatim.
4. **After a new native module, the dev client must be rebuilt.** \`npx expo run:ios\` or
   \`run:android\`. A JS reload alone red-boxes on a turbo module that is not in the binary, and the
   error names the module rather than the component that pulled it in.
5. **Import from the project's own path, not from the package.** \`@/components/ui/button\` — or the
   relative path the CLI wrote, when the project has no aliases. There is no package barrel:
   \`import { Button } from "delacour-react-native-ui"\` does not resolve and never will.
6. **\`AGENTS.md\` travels with the source.** \`add\` writes one beside every component it copies.
   Read \`components/ui/<name>/AGENTS.md\` before editing that component — it is where the reasoning
   for each edge case lives, and an edit made without it renders and is wrong.

When a component renders unstyled, does not respond to touch, or loses its classes in a release
build, run \`doctor\` before changing any code. Those are configuration, and it names the file and
the fix.

## Writing a screen

\`\`\`tsx
import "@/styles/global.css";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DelacourProvider } from "@/components/ui/provider";
import { useState } from "react";
import { View } from "react-native";

export default function App() {
  const [email, setEmail] = useState("");

  return (
    <DelacourProvider>
      <View className="flex-1 justify-center gap-4 bg-background p-6">
        <Field>
          <Field.Label>Email</Field.Label>
          <Input onChangeText={setEmail} placeholder="you@example.com" value={email} />
        </Field>
        <Button onPress={() => {}}>Continue</Button>
      </View>
    </DelacourProvider>
  );
}
\`\`\`

Four conventions to hold to:

- **Colours are semantic tokens, never literals.** \`bg-background\`, \`text-muted-foreground\`,
  \`border-border\`, \`bg-primary\`. Never a hex, and never a \`dark:\` prefix — swapping the variable
  *is* the theme, so a \`dark:\` class is a second theme that will disagree with the first.
- **Sizes are one scale.** \`sm\`, \`md\`, \`lg\` on a root, which publishes through context to its
  parts. Do not set a child's size to override its parent's; set the parent's.
- **Compound parts, not prop bags.** \`Field.Label\`, \`Button.Label\`,
  \`Accordion.Item\` / \`.Trigger\` / \`.Content\`. Reach for \`view <name>\` when unsure which parts a
  component publishes — guessing a part name is a runtime throw, not a type error.
- **A string child of \`Button\` is wrapped in \`Button.Label\` automatically.** Write the text.

## Theming

The palette is one file, \`styles/theme.css\`, in Uniwind's \`@variant light\` / \`@variant dark\`
shape. Two ways to change it, and neither is editing a component:

- build one at <https://ui.delacour.co.nz/theme> and paste the \`theme.css\` tab over the file;
- bring a web app's across — \`bunx delacour@alpha theme ./globals.css\` converts it in place.

A literal \`.dark { … }\` block is the trap. Uniwind registers it as a **utility class named \`dark\`**
that contributes nothing — no error, and a dark theme that never arrives. That is what \`theme\`
converts, and what \`doctor\` fails on.

## Going deeper

| For | Fetch |
| --- | --- |
| every page on the docs site, as one index | <https://ui.delacour.co.nz/llms.txt> |
| one page as Markdown | any docs URL with \`.md\` appended |
| the component reference | <https://ui.delacour.co.nz/docs/native/components> |
| composition, sizing, tokens, styling | \`references/rules.md\` beside this file |
| something rendering wrong | \`references/troubleshooting.md\` beside this file |

There is also an MCP server — \`bunx delacour@alpha mcp\` — which exposes \`list_components\`,
\`get_component\`, \`add_components\`, \`init_project\` and \`check_project\` as tools. Prefer it when the
host supports MCP; the commands above are the same functions and need nothing installed.
`;
