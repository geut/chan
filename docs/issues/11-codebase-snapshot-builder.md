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

- [x] Snapshot includes the full package.json when present, omitted (no error) when absent
- [x] Snapshot includes the full README when present, omitted when absent
- [x] Snapshot includes the top-level directory listing with `/` suffix on directories
- [x] Output is a single deterministic string with `##`-delimited sections
- [x] Unit tests with temp dirs cover: node project with README, project without package.json, project without README, empty-ish directory
- [x] `npm run lint` passes with oxlint
- [x] `npm run check-types` passes with tsgo

## Notes

- README is resolved by matching the already-read `readdir` listing against a fixed priority list (`README.md` > `readme.md` > `Readme.md` > `README`) with exact-name comparison — never by probing the filesystem with `readFile` per candidate — so the result is identical on case-sensitive and case-insensitive filesystems.
- Output shape: sections in the fixed order `## package.json` / `## README` / `## Top-level entries` (the first two omitted when their source is absent), blank-line separated, single trailing `\n`. The listing section is always present: non-recursive, code-unit sorted via `toSorted()`, directories suffixed `/`, dotfiles listed as-is, bare names only (no path separators) so output is platform-stable.
- Graceful degradation is ENOENT-only: `package.json` read errors other than ENOENT propagate; an absent README produces no read attempt at all (it falls out of the listing match); an empty directory yields `## Top-level entries` with an empty body.
- The module is internal for now — not re-exported from the package root. Slice 13 imports it directly in `commands/init.ts`; the signature stays `(cwd: string) => Promise<string>`, and the inspector (slice 12) receives the string verbatim per `InspectArgsSchema`.

## Blocked by

None — can start immediately (parallel with slices 10 and 12).
