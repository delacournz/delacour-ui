import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { type FullSearchTriggerProps, SearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { appName, gitConfig } from "./shared";

/**
 * The lockup is the mark beside "Delacour UI" set in the house heading face.
 * There is no wordmark: the mark's geometry is binding and the typeset name is
 * the lockup, on every layout this returns options for.
 */
export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="inline-flex items-center gap-2 whitespace-nowrap font-heading font-semibold tracking-display">
					<DelacourIcon size={20} />
					{appName}
				</span>
			),
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
				text: "Theme",
				url: "/theme",
				active: "nested-url",
			},
		],
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
	};
}

/**
 * The home layout's search, as the same icon button the theme toggle and the
 * GitHub link are.
 *
 * Fumadocs' home header renders its `full` trigger — a 240px "Search ⌘ K" bar
 * — from `lg` up, which is the one element in the floating pill that reads as a
 * form control rather than a nav. The `sm` trigger is already the magnifier
 * alone, so this slot hands the header that one at every width and drops the
 * `w-full max-w-[240px]` class the header passes for the bar. The notebook
 * layout keeps its own search bar: this is the home layout's option, not
 * `baseOptions()`.
 */
function HomeSearchTrigger({ className: _bar, color: _color, ...props }: FullSearchTriggerProps): ReactElement | null {
	return <SearchTrigger {...props} size="icon" />;
}

export function homeOptions(): BaseLayoutProps {
	return {
		...baseOptions(),
		slots: {
			searchTrigger: { sm: SearchTrigger, full: HomeSearchTrigger },
		},
	};
}
