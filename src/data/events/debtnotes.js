// The pre-patch's torn debt notes (#523, docs/plans/2026-11-08-prepatch-design.md §3): debt collectors drop them at every
// level (game.js G.collectorKill); a clerk in every town with a profession trainer trades them for a title or for Mentor
// Marks. No power, no rush: the clerk stays until v11.0 ships (D.PREPATCH.live). The title is account-wide.
(function (root) {
  const D = root.D;
  D.PREPATCH.trade = [
    { id: 'debt_breaker', kind: 'title', cost: 40 },
    { id: 'marks', kind: 'marks', cost: 5, marks: 10 },
  ];
  D.TITLES.push({ id: 'debt_breaker', name: '%s the Debt-Breaker', need: { debtBreaker: 1 }, how: 'Trade 40 torn debt notes to a debt clerk', prepatch: true });
  D.NPCS.note_clerk = { name: 'Clerk Odell Pask', title: 'Torn Debt Notes', prepatch: true };
  const towns = new Set([].concat(...Object.values(D.PROF_TRAINERS || {})));
  for (const p of towns) if (D.PLACES[p] && !D.PLACES[p].npcs.includes('note_clerk')) D.PLACES[p].npcs.push('note_clerk');
})(typeof window !== 'undefined' ? window : globalThis);
