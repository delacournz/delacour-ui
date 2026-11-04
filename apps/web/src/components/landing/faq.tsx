import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { FAQ_COPY } from "@/components/landing/copy";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";
import { FAQ } from "@/lib/faq";

/**
 * The questions `FAQ` holds, as `<details>` — open and close with no script,
 * readable with scripting off, and the text a crawler sees is the text the
 * `FAQPage` JSON-LD in `homeHead()` claims. Hairline-ruled like the verdict
 * lists, in the house greyscale; the summary marker is the native one.
 */
export function Faq(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`} id="faq">
			<SectionHeading eyebrow={FAQ_COPY.eyebrow} title={FAQ_COPY.title} />
			<div className="mt-section-gap divide-y divide-fd-border border-fd-border border-y">
				{FAQ.map((entry) => (
					<details className="group py-4" key={entry.question}>
						<summary className="cursor-pointer list-inside font-medium text-sm marker:text-fd-muted-foreground">
							{entry.question}
						</summary>
						<p className="mt-3 max-w-reading text-fd-muted-foreground text-sm leading-relaxed">{entry.answer}</p>
					</details>
				))}
			</div>
			<p className="mt-6 text-fd-muted-foreground text-sm">
				<Link
					className="underline decoration-fd-border underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-foreground"
					to="/compare"
				>
					{FAQ_COPY.compare}
				</Link>
			</p>
		</Reveal>
	);
}
