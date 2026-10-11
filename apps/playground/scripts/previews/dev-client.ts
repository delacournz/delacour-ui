/**
 * The deep link that takes a dev client past its launcher and onto a bundler.
 *
 * A development build opens on expo-dev-launcher's own screen — a list of
 * every Metro on the machine, this worktree's and everyone else's — and
 * `launchMode: "most-recent"` only skips it when the last project it loaded is
 * still being served. A capture run cannot depend on either, so it never lets
 * the launcher choose: it hands the app this URL, which expo-dev-launcher
 * treats as "load this project now", from the launcher or over a running app.
 *
 * Over a running app that is a refresh — the React instance is torn down and
 * the bundle fetched again in the same process — which is what lets a run
 * reuse a process whose devtools bridge is already live rather than restart it.
 *
 * The three flags are expo-dev-launcher's own (`EXDevLauncherURLHelper`), and
 * each removes something a capture would otherwise record: the first-run
 * onboarding sheet, the floating "Tools" button, and the dev menu opening
 * itself on launch.
 */
export function devClientUrl(scheme: string, port: number): string {
	const params = new URLSearchParams({
		disableAutoLaunch: "1",
		disableFab: "1",
		disableOnboarding: "1",
		url: `http://localhost:${port}`,
	});
	return `${scheme}://expo-development-client/?${params.toString()}`;
}

/** Whether a Metro bundler is answering on this port. */
export async function bundlerRunning(port: number): Promise<boolean> {
	try {
		const response = await fetch(`http://localhost:${port}/status`, { signal: AbortSignal.timeout(3000) });
		return (await response.text()).includes("packager-status:running");
	} catch {
		return false;
	}
}
