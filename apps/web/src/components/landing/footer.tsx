import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { FOOTER_COPY } from "@/components/landing/copy";
import { gitConfig } from "@/lib/shared";

const GITHUB_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

export function Footer(): ReactElement {
	return (
		<footer className="border-fd-border border-t">
			<div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-4 px-6 py-10 text-fd-muted-foreground text-sm">
				<span className="inline-flex items-center gap-2">
					<DelacourIcon size={16} />
					{FOOTER_COPY.line}
				</span>
				<div className="flex gap-5">
					<a
						className="underline decoration-fd-border underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-primary"
						href={GITHUB_URL}
						rel="noreferrer noopener"
					>
						{FOOTER_COPY.github}
					</a>
					<a
						className="underline decoration-fd-border underline-offset-4 transition-colors hover:text-fd-foreground hover:decoration-fd-primary"
						href="/llms.txt"
						rel="noreferrer noopener"
					>
						{FOOTER_COPY.llms}
					</a>
				</div>
			</div>
		</footer>
	);
}
