// This week (#541): the banners behind the This week button, one per thing that's on. The game picks them by date
// (from/to, inclusive, in the player's own time), so swapping a week is only this file: add the new week's banners,
// and the old ones drop off on their own. Nothing changes mid-week.
//
// A banner:
//   id     unique, never reused (the "seen" mark is kept per id)
//   kind   'now' (on now), 'new' (added by an update), 'soon' (greyed, with a countdown to `at`)
//   from, to   'YYYY-MM-DD'; at: 'YYYY-MM-DD' for 'soon' (the day it arrives)
//   art    ['banner', key]: a finished banner from art/banners/banners.py (src/art_banners.js): a game scene behind,
//          figures in front and the feature's own logo. Never a bare scene. artHorde: the one the second faction sees.
//          The build stops while a banner's art is unused, or a banner ended more than 7 days ago: delete both.
//   'soon' with no `at` says "Coming soon": no date, so a feature that moves a week breaks no promise.
//   title, text   the banner's name and up to two short lines (the detail page shows all of text)
//   bonus  optional: this week's bonus while the banner is on ('featured_dungeons': G.featuredDungeons, ×1.5 run rewards)
//   steps  up to 5: { text, check, go }. check: [name, value] from G.WEEK_CHECKS (it ticks itself); go: a screen
//          from the ui's WEEK_GO (opens it). A step with neither is a tip. tools/validate.js checks both names.
// With no banner on, the sheet shows the festival that's on or what comes next, from D.EVENTS.
(function (root) {
  const D = root.D;
  D.WEEK = [
    {
      id: 'prepatch_teaser', kind: 'soon', from: '2026-11-09', to: '2026-11-13', at: '2026-11-14',
      art: ['banner', 'notes_come_due'],
      title: 'The Notes Come Due',
      text: [
        'The Ruinfall Saga begins. Debt collectors come to every zone, and every class learns a new ability.',
        'Collectors and their torn debt notes are there at every level. The campaign and the new abilities open at 60, after The Drowned Crown or a raid.',
      ],
      steps: [
        { text: 'Reach level 60', check: ['level', 60] },
        { text: 'Finish The Drowned Crown or clear a raid: the campaign opens on day one', check: ['prepatch_open'], go: 'lfg:raid' },
      ],
    },
    {
      id: 'featured_dungeons_2026_11_09', kind: 'now', from: '2026-11-09', to: '2026-11-13', bonus: 'featured_dungeons',
      art: ['banner', 'featured_dungeons'], artHorde: ['banner', 'featured_dungeons_h'],
      title: 'Featured Dungeons',
      text: [
        'One old dungeon for every level range. Speed and no-wipe rewards pay ×1.5 there, and your first clear of one this week pays a bonus.',
        "The debt collectors' scouts are working these halls before Saturday. Get there first.",
      ],
      steps: [
        { text: 'Clear a featured dungeon this week', check: ['featured_dungeon', 1], go: 'lfg:dungeon' },
      ],
    },
    {
      id: 'living_realm', kind: 'new', from: '2026-11-01', to: '2026-11-13',
      art: ['banner', 'living_realm'], artHorde: ['banner', 'living_realm_h'],
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
      art: ['banner', 'faire'],
      title: 'The Faire',
      text: [
        "A week of games at every inn: Liar's dice against the realm's players, with tickets, prizes and new looks.",
      ],
      steps: [],
    },
    // ---- the week of 14 November: the pre-patch (v10.19.0)
    {
      id: 'prepatch_2026_11_14', kind: 'now', from: '2026-11-14', to: '2026-11-20',
      art: ['banner', 'notes_come_due'],
      title: 'The Notes Come Due',
      text: [
        'Debt collectors walk every zone, at every level. Each one you beat leaves a torn debt note, unless it is grey to you; a debt clerk in any town with trainers trades them for Mentor Marks or a title.',
        'At 60, after The Drowned Crown or a raid, the campaign opens and every class learns a new ability.',
      ],
      steps: [
        { text: 'Beat a debt collector (not grey) for a torn debt note', check: ['debt_notes', 1], go: 'map' },
        { text: 'Trade 40 torn debt notes for the title the Debt-Breaker', check: ['debt_breaker'], go: 'debtclerk' },
        { text: 'At 60: finish The Drowned Crown or clear a raid to open the campaign', check: ['prepatch_open'], go: 'lfg:raid' },
        { text: "Learn your class's new ability from Tutor Ione Calder in Rumhook Bay", check: ['prepatch_ability'], go: 'prepatch:tutor' },
        { text: 'Finish the campaign: Coronation Day', check: ['prepatch_campaign'], go: 'prepatch:campaign' },
      ],
    },
    {
      id: 'featured_dungeons_2026_11_14', kind: 'now', from: '2026-11-14', to: '2026-11-20', bonus: 'featured_dungeons',
      art: ['banner', 'featured_dungeons'], artHorde: ['banner', 'featured_dungeons_h'],
      title: 'Featured Dungeons',
      text: [
        'A new set: one old dungeon for every level range. Speed and no-wipe rewards pay ×1.5 there, and your first clear of one this week pays a bonus.',
      ],
      steps: [
        { text: 'Clear a featured dungeon this week', check: ['featured_dungeon', 1], go: 'lfg:dungeon' },
      ],
    },
    {
      id: 'account_bank', kind: 'new', from: '2026-11-14', to: '2026-11-20',
      art: ['banner', 'account_bank'], artHorde: ['banner', 'account_bank_h'],
      title: 'The Account Bank',
      text: [
        'A tab on every bank that all your characters share: 12 slots, and 3 more tabs for Mentor Marks.',
        'Bags and banks got filter tabs, Store materials, Buy back and materials bags too.',
      ],
      steps: [
        { text: 'Put an item in the Account bank: any bank, the Account tab', check: ['abank', 1] },
        { text: "Get a materials bag: Tailoring makes them, and they're on the auction house now and then", check: ['mat_bag'] },
        { text: 'Buy an Account bank tab (200 Mentor Marks)', check: ['abank_tab'] },
      ],
    },
    {
      id: 'seasons_finest_2026_11_14', kind: 'new', from: '2026-11-14', to: '2026-11-20',
      art: ['banner', 'raid_tidecrown_citadel'], artHorde: ['banner', 'raid_tidecrown_citadel_h'],
      title: "Season's Finest begins",
      text: [
        'The best piece for each slot of your class and role this season: Best from the newest raid and from older raids and dungeons, Next best from old raids and dungeons.',
        'Find every Best piece of a role without a Hint or Reveal for its title: the Tideward, the Tidemender or the Tidebreaker. Pathfinder counts each class role you finish blind. Hero → Journey → Season’s Finest.',
      ],
      steps: [
        { text: 'Find a piece of Season’s Finest', check: ['finest', 1], go: 'finest' },
      ],
    },
    {
      id: 'faire_soon_2026_11_14', kind: 'soon', from: '2026-11-14', to: '2026-11-20', at: '2026-11-21',
      art: ['banner', 'faire'],
      title: 'The Faire',
      text: [
        "A week of games at every inn: Liar's dice against the realm's players, with tickets, prizes and new looks.",
      ],
      steps: [],
    },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
