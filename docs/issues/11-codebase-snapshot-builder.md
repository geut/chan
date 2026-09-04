---
title: Codebase Snapshot builder
slice: 11
type: AFK
branch: agent-refactor
---

## What to build

New module `packages/chan/src/codebase-snapshot.ts` with `buildCodebaseSnapshot(cwd: string): Promise<string>` — the deterministic, filesystem-only gathering step that feeds an AI Inspection (chan-ai never touches the filesystem for inspection; it only prompts over this snapshot).

The snapshot concatenates, with clear section headers:

- `## package.json` — full contents (name, description, bin, exports, engines, workspaces, dependencies: the strongest signal for module vs application vs cli tool vs monorepo).
- `## README` — the **full** README (no excerpting heuristics; this is a one-time task where more context is better). Try `README.md` and common case variants.
- `## Top-level entries` — directory listing of `cwd` (directories suffixed with `/`), hinting at monorepo layouts, Docker, CI config, docs.

Each piece degrades gracefully: a non-node project still yields a README + listing; a repo with neither still yields the listing.

## Acceptance criteria

- [ ] Snapshot includes the full package.json when present, omitted (no error) when absent
- [ ] Snapshot includes the full README when present, omitted when absent
- [ ] Snapshot includes the top-level directory listing with `/` suffix on directories
- [ ] Output is a single deterministic string with `##`-delimited sections
- [ ] Unit tests with temp dirs cover: node project with README, project without package.json, project without README, empty-ish directory
- [ ] `npm run lint` passes with oxlint
- [ ] `npm run check-types` passes with tsgo

## Blocked by

None — can start immediately (parallel with slices 10 and 12).
