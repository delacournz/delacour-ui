/**
 * The npm dist-tag this CLI build installs Delacour packages from.
 *
 * Two lines ship from one repository: every merge to `develop` publishes an
 * `x.y.z-alpha.<datetime>` snapshot of every changed package under `alpha`,
 * and a release publishes the stable `x.y.z` under `latest`. A CLI reads the
 * registry at the commit it was built from, so an alpha CLI can hand over
 * components that use an API only the alpha packages have — it has to install
 * those. A stable CLI must not, or `add` would pull a prerelease into an app
 * that asked for neither.
 *
 * The CLI's own version says which line it is on, so nothing extra is baked
 * in: a prerelease version is the alpha channel, anything else is `latest`.
 * `0.0.0-dev` — a working tree nobody built — counts as `latest`.
 */
export type Channel = "alpha" | "latest";

declare const __CLI_VERSION__: string | undefined;

export function channelFor(version: string): Channel {
	return /-alpha\b/.test(version) ? "alpha" : "latest";
}

export const CLI_CHANNEL: Channel = channelFor(typeof __CLI_VERSION__ === "string" ? __CLI_VERSION__ : "0.0.0-dev");
