import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { DeviceBezel } from "@/components/device-bezel";
import { InstallTabs } from "@/components/install";
import { HERO } from "@/components/landing/copy";
import { ARROW_LINK, PillLink } from "@/components/landing/pill";
import { ThemedPreview } from "@/components/preview";
import { isInstallable, NATIVE_APP } from "@/lib/native-app";
import { gitConfig } from "@/lib/shared";
import { type PreviewId, previews } from "@/previews/manifest";

const GITHUB_URL = `https://github.com/${gitConfig.user}/${gitConfig.repo}`;

/**
 * The hero device: a whole screen from the library, photographed on a
 * simulator — the honest version of the phone every component site draws.
 *
 * It is the one capture composed as a catalogue rather than as a screen with
 * something to say: a tab bar, a chart, a field, the selection controls, a
 * slider and a settings group, so the phone answers "what is in the box" in the
 * first second. The demo is `screen/showcase`, and it is sized to fit one
 * viewport exactly — see its own doc comment before adding to it.
 */
const HERO_DEVICE: PreviewId = "screen/showcase";

/**
 * The first viewport, as the direction contract has it: one reading column —
 * the mark, the headline, the lede, one amber pill and one ghost, the install
 * tabs as the single calm card — with the phone to its right only above the
 * `lg` breakpoint. There is no glow and no grid behind it; the dot field under
 * the whole page is the only material, and the phone is the only object.
 */
export function Hero(): ReactElement {
	const device = previews[HERO_DEVICE];

	return (
		<section className="mx-auto grid w-full max-w-page grid-cols-1 items-center gap-16 px-6 pt-section-sm pb-section lg:grid-cols-[minmax(0,var(--container-reading))_auto] lg:justify-center lg:gap-24 lg:pt-section">
			<div className="flex w-full min-w-0 max-w-reading flex-col items-start gap-8">
				<Link
					className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card/60 py-1 ps-1.5 pe-3 font-medium text-fd-muted-foreground text-xs transition-colors hover:text-fd-foreground"
					params={{ _splat: "native/releases" }}
					to="/docs/$"
				>
					<DelacourIcon size={18} />
					{HERO.badge}
					<span aria-hidden>→</span>
				</Link>

				<div className="flex flex-col gap-5">
					<h1 className="text-4xl leading-[1.1] tracking-[-0.025em] sm:text-5xl">{HERO.title}</h1>
					<p className="text-fd-muted-foreground text-lg">{HERO.lede}</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<PillLink params={{ _splat: "native/getting-started" }} to="/docs/$">
						{HERO.primary}
					</PillLink>
					<PillLink params={{ _splat: "native/components" }} to="/docs/$" variant="ghost">
						{HERO.secondary}
					</PillLink>
					<a className={`${ARROW_LINK} px-2`} href={GITHUB_URL} rel="noreferrer noopener" target="_blank">
						{HERO.github}
					</a>
				</div>

				<div className="w-full">
					<InstallTabs commands={[{ verb: "dlx", packages: [HERO.install] }]} />
				</div>

				<TryOnYourPhone />
			</div>

			<div className="hidden justify-center lg:flex">
				<DeviceBezel className="rotate-2 scale-95 transition-transform duration-500 ease-out hover:rotate-0 hover:scale-100 motion-reduce:rotate-0 motion-reduce:scale-100">
					<ThemedPreview className="block h-auto w-[300px] max-w-full" entry={device} />
				</DeviceBezel>
			</div>
		</section>
	);
}

/**
 * The playground app, on the reader's own phone.
 *
 * Reads the same constant the QR popover and the fallback page read, so the
 * landing page can never advertise a build the rest of the site does not. A
 * placeholder link is a labelled "coming soon" rather than a dead button or a
 * silence — the reader learns the app exists.
 */
function TryOnYourPhone(): ReactElement {
	const installable = isInstallable(NATIVE_APP.IOS_TESTFLIGHT_URL);

	return (
		<p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-fd-muted-foreground text-sm">
			<span>{HERO.phone.lead}</span>
			{installable ? (
				<a
					className="inline-flex items-center gap-1 font-medium text-fd-foreground underline decoration-fd-primary/60 underline-offset-4 transition-colors hover:decoration-fd-primary"
					href={NATIVE_APP.IOS_TESTFLIGHT_URL}
					rel="noreferrer noopener"
					target="_blank"
				>
					{HERO.phone.link}
					<span aria-hidden>→</span>
				</a>
			) : (
				<span className="inline-flex items-center gap-2">
					<span aria-hidden className="size-1.5 rounded-full bg-fd-primary" />
					{HERO.phone.soon}
				</span>
			)}
		</p>
	);
}
