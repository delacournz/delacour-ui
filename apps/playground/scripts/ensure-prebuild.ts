#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
/**
 * Guard: ensure `expo prebuild` has been run before dev/ios/android.
 *
 * We never want to launch against Expo Go; this project uses expo-dev-client
 * and requires the native `ios/` and `android/` projects to exist.
 *
 * If either directory is missing, run `bun expo prebuild` first.
 *
 * It detects a MISSING prebuild, not a STALE one. Adding a native module
 * leaves both directories in place, so this passes and the app red-boxes with
 * `Cannot find native module` instead — run `bun expo prebuild --clean` by hand
 * after any change to the native dependency set.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const iosDir = join(root, "ios");
const androidDir = join(root, "android");

const hasIos = existsSync(iosDir);
const hasAndroid = existsSync(androidDir);

if (!hasIos || !hasAndroid) {
	const missing = [!hasIos && "ios", !hasAndroid && "android"].filter(Boolean).join(", ");
	console.log(`[ensure-prebuild] Missing native project(s): ${missing}. Running \`bun run prebuild\`...`);
	const result = spawnSync("bun", ["run", "prebuild"], {
		stdio: "inherit",
		cwd: root,
	});
	if (result.status !== 0) {
		console.error("[ensure-prebuild] `bun run prebuild` failed.");
		process.exit(result.status ?? 1);
	}
}
