import type { ReactElement } from "react";
import { DemoGallery } from "@/components/demo-gallery";
import { otpInputDemos } from "@/demos/otp-input";

export default function OtpInputGallery(): ReactElement {
	return <DemoGallery demos={otpInputDemos} title="OtpInput" />;
}
