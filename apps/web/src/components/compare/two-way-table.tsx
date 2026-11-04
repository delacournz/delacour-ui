import type { ReactElement } from "react";
import { Mark } from "@/components/compare/mark";
import { cn } from "@/lib/cn";
import type { Comparison, TwoWayRow, TwoWaySection } from "@/lib/compare";
import type { Answer } from "@/lib/comparison";

const COLUMNS = "md:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,1fr))]";

/**
 * One section of a two-way comparison: Delacour UI against one other library.
 * Drawn the way `/compare/heroui` draws its three columns — the same hairlines,
 * the same `Mark` — so every comparison on the site reads as one table style.
 * Below `md` each row stacks and every answer is labelled with its library.
 */
export function TwoWayTable({ comparison, section }: { comparison: Comparison; section: TwoWaySection }): ReactElement {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex max-w-reading flex-col gap-2">
				<h3 className="text-2xl">{section.title}</h3>
				<p className="text-fd-muted-foreground">{section.blurb}</p>
			</div>

			<div className="overflow-hidden rounded-card border border-fd-border">
				<div className={cn("hidden border-fd-border border-b md:grid", COLUMNS)}>
					<div className="px-4 py-3" />
					<div className="px-4 py-3 text-center">
						<a
							className="font-medium text-sm underline decoration-fd-border underline-offset-4 transition-colors hover:decoration-fd-primary"
							href="/docs/native/getting-started"
						>
							Delacour UI
						</a>
						<p className="mt-0.5 text-fd-muted-foreground text-xs">MIT · copy in or install</p>
					</div>
					<div className="px-4 py-3 text-center">
						<a
							className="font-medium text-sm underline decoration-fd-border underline-offset-4 transition-colors hover:decoration-fd-primary"
							href={comparison.href}
							rel="noreferrer noopener"
							target="_blank"
						>
							{comparison.name}
						</a>
						<p className="mt-0.5 text-fd-muted-foreground text-xs">{comparison.tagline}</p>
					</div>
				</div>

				{section.rows.map((row) => (
					<Row key={row.feature} name={comparison.name} row={row} />
				))}
			</div>
		</div>
	);
}

function Row({ row, name }: { row: TwoWayRow; name: string }): ReactElement {
	return (
		<div className={cn("grid border-fd-border border-b last:border-b-0 md:items-stretch", COLUMNS)}>
			<div className="px-4 py-4">
				<p className="font-medium text-sm">{row.feature}</p>
			</div>
			<Cell answer={row.delacour} ours product="Delacour UI" />
			<Cell answer={row.them} ours={false} product={name} />
		</div>
	);
}

function Cell({ product, answer, ours }: { product: string; answer: Answer; ours: boolean }): ReactElement {
	return (
		<div className={cn("px-4 py-4 md:text-center", ours && "bg-fd-card/60")}>
			<div className="flex items-start gap-2 md:flex-col md:items-center md:gap-1.5">
				<Mark support={answer.support} />
				<div className="min-w-0">
					<p className="font-medium text-fd-muted-foreground text-xs md:hidden">{product}</p>
					<p className="text-fd-muted-foreground text-xs">{answer.note}</p>
				</div>
			</div>
		</div>
	);
}
