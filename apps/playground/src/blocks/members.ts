export type MemberRole = "admin" | "editor" | "viewer";
export type MemberStatus = "active" | "invited" | "suspended";
export type RoleFilter = MemberRole | "all";

export type Member = {
	readonly id: string;
	readonly name: string;
	readonly email: string;
	readonly role: MemberRole;
	readonly status: MemberStatus;
};

export const MEMBERS: readonly Member[] = [
	{ id: "m1", name: "Ada Lovelace", email: "ada@analytical.dev", role: "admin", status: "active" },
	{ id: "m2", name: "Grace Hopper", email: "grace@cobol.dev", role: "admin", status: "active" },
	{ id: "m3", name: "Rawiri Kemp", email: "rawiri@delacour.co.nz", role: "editor", status: "active" },
	{ id: "m4", name: "Mere Tane", email: "mere@delacour.co.nz", role: "editor", status: "invited" },
	{ id: "m5", name: "Alan Turing", email: "alan@bletchley.uk", role: "viewer", status: "active" },
	{ id: "m6", name: "Margaret Hamilton", email: "margaret@apollo.space", role: "viewer", status: "suspended" },
	{ id: "m7", name: "Linus Pauling", email: "linus@caltech.edu", role: "viewer", status: "invited" },
];

export const ROLE_FILTERS: readonly RoleFilter[] = ["all", "admin", "editor", "viewer"];

export const ROLE_LABELS: Record<RoleFilter, string> = {
	all: "All",
	admin: "Admins",
	editor: "Editors",
	viewer: "Viewers",
};

export function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return `${first}${last}`.toUpperCase();
}

export function filterMembers(members: readonly Member[], query: string, role: RoleFilter): readonly Member[] {
	const needle = query.trim().toLowerCase();
	return members.filter((member) => {
		if (role !== "all" && member.role !== role) return false;
		if (needle === "") return true;
		return `${member.name} ${member.email}`.toLowerCase().includes(needle);
	});
}

export function roleCounts(members: readonly Member[]): Record<RoleFilter, number> {
	return {
		all: members.length,
		admin: members.filter((member) => member.role === "admin").length,
		editor: members.filter((member) => member.role === "editor").length,
		viewer: members.filter((member) => member.role === "viewer").length,
	};
}
