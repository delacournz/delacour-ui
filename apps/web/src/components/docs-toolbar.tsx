import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { MarkdownCopyButton, ViewOptionsPopover } from "fumadocs-ui/layouts/notebook/page";
import { CodeXml } from "lucide-react";
import type { ReactElement } from "react";
import { componentSourceUrl } from "@/components/install";
import { ScanToPreview } from "@/components/playground/scan-to-preview";
import { componentSlugForDocsPath } from "@/lib/components";
import { gitConfig } from "@/lib/shared";

/**
 * The row under a docs page's description: copy as Markdown, open elsewhere,
 * and — on a component page — open the component's source and scan to preview.
 * One hairline below it, on the house border, and the rhythm token's gap above
 * the body.
 *
 * **Open** reaches the page's own `.mdx` on GitHub; **Open Source** reaches the
 * component's folder in the library, which is what a reader reading a component
 * page usually wanted from the first.
 *
 * It closes the gap `DocsDescription`'s bottom margin opens, so the row sits
 * where the title block ends rather than floating below it.
 */
export function DocsToolbar({
	path,
	markdownUrl,
	slug,
}: {
	path: string;
	markdownUrl: string;
	slug: string | null;
}): ReactElement {
	const component = componentSlugForDocsPath(path);
	const sourceUrl = component ? componentSourceUrl(component) : null;

	return (
		<div className="-mt-4 flex flex-row items-center gap-2 border-fd-border border-b pb-6">
			<MarkdownCopyButton markdownUrl={markdownUrl} />
			<ViewOptionsPopover
				githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/web/content/docs/${path}`}
				markdownUrl={markdownUrl}
			/>
			{sourceUrl ? (
				<a
					className={buttonVariants({
						color: "secondary",
						size: "sm",
						className: "gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground",
					})}
					href={sourceUrl}
					rel="noreferrer noopener"
					target="_blank"
				>
					<CodeXml />
					Open Source
				</a>
			) : null}
			{slug ? <ScanToPreview className="ms-auto" slug={slug} /> : null}
		</div>
	);
}
