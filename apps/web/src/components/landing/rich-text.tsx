import type { ReactElement, ReactNode } from "react";

/**
 * The two marks `copy.ts` writes inline — `` `code` `` and `[text](url)` —
 * rendered as `<code>` and an external `<a>`.
 *
 * Not a Markdown parser. Two marks are what the landing copy uses, and a real
 * parser here would be a second one beside Fumadocs' for eleven sentences.
 */
const MARK = /(`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }: { text: string }): ReactElement {
	const nodes: ReactNode[] = text.split(MARK).map((part, index) => {
		if (part.startsWith("`") && part.endsWith("`")) {
			return (
				<code className="font-mono text-[0.9em] text-fd-foreground" key={`${index}-${part}`}>
					{part.slice(1, -1)}
				</code>
			);
		}

		const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
		if (link) {
			// Only a web page gets a new tab. A `mailto:` given `_blank` opens an
			// empty tab beside the mail client in some browsers.
			const external = /^https?:\/\//.test(link[2] as string);

			return (
				<a
					className="text-fd-foreground underline decoration-fd-primary/60 underline-offset-4 transition-colors hover:decoration-fd-primary"
					href={link[2]}
					key={`${index}-${part}`}
					rel={external ? "noreferrer noopener" : undefined}
					target={external ? "_blank" : undefined}
				>
					{link[1]}
				</a>
			);
		}

		return part;
	});

	return <>{nodes}</>;
}

/** The plain text a `RichText` string renders to, for a test or an `aria-label`. */
export function plainText(text: string): string {
	return text.replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
