// This week (#541): the banners behind the This week button, one per thing that's on. The game picks them by date
// (from/to, inclusive, in the player's own time), so swapping a week is only this file: add the new week's banners,
// and the old ones drop off on their own. Nothing changes mid-week.
//
// A banner:
//   id     unique, never reused (the "seen" mark is kept per id)
//   kind   'now' (on now), 'new' (added by an update), 'soon' (greyed, with a countdown to `at`)
//   from, to   'YYYY-MM-DD'; at: 'YYYY-MM-DD' for 'soon' (the day it arrives)
//   art    [kind, key, crop]: existing art, cropped wide. kind 'story' (ART.story scenes) or 'scene' (place scenes);
//          crop is the CSS object-position (default 'center'). artHorde: the art the second faction sees, when the place is one faction's.
//          A big feature may get its own art in an art pack.
//   'soon' with no `at` says "Coming soon": no date, so a feature that moves a week breaks no promise.
//   title, text   the banner's name and up to two short lines (the detail page shows all of text)
//   steps  up to 5: { text, check, go }. check: [name, value] from G.WEEK_CHECKS (it ticks itself); go: a screen
//          from the ui's WEEK_GO (opens it). A step with neither is a tip. tools/validate.js checks both names.
// With no banner on, the sheet shows the festival that's on or what comes next, from D.EVENTS.
(function (root) {
  const D = root.D;
  D.WEEK = [
    {
      id: 'prepatch_teaser', kind: 'soon', from: '2026-11-09', to: '2026-11-13', at: '2026-11-14',
      art: ['story', 'shadow_court', 'center 35%'],
      title: 'The Notes Come Due',
      text: [
        'The Ruinfall Saga begins. Debt collectors come to every zone, and every class learns a new ability.',
        'The campaign opens at level 60; below it, the collectors and the zone events are yours too.',
      ],
      steps: [
        { text: 'Reach level 60 to start the campaign on day one', check: ['level', 60] },
      ],
    },
    {
      id: 'living_realm', kind: 'new', from: '2026-11-01', to: '2026-11-13',
      art: ['scene', 'stormwind', 'center 60%'], artHorde: ['scene', 'orgrimmar', 'center 60%'],
      title: 'The Living Realm',
      text: [
        'The same players on every character, with friends who remember you and guilds that grow.',
      ],
      steps: [
        { text: 'Make a friend: join a group from chat or buy from a player', check: ['friends', 1], go: 'social:chat' },
        { text: 'Join a guild', check: ['guild', 1], go: 'social:guild' },
        { text: 'Tap a player in the scene or in chat to see their card' },
      ],
    },
    {
      id: 'faire_soon', kind: 'soon', from: '2026-11-09', to: '2026-11-13',
      art: ['scene', 'goldshire', 'center 55%'],
      title: 'The Faire',
      text: [
        "A week of games at every inn: Liar's dice against the realm's players, with tickets, prizes and new looks.",
      ],
      steps: [],
    },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
