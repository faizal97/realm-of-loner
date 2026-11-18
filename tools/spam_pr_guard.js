// Shared rule engine for the spam-PR guard (#148): a pull request opened by
// someone who is not a collaborator is closed automatically when its metadata
// (title, body, changed file list) looks like a bounty-bot submission. The
// workflow (.github/workflows/guard-spam-pr.yml) only reads metadata through
// the API — it never checks out or runs the PR's code.
//
// Rules (from #148, against the sample spam PR #147):
//   1. the title or body carries a bounty marker: /claim, /opire, /bounty,
//      "Bounty Reward Wallet", or an EVM wallet address (0x + 40 hex);
//   2. it changes no file under the game's source trees (src/, test/, tools/,
//      sim/, docs/, notes/, art/, audio/, app/, guides/, .github/), and
//      nothing else meaningful (only stray root-level files or none at all).
// Either one alone closes the PR. Collaborators are never touched.
'use strict';

const BOUNTY_MARKERS = [
  '/claim',
  '/opire',
  '/bounty',
  '/reward',
  'bounty reward wallet',
];

// EVM wallet address: 0x followed by exactly 40 hex characters, on a word
// boundary so a longer hex string (a commit sha, "0x" prefixed constants)
// doesn't match.
const WALLET_RE = /\b0x[0-9a-fA-F]{40}\b/;

// The game's source trees; a real contribution touches at least one of these.
const SOURCE_PREFIXES = ['src/', 'test/', 'tools/', 'sim/', 'docs/', 'notes/',
  'art/', 'audio/', 'app/', 'guides/', '.github/'];

// Returns the reason string when the PR matches a spam rule, null otherwise.
// title/body: strings (may be empty); files: array of changed file paths.
function spamReason(title, body, files) {
  const text = `${title || ''}\n${body || ''}`.toLowerCase();
  if (BOUNTY_MARKERS.some((m) => text.includes(m))) {
    return 'bounty marker in the title or body';
  }
  if (WALLET_RE.test(text)) {
    return 'a wallet address in the title or body';
  }
  if (Array.isArray(files)) {
    const touchesSource = files.some((f) => SOURCE_PREFIXES.some((p) => f === p || f.startsWith(p)));
    if (!touchesSource) {
      return files.length === 0
        ? 'no changed files at all'
        : 'no change to any source directory';
    }
  }
  return null;
}

module.exports = { spamReason, BOUNTY_MARKERS, WALLET_RE, SOURCE_PREFIXES };
