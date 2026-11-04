import { QUALITY_LIMITS, QUALITY_STATUS, type ThemeQualityResult } from "@delacour/design-system/quality";
import type { ReactElement } from "react";

/** Show the measured pair beside the state that uses it. */
export function ThemeQuality({ results }: { results: readonly ThemeQualityResult[] }): ReactElement {
	return (
		<div className="flex flex-col gap-4" id="theme-quality">
			<p className="max-w-reading text-fd-muted-foreground text-sm">{QUALITY_LIMITS}</p>
			<div className="grid gap-3 xl:grid-cols-2">
				{(["light", "dark"] as const).map((mode) => {
					const rows = results.filter((row) => row.mode === mode);
					const failed = rows.filter((row) => row.status === "fail").length;
					const unknown = rows.filter((row) => row.status === "unknown").length;
					return (
						<details className="min-w-0 rounded-xl border border-fd-border p-3" key={mode}>
							<summary className="cursor-pointer text-sm">
								<strong>{mode === "light" ? "Light" : "Dark"}</strong>
								<span className="ms-2 text-fd-muted-foreground">
									{failed} below target · {unknown} not measured
								</span>
							</summary>
							<ul className="mt-3 flex flex-col divide-y divide-fd-border">
								{rows.map((row) => (
									<QualityRow key={row.label} row={row} />
								))}
							</ul>
						</details>
					);
				})}
			</div>
			<p className="text-fd-muted-foreground text-xs">
				Targets: 4.5:1 for text and 3:1 for focus and chart indicators. Change the palette above, then inspect both
				modes.
			</p>
		</div>
	);
}

function QualityRow({ row }: { row: ThemeQualityResult }): ReactElement {
	return (
		<li className="flex min-w-0 gap-3 py-3">
			<span
				aria-hidden="true"
				className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-fd-border text-base"
				style={{ background: row.backgroundValue ?? undefined, color: row.foregroundValue ?? undefined }}
			>
				{row.ratio === null ? "?" : row.minimum === 3 ? "●" : "Aa"}
			</span>
			<div className="min-w-0 flex-1 space-y-1">
				<p className="text-sm font-medium">{row.label}</p>
				<p className={row.status === "fail" ? "text-fd-warning text-xs" : "text-fd-muted-foreground text-xs"}>
					{QUALITY_STATUS[row.status]} · {row.ratio === null ? "No ratio" : `${row.ratio.toFixed(2)}:1`} / {row.minimum}
					:1
				</p>
				<p className="break-words font-mono text-[11px] text-fd-muted-foreground">
					--{row.foreground}: {row.foregroundValue ?? "missing"}
				</p>
				<p className="break-words font-mono text-[11px] text-fd-muted-foreground">
					--{row.background}: {row.backgroundValue ?? "missing"}
				</p>
			</div>
		</li>
	);
}
