import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { markdownEditorDemos } from "@/demos/markdown-editor";

export default function MarkdownEditorGallery(): ReactElement {
	return <DemoGallery demos={markdownEditorDemos} title="MarkdownEditor" />;
}
