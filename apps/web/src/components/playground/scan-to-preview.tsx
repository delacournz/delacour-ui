import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "fumadocs-ui/components/ui/popover";
import { QrCode, Smartphone } from "lucide-react";
import type { ReactElement } from "react";
import QRCode from "react-qr-code";
import { cn } from "@/lib/cn";
import { NATIVE_APP, playgroundUrl, schemeUrl } from "@/lib/native-app";
import { InstallButtons } from "./install-buttons";

/**
 * The QR stays dark-on-white in both themes.
 *
 * An inverted code — light modules on a dark ground — is legible to most modern
 * scanners and to some older ones not at all, and a code nobody can scan is the
 * one failure this component has to avoid. A white card in dark mode is a small
 * price.
 */
const QR_LIGHT = "#ffffff";
const QR_DARK = "#0a0a0a";

type ScanToPreviewProps = {
	/** The component slug — the URL segment, and the app's route name. */
	slug: string;
	className?: string;
};

/**
 * "Scan to preview": open this component on a phone, running rather than
 * photographed.
 *
 * Desktop and mobile are separated in CSS, not in JavaScript. Rendering both
 * and hiding one keeps the whole thing server-rendered with no user-agent
 * sniff, no `useEffect`, and no hydration branch — which matters because the
 * two halves encode *different URLs*:
 *
 * - The QR carries the HTTPS universal link, which iOS and Android intercept.
 * - The tap card carries the custom scheme, because Safari treats a link to the
 *   domain it is already on as an in-page navigation and never hands it over.
 *
 * The link is built from `siteUrl`, not the live origin, so the code is
 * identical under SSR and hydration — and a code scanned off a `localhost` page
 * still points somewhere the phone can actually reach.
 */
export function ScanToPreview({ className, slug }: ScanToPreviewProps): ReactElement {
	return (
		<Popover>
			<PopoverTrigger
				className={cn(
					buttonVariants({
						color: "secondary",
						size: "sm",
						className: "gap-2 [&_svg]:size-3.5 [&_svg]:text-fd-muted-foreground",
					}),
					className
				)}
			>
				<QrCode className="hidden sm:block" />
				<Smartphone className="sm:hidden" />
				<span className="hidden sm:inline">Scan to preview</span>
				<span className="sm:hidden">Open in app</span>
			</PopoverTrigger>
			<PopoverContent align="end" className="flex w-[248px] flex-col items-center gap-3 p-4">
				<div className="hidden size-[168px] shrink-0 items-center justify-center rounded-lg bg-white p-2 sm:flex">
					<QRCode
						bgColor={QR_LIGHT}
						fgColor={QR_DARK}
						level="M"
						size={152}
						title={`Open ${slug} in ${NATIVE_APP.NAME}`}
						value={playgroundUrl(slug)}
					/>
				</div>
				<a
					className="flex w-full flex-col items-center gap-1 rounded-lg border border-fd-border border-dashed px-3 py-4 text-center no-underline sm:hidden"
					href={schemeUrl(slug)}
				>
					<span className="font-medium text-fd-foreground text-sm">Open in {NATIVE_APP.NAME}</span>
					<span className="text-fd-muted-foreground text-xs">Tap to launch the app</span>
				</a>
				<p className="text-center text-fd-muted-foreground text-xs">
					Opens this component in the {NATIVE_APP.NAME} app, live on your device.
				</p>
				<InstallButtons />
			</PopoverContent>
		</Popover>
	);
}
