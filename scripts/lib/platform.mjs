// platform.mjs — small cross-platform detection helpers shared by
// doctor.mjs (and available to snapshot.mjs if its try-fallback
// strategy ever wants a pre-check).

import { accessSync, constants } from 'node:fs';
import path from 'node:path';

/** True when `cmd` resolves to an executable on the current PATH. */
export function commandExists(cmd) {
  const pathVar = process.env.PATH ?? '';
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM').split(';')
    : [''];
  for (const dir of pathVar.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try {
        accessSync(path.join(dir, cmd + ext.toLowerCase()), constants.X_OK);
        return true;
      } catch { /* keep looking */ }
      if (process.platform === 'win32') {
        try {
          accessSync(path.join(dir, cmd + ext), constants.X_OK);
          return true;
        } catch { /* keep looking */ }
      }
    }
  }
  return false;
}

/**
 * How this machine can produce snapshot archives.
 * Mirrors the fallback order of scripts/snapshot.mjs:
 * zip CLI → tar → PowerShell Compress-Archive (Windows).
 */
export function zipCapability() {
  if (commandExists('zip')) return { ok: true, via: 'zip' };
  if (commandExists('tar')) return { ok: true, via: 'tar (.tar.gz fallback)' };
  if (process.platform === 'win32' && commandExists('powershell')) {
    return { ok: true, via: 'PowerShell Compress-Archive' };
  }
  return { ok: false, via: null };
}
