import { Children, isValidElement, type ReactElement, type ReactNode, useEffect, useMemo } from "react";
import { PixelRatio, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useThemeColor } from "../../hooks/use-theme-color";
import { type QRCodeContextValue, QRCodeProvider } from "./qr-code.context";
import { planQrCode, QR_LOGO_DEFAULT_FRACTION } from "./qr-code.logo";
import { buildQrPath, resolveRenderScale } from "./qr-code.path";
import type { QRCodeProps } from "./qr-code.types";
import {
	QR_DEFAULT_COLORS,
	QR_UNAVAILABLE_LABEL,
	qrCodeVariants,
	resolveEffectiveEcc,
	resolveQrLabel,
	resolveQrSize,
	resolveQrWarnings,
	resolveQuietZone,
} from "./qr-code.variants";
import { warnQrOnce } from "./qr-code.warn";
import { QR_CODE_LOGO_DISPLAY_NAME, QRCodeLogo } from "./qr-code-logo";

const slots = qrCodeVariants();

/**
 * The `QRCode.Logo` among the children, if any. Matched by identity or by
 * `displayName`, because the dev bundle can wrap a component type and break
 * identity. The logo must be a direct child.
 */
function findLogo(children: ReactNode): ReactElement | null {
	for (const child of Children.toArray(children)) {
		if (!isValidElement(child) || typeof child.type === "string") continue;
		const { displayName } = child.type as { displayName?: string };
		if (child.type === QRCodeLogo || displayName === QR_CODE_LOGO_DISPLAY_NAME) return child;
	}
	return null;
}

function QRCodeRoot({
	value,
	errorCorrection,
	moduleStyle = "square",
	size,
	quietZone,
	mask,
	minVersion,
	color,
	backgroundColor,
	logoSize = QR_LOGO_DEFAULT_FRACTION,
	accessibilityLabel,
	isDecorative = false,
	onEncodeError,
	className,
	testID,
	children,
}: QRCodeProps): ReactElement {
	const logo = findLogo(children);
	const hasLogo = logo !== null;
	const level = resolveEffectiveEcc(errorCorrection ?? "M", hasLogo);

	const plan = useMemo(
		() => planQrCode(value, { errorCorrection: level, minVersion, mask }, hasLogo ? logoSize : null),
		[value, level, minVersion, mask, hasLogo, logoSize]
	);
	const { result } = plan;

	const tileDp = resolveQrSize(size);
	const zone = resolveQuietZone(quietZone);
	const fill = useThemeColor(color ?? QR_DEFAULT_COLORS.color);
	const tile = useThemeColor(backgroundColor ?? QR_DEFAULT_COLORS.backgroundColor);

	const drawing = useMemo(() => {
		if (!result.ok) return null;
		const units = result.matrix.size + 2 * zone;
		const { moduleDp, offset } = resolveRenderScale(tileDp, units, PixelRatio.get());
		const region = plan.logo === "placed" ? plan.region : undefined;
		return {
			units,
			moduleDp,
			offset,
			d: buildQrPath(result.matrix, moduleStyle, zone, region),
			logoFrame: region
				? { offset: offset + (zone + region.start) * moduleDp, side: region.side * moduleDp, inset: moduleDp }
				: null,
		};
	}, [result, plan, zone, tileDp, moduleStyle]);

	useEffect(() => {
		if (!result.ok) onEncodeError?.(result.error);
	}, [result, onEncodeError]);

	const warnings = resolveQrWarnings({
		requestedEcc: errorCorrection,
		hasLogo,
		logoDropped: plan.logo === "dropped",
		quietZone: zone,
		color: fill,
		backgroundColor: tile,
		value,
		accessibilityLabel,
		isDecorative,
	});
	for (const warning of warnings) warnQrOnce(warning);

	const context = useMemo<QRCodeContextValue>(
		() => ({ logoFrame: drawing?.logoFrame ?? null, backgroundColor: tile }),
		[drawing, tile]
	);
	const label = result.ok ? resolveQrLabel(value, accessibilityLabel) : QR_UNAVAILABLE_LABEL;
	const side = drawing ? drawing.units * drawing.moduleDp : 0;

	return (
		<QRCodeProvider value={context}>
			<View
				accessibilityElementsHidden={isDecorative}
				accessibilityLabel={isDecorative ? undefined : label}
				accessibilityRole={isDecorative ? undefined : "image"}
				accessible={!isDecorative}
				className={slots.tile({ className })}
				importantForAccessibility={isDecorative ? "no-hide-descendants" : "yes"}
				style={{ width: tileDp, height: tileDp, backgroundColor: tile }}
				testID={testID}
			>
				{drawing ? (
					<Svg
						height={side}
						style={{ position: "absolute", left: drawing.offset, top: drawing.offset }}
						viewBox={`0 0 ${drawing.units} ${drawing.units}`}
						width={side}
					>
						<Path d={drawing.d} fill={fill} />
					</Svg>
				) : null}
				{logo}
			</View>
		</QRCodeProvider>
	);
}

/**
 * A string a camera can read, drawn as one vector path, optionally with a logo
 * in the middle.
 *
 * The tile is dark-on-light in both themes on purpose: an inverted code fails a
 * large share of scanners. A logo raises the level to H and may grow the
 * version so the covered codewords stay recoverable.
 *
 * @example
 * ```tsx
 * <QRCode value="https://delacour.co.nz" accessibilityLabel="Open the docs" />
 * ```
 *
 * @example
 * ```tsx
 * <QRCode value={url} moduleStyle="rounded" accessibilityLabel="Join the table">
 *   <QRCode.Logo>
 *     <Icon icon={IconStar} />
 *   </QRCode.Logo>
 * </QRCode>
 * ```
 */
export const QRCode = Object.assign(QRCodeRoot, {
	/** A centred mark on a tile-coloured plate. Raises the level to H. */
	Logo: QRCodeLogo,
	displayName: "DelacourUI.QRCode",
});
