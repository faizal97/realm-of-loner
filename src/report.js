// Bug reports (v9.9): catches JavaScript errors while you play and builds a report you can send as a prefilled GitHub
// issue (the bug form at github.com/faizal97/realm-of-loner/issues/new) or copy for Discord. The report holds the version, the device
// and the game state needed to reproduce a bug (level, class, place, what you were doing); never the save itself.
// UI lives in ui.js (reportDialog); this file has no DOM code.
(function (root) {
  const REPORT = root.REPORT = {};
  const REPO_ISSUES = 'https://github.com/faizal97/realm-of-loner/issues/new';
  const errors = []; // the last few, newest last
  let onError = null;
  REPORT.onError = (fn) => { onError = fn; };
  REPORT.errors = () => errors.slice();

  function record(message, stack, where) {
    const msg = String(message || 'Unknown error').slice(0, 300);
    // the same error repeating every frame is one error
    const last = errors[errors.length - 1];
    if (last && last.message === msg) { last.count++; return; }
    const e = { message: msg, stack: String(stack || '').split('\n').slice(0, 8).join('\n').slice(0, 1200), where: where || '', at: new Date().toISOString(), count: 1 };
    errors.push(e); if (errors.length > 5) errors.shift();
    if (onError) try { onError(e); } catch (x) { }
  }
  root.addEventListener && root.addEventListener('error', (ev) => record(ev.message, ev.error && ev.error.stack, (ev.filename || '') + ':' + (ev.lineno || 0)));
  root.addEventListener && root.addEventListener('unhandledrejection', (ev) => { const r = ev.reason; record(r && r.message ? r.message : String(r), r && r.stack, 'promise'); });
  REPORT.record = record;

  // what we know about the game right now; only what helps reproduce a bug
  REPORT.details = function () {
    const G = root.G, D = root.D, S = G && G.S, P = S && S.player;
    const lines = [];
    lines.push(`Version: ${String(root.AZ_VERSION || '?')} (${root.AzUpd ? 'Android app' : 'browser'})`);
    lines.push(`Device: ${(root.navigator && navigator.userAgent) || '?'}`);
    lines.push(`Screen: ${root.innerWidth || '?'}x${root.innerHeight || '?'}`);
    if (P && D) {
      const place = D.PLACES[P.place];
      lines.push(`Character: level ${P.level} ${(D.RACES[P.race] || {}).name || P.race} ${(D.CLASSES[P.cls] || {}).name || P.cls}`);
      lines.push(`Place: ${place ? place.name + ' (' + place.zone + ')' : P.place}${P.travel ? ` · travelling to ${(D.PLACES[P.travel.to] || {}).name}` : ''}`);
      if (S.run) lines.push(`In a group: ${S.run.name}, pull ${S.run.idx + 1}/${S.run.pulls.length}, phase ${S.run.phase}`);
      if (G.fight) lines.push(`In a fight: ${G.fight.kind || 'world'}`);
      lines.push(`Quests active: ${Object.keys(P.quests).join(', ') || 'none'}`);
    } else lines.push('Character: none loaded (character screen)');
    return lines;
  };
  // the errors as text, each in a code block (the report's last part; the bug form's Errors field)
  const errorsText = () => errors.map((e) => ['```', `${e.message}${e.count > 1 ? ` (x${e.count})` : ''} at ${e.where} ${e.at}`, e.stack, '```'].join('\n')).join('\n');
  REPORT.text = function (what) {
    const out = ['**What happened**', (what || '').trim() || '(not described)', '', '**Details**'].concat(REPORT.details().map((l) => '- ' + l));
    if (errors.length) out.push('', '**Errors**', errorsText());
    return out.join('\n');
  };
  // a new-issue link that opens the bug form (.github/ISSUE_TEMPLATE/bug_report.yml) with its fields filled in by their ids:
  // what, details, errors. The form labels the issue itself (labels in a URL only apply for the repo's own team), and blank
  // issues are off, so a plain ?body= link would land on the template chooser and lose the report. Kept short enough for a URL
  REPORT.issueUrl = function (title, what) {
    let errs = errorsText();
    if (errs.length > 4000) errs = errs.slice(0, 4000) + '\n…(cut; use Copy report for the rest)';
    const q = { template: 'bug_report.yml', title: 'Bug: ' + (title || 'Bug report'), what: (what || '').trim() || '(not described)', details: REPORT.details().map((l) => '- ' + l).join('\n'), errors: errs };
    return REPO_ISSUES + '?' + Object.keys(q).filter((k) => q[k]).map((k) => `${k}=${encodeURIComponent(q[k])}`).join('&');
  };
})(typeof window !== 'undefined' ? window : globalThis);
