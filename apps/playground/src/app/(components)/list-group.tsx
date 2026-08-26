import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { listGroupDemos } from "@/demos/list-group";

export default function ListGroupGallery(): ReactElement {
	return <DemoGallery demos={listGroupDemos} title="ListGroup" />;
}
