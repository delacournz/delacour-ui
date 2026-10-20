import { Icon } from "@delacour/react-native-ui/icon";
import { IconStar } from "@delacour/react-native-ui/icons/central";
import { QRCode } from "@delacour/react-native-ui/qr-code";
import { Switch } from "@delacour/react-native-ui/switch";
import { Text } from "@delacour/react-native-ui/text";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "With a logo",
	align: "center",
	caption:
		"`QRCode.Logo` sits on a plate cleared out of the middle. A logo is damage the code has to correct, so the level is raised to H and the code may grow a version to keep every block recoverable — switch it on and the whole code re-encodes, denser.",
	capture: { flow: true },
};

/** The switch adds and removes the Logo, so the re-encode at level H is visible as it happens. */
export function Demo(): ReactElement {
	const [hasLogo, setHasLogo] = useState(true);

	return (
		<View className="items-center gap-4">
			<QRCode
				accessibilityLabel="Open the Delacour docs"
				logoSize={0.24}
				moduleStyle="rounded"
				size="md"
				testID="qr-code-logo"
				value="https://ui.delacour.co.nz/docs/native/components/qr-code"
			>
				{hasLogo ? (
					<QRCode.Logo>
						<Icon color="#000000" icon={IconStar} size={28} />
					</QRCode.Logo>
				) : null}
			</QRCode>
			<View className="flex-row items-center gap-3">
				<Text.Label>Logo</Text.Label>
				<Switch isSelected={hasLogo} onSelectedChange={setHasLogo} testID="qr-code-logo-switch" />
			</View>
		</View>
	);
}
