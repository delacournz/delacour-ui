import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { qrCodeDemos } from "@/demos/qr-code";

export default function QRCodeGallery(): ReactElement {
	return <DemoGallery demos={qrCodeDemos} title="QRCode" />;
}
