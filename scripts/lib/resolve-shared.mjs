// resolve-shared.mjs — resolve a client-wide asset path with team
// override fallback.
//
// Convention without config: if the team has its own override at
// `teams/<slug>/<rel>`, use that; otherwise fall back to
// `shared/<rel>`.
//
// Used by:
//   - Agents (Copilot, Claude, Gemini, Codex) reading client config
//   - Future scripts that need the "right" env/users/filters/deploy
//     for a given team
//
// API:
//   resolveShared(repoRoot, teamSlug, rel) → absolute path
//   resolveSharedRelative(repoRoot, teamSlug, rel) → repo-relative POSIX path
//
// Both check synchronously via fs.statSync (no async needed for
// tiny existence checks).

import path from 'node:path';
import fs from 'node:fs';

function exists(p) {
  try {
    fs.statSync(p);
    return true;
  } catch {
    return false;
  }
}

// rel: a path under either teams/<slug>/<rel> or shared/<rel>.
// Examples:
//   'environments/qa.md'  → checks teams/<slug>/environments/qa.md, then shared/environments/qa.md
//   'users.md'            → checks teams/<slug>/users.md, then shared/users.md
//   'filters.md'          → checks teams/<slug>/filters.md, then shared/filters.md
//   'deploy.md'           → checks teams/<slug>/deploy.md, then shared/deploy.md
export function resolveShared(repoRoot, teamSlug, rel) {
  if (!repoRoot) throw new Error('resolveShared: repoRoot required');
  if (!teamSlug) throw new Error('resolveShared: teamSlug required');
  if (!rel) throw new Error('resolveShared: rel required');

  const teamPath = path.join(repoRoot, 'teams', teamSlug, rel);
  if (exists(teamPath)) return teamPath;

  const sharedPath = path.join(repoRoot, 'shared', rel);
  if (exists(sharedPath)) return sharedPath;

  // Neither exists. Return the shared path so callers can produce a
  // helpful "expected at <shared path>" error without re-doing the
  // resolution.
  return sharedPath;
}

export function resolveSharedRelative(repoRoot, teamSlug, rel) {
  const abs = resolveShared(repoRoot, teamSlug, rel);
  return path.relative(repoRoot, abs).split(path.sep).join('/');
}

// Returns { source: 'team' | 'shared' | 'missing', path: <abs> }.
// Use this when the caller wants to log/show where the resolved
// file came from (e.g. "QA env (from team override): teams/foo/environments/qa.md").
export function resolveSharedWithSource(repoRoot, teamSlug, rel) {
  const teamPath = path.join(repoRoot, 'teams', teamSlug, rel);
  if (exists(teamPath)) return { source: 'team', path: teamPath };
  const sharedPath = path.join(repoRoot, 'shared', rel);
  if (exists(sharedPath)) return { source: 'shared', path: sharedPath };
  return { source: 'missing', path: sharedPath };
}
