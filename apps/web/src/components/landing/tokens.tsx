import { Link } from "@tanstack/react-router";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import type { ReactElement } from "react";
import { NATIVE_THEME, NATIVE_USAGE, TOKENS_COPY, WEB_THEME } from "@/components/landing/copy";
import { ARROW_LINK } from "@/components/landing/pill";
import { Reveal } from "@/components/landing/reveal";
import { RichText } from "@/components/landing/rich-text";
import { SectionHeading } from "@/components/landing/section-heading";

/**
 * The pitch that is specific to this library: the palette is shadcn's, name
 * for name, so a web team's theme is a copy away from being the mobile theme
 * too.
 *
 * Read top to bottom in the column: the web file, the one command, the native
 * file, then the code that paints from it and the three points that explain
 * why nothing was translated. The samples are hand-written illustrations of
 * `delacour theme`'s input and output, not its real output — a handful of
 * tokens each, on purpose.
 */
export function Tokens(): ReactElement {
	return (
		<Reveal className="mx-auto w-full max-w-reading px-6 py-section">
			<SectionHeading eyebrow={TOKENS_COPY.eyebrow} title={TOKENS_COPY.title}>
				<RichText text={TOKENS_COPY.body} />
			</SectionHeading>

			<div className="mt-section-gap flex flex-col gap-3">
				<DynamicCodeBlock code={WEB_THEME} lang="css" />
				<div className="flex items-center justify-center gap-3 py-1">
					<span aria-hidden className="text-fd-primary">
						↓
					</span>
					<code className="rounded-control border border-fd-border bg-fd-card px-2.5 py-1.5 font-mono text-xs">
						{TOKENS_COPY.command}
					</code>
					<span aria-hidden className="text-fd-primary">
						↓
					</span>
				</div>
				<DynamicCodeBlock code={NATIVE_THEME} lang="css" />
			</div>

			<div className="mt-10 flex flex-col gap-6">
				<DynamicCodeBlock code={NATIVE_USAGE} lang="tsx" />
				<ul className="flex flex-col divide-y divide-fd-border">
					{TOKENS_COPY.points.map((point) => (
						<li className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0" key={point.title}>
							<p className="font-medium">{point.title}</p>
							<p className="text-fd-muted-foreground text-sm">
								<RichText text={point.body} />
							</p>
						</li>
					))}
				</ul>
				<Link className={ARROW_LINK} params={{ _splat: "native/getting-started/theming" }} to="/docs/$">
					{TOKENS_COPY.link}
				</Link>
			</div>
		</Reveal>
	);
}
