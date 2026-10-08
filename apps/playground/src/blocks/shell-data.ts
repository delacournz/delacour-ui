export type ShellTab = "home" | "activity" | "inbox" | "profile";

export const SHELL_TABS: readonly { readonly id: ShellTab; readonly title: string }[] = [
	{ id: "home", title: "Home" },
	{ id: "activity", title: "Activity" },
	{ id: "inbox", title: "Inbox" },
	{ id: "profile", title: "Me" },
];

export const ACTIVITY: readonly { readonly id: string; readonly title: string; readonly when: string }[] = [
	{ id: "a1", title: "Invoice INV-1042 was paid", when: "2 minutes ago" },
	{ id: "a2", title: "Mere Tane accepted an invite", when: "1 hour ago" },
	{ id: "a3", title: "Quarterly report exported", when: "Yesterday" },
	{ id: "a4", title: "Two-step sign-in turned on", when: "Mon 5 Oct" },
	{ id: "a5", title: "Billing plan changed to Pro", when: "Fri 2 Oct" },
];
