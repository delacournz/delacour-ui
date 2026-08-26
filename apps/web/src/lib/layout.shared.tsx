import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="inline-flex items-center gap-2 font-semibold">
					<span
						aria-hidden
						className="size-5 rounded-md bg-fd-primary text-fd-primary-foreground grid place-items-center text-[10px] font-bold"
					>
						D
					</span>
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
		],
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
	};
}
