import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { DelacourIcon } from "@/components/delacour-icon";
import { appName, gitConfig } from "./shared";

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: (
				<span className="inline-flex items-center gap-2 font-semibold">
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
		],
		githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
	};
}
