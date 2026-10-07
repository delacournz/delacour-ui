import type { PresetShortcut } from "@delacour/design-system/house";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { PrimarySpecimen, SurfaceSpecimen } from "@/components/theme-specimens";
import { cn } from "@/lib/cn";
import { PRESETS } from "@/lib/theme-preset";

/**
 * The presets, as the first row of the customiser: the house, the library
 * default, and two curated starting points, each a link carrying its code.
 *
 * Stateless like every other control on `/theme` — `aria-current` is read off
 * the code in the URL, so the server HTML and the ring agree. The house leads
 * because this page is wearing it; "Library default" is what the reader gets
 * with no preset at all, and `ResetThemeLink` is the same destination.
 */
export function PresetsRow({ current }: { current: string | undefined }): ReactElement {
	return (
		<ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
			{PRESETS.map((preset) => (
				<li key={preset.name}>
					<PresetLink preset={preset} isSelected={current === preset.code} />
				</li>
			))}
		</ul>
	);
}

function PresetLink({ preset, isSelected }: { preset: PresetShortcut; isSelected: boolean }): ReactElement {
	return (
		<Link
			aria-current={isSelected ? "true" : undefined}
			className={cn(
				"flex h-full items-start gap-3 rounded-tile border p-3 text-left transition-[background-color,scale] duration-150 ease-out hover:bg-(--hover-fill) active:scale-[0.98]",
				isSelected ? "border-fd-foreground ring-1 ring-fd-foreground" : "border-fd-border"
			)}
			resetScroll={false}
			search={{ preset: preset.code }}
			to="/theme"
		>
			<span className="mt-0.5 flex shrink-0 flex-col items-center gap-1.5">
				<PrimarySpecimen config={preset.config} />
				<SurfaceSpecimen config={preset.config} />
			</span>
			<span className="flex min-w-0 flex-col gap-0.5">
				<span className="font-medium text-[13px]">{preset.title}</span>
				<span className="text-[11px] text-fd-muted-foreground leading-relaxed">{preset.blurb}</span>
			</span>
		</Link>
	);
}
