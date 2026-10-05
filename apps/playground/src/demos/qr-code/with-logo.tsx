import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import { QRCode } from "@delacour/react-native-ui/qr-code";
import type { ReactElement } from "react";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With a logo",
	align: "center",
	caption:
		"`QRCode.Logo` sits on a plate cleared out of the middle. A logo is damage the code has to correct, so the level is raised to H and the code may grow a version to keep every block recoverable.",
	capture: {},
};

export function Demo(): ReactElement {
	return (
		<QRCode
			accessibilityLabel="Open the Delacour docs"
			logoSize={0.24}
			moduleStyle="rounded"
			size="lg"
			testID="qr-code-logo"
			value="https://ui.delacour.co.nz/docs/native/components/qr-code"
		>
			<QRCode.Logo>
				<Icon color="#000000" icon={IconStar} size={32} />
			</QRCode.Logo>
		</QRCode>
	);
}
