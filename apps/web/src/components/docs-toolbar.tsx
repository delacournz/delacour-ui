import { MarkdownCopyButton, ViewOptionsPopover } from "fumadocs-ui/layouts/notebook/page";
import type { ReactElement } from "react";
import { ScanToPreview } from "@/components/playground/scan-to-preview";
import { gitConfig } from "@/lib/shared";

/**
 * The row under a docs page's description: copy as Markdown, open elsewhere,
 * and — on a component page — scan to preview. One hairline below it, on the
 * house border, and the rhythm token's gap above the body.
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
	return (
		<div className="-mt-4 flex flex-row items-center gap-2 border-fd-border border-b pb-6">
			<MarkdownCopyButton markdownUrl={markdownUrl} />
			<ViewOptionsPopover
				githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/apps/web/content/docs/${path}`}
				markdownUrl={markdownUrl}
			/>
			{slug ? <ScanToPreview className="ms-auto" slug={slug} /> : null}
		</div>
	);
}
