import type { ReactElement } from "react";
import { cn } from "@/lib/cn";
import { isInstallable, NATIVE_APP } from "@/lib/native-app";

const BUTTON = "flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium";

type InstallButtonsProps = {
	className?: string;
};

/**
 * Where to get the app.
 *
 * Rendered both inside the QR popover and on the fallback page, so the two can
 * never advertise different builds. A platform with no link yet renders a
 * placeholder rather than disappearing: the layout stays put, and a reader on
 * Android learns the app exists and is not for them yet, instead of wondering
 * whether the page is broken.
 *
 * That placeholder is plain text in a `<span>`, with no `role` and no
 * `aria-disabled`. There is nothing to interact with and nothing to focus, so
 * announcing a disabled link would describe a control that does not exist —
 * the sentence is the whole content.
 */
export function InstallButtons({ className }: InstallButtonsProps): ReactElement {
	return (
		<div className={cn("flex w-full flex-col items-stretch gap-2", className)}>
			{isInstallable(NATIVE_APP.IOS_TESTFLIGHT_URL) ? (
				<a
					className={cn(BUTTON, "bg-fd-primary text-fd-primary-foreground transition-opacity hover:opacity-90")}
					href={NATIVE_APP.IOS_TESTFLIGHT_URL}
					rel="noreferrer noopener"
					target="_blank"
				>
					Join the iOS beta
				</a>
			) : (
				<ComingSoon label="iOS · Coming soon" />
			)}
			{isInstallable(NATIVE_APP.ANDROID_INSTALL_URL) ? (
				<a
					className={cn(BUTTON, "border border-fd-border transition-colors hover:bg-fd-accent")}
					href={NATIVE_APP.ANDROID_INSTALL_URL}
					rel="noreferrer noopener"
					target="_blank"
				>
					Get the Android build
				</a>
			) : (
				<ComingSoon label="Android · Coming soon" />
			)}
		</div>
	);
}

function ComingSoon({ label }: { label: string }): ReactElement {
	return <span className={cn(BUTTON, "border border-fd-border text-fd-muted-foreground opacity-60")}>{label}</span>;
}
