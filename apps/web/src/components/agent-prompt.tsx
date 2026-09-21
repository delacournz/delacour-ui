import { Check, Copy } from "lucide-react";
import { type ReactElement, useState } from "react";
import { siteUrl } from "@/lib/shared";

/**
 * A prompt the reader hands to their own coding agent, with one click.
 *
 * The manual path through a setup is the one people abandon. An agent can walk
 * it — but only if it is told where the truth is, because left to its own
 * memory it invents package versions and a component API that looks right.
 *
 * So the text below never describes the library. It points at `delacour add`,
 * `delacour doctor` and this site's own Markdown, and it spends its words on
 * the three things an agent gets wrong unprompted: reusing an existing gesture
 * root rather than nesting a second one, routing native modules through
 * `expo install`, and putting the CSS import first.
 *
 * It lives here as a plain string, not in MDX, so `agent-prompt.test.ts` can
 * pin it — a prompt that names a command the CLI does not have fails in the
 * reader's terminal, under the library's name.
 */
export const SETUP_PROMPT = `Set up Delacour UI in this React Native / Expo project.

Use the delacour CLI as the source of truth for what exists and what it needs. Do not write any
component from memory, and do not guess a package version.

First, look at the project:
1. Detect the package manager (bun / npm / pnpm / yarn) from the lockfile, and whether this is a
   bare React Native app or Expo. Find the app's root — the package that depends on \`expo\`.
2. Read package.json. Note whether Uniwind and Tailwind are already installed. If NativeWind is
   there, STOP and tell me — it compiles className and wraps Metro too, and two Tailwind transforms
   cannot share one Metro config.
3. Find the app entry (App.tsx, app/_layout.tsx, index.tsx) and check whether a
   GestureHandlerRootView already wraps the app. If one is there, reuse it — do not nest a second.

Then install:
- Run \`bunx delacour@alpha add button --install\` (spelled for this project's package manager).
  That writes native-components.json, wraps Metro with Uniwind's transform, points Tailwind at the
  components, copies the theme and the root provider in, and adds Button. There is no separate
  setup step.
- Run whatever install commands it prints, verbatim, from the app root. Native modules go through
  \`expo install\`, never the package manager — the newest release fails at the linker.

Then make the two edits it cannot make for me, because both are in files I own:
- Import the CSS entry as the FIRST statement of the root layout. Without it every component
  renders unstyled and nothing logs an error.
- Wrap the app in <DelacourProvider> from the copied provider. Without it presses stop landing,
  just as silently.

Finally:
- Run \`bunx delacour@alpha doctor\` and fix anything it names.
- Run \`bunx delacour@alpha list\` to see what else is available, and add components by name rather
  than writing them.
- Component reference: ${siteUrl}/llms.txt, or any docs page with .md appended.

When you are done, tell me what changed and how to run the app on iOS and Android.`;

/**
 * Copy is the whole interaction, so the button is the component. No textarea:
 * a reader who wants to read it can, and a reader who wants to paste it should
 * not have to select forty lines first.
 */
export function AgentPrompt({ prompt = SETUP_PROMPT }: { prompt?: string }): ReactElement {
	const [copied, setCopied] = useState(false);

	/**
	 * `writeText` rejects on a page without focus, and `navigator.clipboard` is
	 * undefined on any origin the browser does not consider secure. Unhandled,
	 * either is a console error nobody sees behind a button that silently does
	 * nothing — so a failure leaves the label alone and the text on screen, which
	 * is selectable.
	 */
	const copy = async () => {
		try {
			await navigator.clipboard?.writeText(prompt);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="my-6 overflow-hidden rounded-card border border-fd-border bg-fd-card">
			<div className="flex items-center justify-between gap-4 border-fd-border border-b px-4 py-2.5">
				<p className="m-0 font-medium text-fd-muted-foreground text-sm">Paste this into your coding agent</p>
				<button
					className="inline-flex shrink-0 items-center gap-1.5 rounded-control border border-fd-border px-2.5 py-1 font-medium text-fd-muted-foreground text-xs transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
					onClick={() => {
						void copy();
					}}
					type="button"
				>
					{copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
					{copied ? "Copied" : "Copy prompt"}
				</button>
			</div>
			<pre className="m-0 max-h-80 overflow-y-auto whitespace-pre-wrap break-words bg-transparent p-4 text-fd-muted-foreground text-xs leading-relaxed">
				{prompt}
			</pre>
		</div>
	);
}
