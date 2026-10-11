import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import {
	FullSearchTrigger,
	type FullSearchTriggerProps,
	SearchTrigger,
} from "fumadocs-ui/layouts/shared/slots/search-trigger";
import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { cn } from "./cn";
import { appName, gitConfig } from "./shared";

/**
 * The home header's links. Charts and Bottom Sheet are namespaces of the docs,
 * so the docs header carries them and the marketing pages reach them from the
 * landing page's footer: five links, a counter, search, the theme switch and
 * GitHub was more than one bar could say at once.
 */
const HOME_LINKS: ReadonlySet<string> = new Set(["/docs/native/getting-started", "/docs/native/components", "/theme"]);

/**
 * The lockup is the mark beside "Delacour UI" set in tracked mono capitals,
 * and nothing else. There is no wordmark: the mark's geometry is binding and
 * the typeset name is the lockup, on every layout this returns options for.
 */
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="inline-flex items-center gap-2.5 whitespace-nowrap font-medium text-xs uppercase tracking-wordmark">
					<DelacourIcon size={20} />
					{appName}
				</span>
			),
		},
		slots: {
			searchTrigger: { sm: SearchTrigger, full: HeaderSearch },
		},
		links: [
			{
				type: "main",
				text: "Docs",
				url: "/docs/native/getting-started",
				active: "nested-url",
			},
			{
				type: "main",
				text: "Components",
				url: "/docs/native/components",
				active: "nested-url",
			},
			{
				type: "main",
				text: "Charts",
				url: "/docs/charts",
				active: "nested-url",
			},
			{
				type: "main",
				text: "Bottom Sheet",
				url: "/docs/bottom-sheet",
				active: "nested-url",
			},
			{
				type: "main",
				text: "Theme",
				url: "/theme",
				active: "nested-url",
			},
		],
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
	};
}

/**
 * The ⌘K pill every header carries: Fumadocs' own full trigger, which already
 * lists the hot keys as `kbd` chips, held to a h-8 control; the header passes the width and `app.css` draws the rest.
 * `app.css` draws the control itself from the `data-search-full` hook.
 */
function HeaderSearch({ className, ...props }: FullSearchTriggerProps): ReactElement | null {
	return <FullSearchTrigger {...props} className={cn(className, "ps-2.5")} />;
}

/**
 * The home layout's options. The header is the same frosted h-14 bar the docs
 * draw, so it takes the same search pill and the same lockup — and only the
 * `HOME_LINKS` of the docs header's five.
 */
export function homeOptions(): BaseLayoutProps {
	const options = baseOptions();
	return {
		...options,
		links: options.links?.filter((link) => "url" in link && link.url !== undefined && HOME_LINKS.has(link.url)),
	};
}
