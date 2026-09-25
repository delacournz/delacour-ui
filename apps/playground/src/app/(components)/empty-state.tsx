import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { emptyStateDemos } from "@/demos/empty-state";

export default function EmptyStateGallery(): ReactElement {
	return <DemoGallery demos={emptyStateDemos} title="EmptyState" />;
}
