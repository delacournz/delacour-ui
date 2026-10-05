import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { signatureDemos } from "@/demos/signature";

export default function SignatureGallery(): ReactElement {
	return <DemoGallery demos={signatureDemos} title="Signature" />;
}
