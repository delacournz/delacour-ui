import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { postDemos } from "@/demos/post";

export default function PostGallery(): ReactElement {
	return <DemoGallery demos={postDemos} title="Post" />;
}
