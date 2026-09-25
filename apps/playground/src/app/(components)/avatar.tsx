import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { avatarDemos } from "@/demos/avatar";

export default function AvatarGallery(): ReactElement {
	return <DemoGallery demos={avatarDemos} title="Avatar" />;
}
