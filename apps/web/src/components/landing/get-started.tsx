import type { ReactElement } from "react";
import { InstallTabs } from "@/components/install";
import { GET_STARTED_COPY } from "@/components/landing/copy";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { PAGE_SECTION } from "@/components/section";

/**
 * Two routes in: the CLI copies source into a repository you own, the package
 * is for a team that would rather take updates than own the files.
 */
export function GetStarted(): ReactElement {
	return (
		<Reveal className={`${PAGE_SECTION} py-section`}>
			<SectionHeading eyebrow={GET_STARTED_COPY.eyebrow} title={GET_STARTED_COPY.title}>
				{GET_STARTED_COPY.body}
			</SectionHeading>
			<div className="mt-section-gap grid gap-6 lg:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{GET_STARTED_COPY.cli.label}</p>
					<InstallTabs commands={[{ verb: "dlx", packages: [GET_STARTED_COPY.cli.command] }]} />
				</div>
				<div className="flex min-w-0 flex-col gap-2">
					<p className="font-medium text-fd-muted-foreground text-sm">{GET_STARTED_COPY.pkg.label}</p>
					<InstallTabs commands={[{ verb: "add", packages: [GET_STARTED_COPY.pkg.command] }]} />
				</div>
			</div>
		</Reveal>
	);
}
