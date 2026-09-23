import { Link } from "@tanstack/react-router";
import { type ReactElement, useEffect, useState } from "react";
import { PILL_GHOST, PILL_PRIMARY } from "@/components/landing/pill";
import { ANALYTICS } from "@/lib/analytics/config";
import { CONSENT_OPEN_EVENT, type Consent, readConsent, writeConsent } from "@/lib/analytics/consent";
import { cn } from "@/lib/cn";
import { privacyRoute } from "@/lib/shared";

/**
 * Asks once whether Google Analytics and PostHog may set their cookies.
 *
 * It renders nothing on the server and nothing until mounted, because the
 * answer lives in `localStorage` and a server-rendered banner would flash at
 * every visitor who has already chosen. It renders nothing at all on a build
 * with neither provider, since there is then nothing to consent to.
 *
 * The two buttons are equal weight, and Decline is not hidden behind a
 * settings page: consent that is easier to give than to refuse is not consent
 * under the GDPR. The footer's "Cookie settings" fires `CONSENT_OPEN_EVENT` to
 * bring it back.
 */
export function ConsentBanner(): ReactElement | null {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (ANALYTICS.ga.kind === "off" && ANALYTICS.posthog.kind === "off") return;
		if (readConsent() === null) setOpen(true);

		const reopen = () => setOpen(true);
		window.addEventListener(CONSENT_OPEN_EVENT, reopen);
		return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
	}, []);

	if (!open) return null;

	const choose = (consent: Consent) => {
		writeConsent(consent);
		setOpen(false);
	};

	return (
		<section
			aria-label="Cookie consent"
			className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-col gap-4 rounded-card border border-fd-border bg-fd-card p-5 shadow-lg sm:flex-row sm:items-center"
		>
			<p className="m-0 flex-1 text-fd-muted-foreground text-sm">
				Can Google Analytics and PostHog set cookies to show us how the docs are used? Visits are counted without
				cookies either way.{" "}
				<Link className="underline underline-offset-4 hover:text-fd-foreground" hash="the-website" to={privacyRoute}>
					Privacy
				</Link>
			</p>
			<div className="flex shrink-0 gap-2">
				<button className={cn(PILL_GHOST, "h-9 flex-1")} onClick={() => choose("denied")} type="button">
					Decline
				</button>
				<button className={cn(PILL_PRIMARY, "h-9 flex-1")} onClick={() => choose("granted")} type="button">
					Accept
				</button>
			</div>
		</section>
	);
}
