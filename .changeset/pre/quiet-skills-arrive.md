---
"delacour": minor
---

`delacour skills` installs an agent skill

An agent asked for "a button" writes plausible JSX — the right shape, and none of the parts that
matter: the icon that inherits its size from the button's context, the spinner that *replaces* the
icon so the label does not shift, the `expo install` route for the native modules underneath.

`bunx delacour@alpha skills` installs a skill into whichever assistants a project uses — Claude
Code, Cursor, OpenCode or Codex, detected from the directories present, or named with `--agent`, in
`--scope project` or `user`. The files are bundled into the binary, so a run works offline and
installs the skill matching the version you are pinned to. The docs site serves the same bytes at
`/skills/delacour-ui/SKILL.md`.

The skill names no component on purpose. A catalogue on someone's disk is stale the day the next
component ships, and silently so — it teaches `list`, `view`, `add` and `doctor` instead, and spends
its own words on the failures that produce no error message.
