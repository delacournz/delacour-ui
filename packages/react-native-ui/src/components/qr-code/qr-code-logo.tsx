import type { ReactElement } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { useQRCodePart } from "./qr-code.context";
import type { QRCodeLogoProps } from "./qr-code.types";
import { qrCodeVariants } from "./qr-code.variants";

export const QR_CODE_LOGO_DISPLAY_NAME = "DelacourUI.QRCode.Logo";

const slots = qrCodeVariants();

/**
 * The centred mark, on a plate of the tile's colour one module wider than the
 * mark on every side. Hidden from assistive tech — the root's label names the
 * code. Renders nothing when the logo did not fit and was dropped.
 */
export function QRCodeLogo({ className, children }: QRCodeLogoProps): ReactElement | null {
	const { logoFrame, backgroundColor } = useQRCodePart("QRCode.Logo");
	if (!logoFrame) return null;

	return (
		<View
			accessibilityElementsHidden
			className={slots.logo()}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
			style={{
				left: logoFrame.offset,
				top: logoFrame.offset,
				width: logoFrame.side,
				height: logoFrame.side,
				padding: logoFrame.inset,
				backgroundColor,
			}}
		>
			<View className={cn(slots.logoContent(), className)}>{children}</View>
		</View>
	);
}
QRCodeLogo.displayName = "DelacourUI.QRCode.Logo";
