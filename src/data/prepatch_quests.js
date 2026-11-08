// The pre-patch campaign, "The Notes Come Due" (#509 Accord, #510 Krugar), and the ten class quests that teach the
// pre-patch abilities (#512–#521). Endgame only: every quest here is locked until G.prepatchOpen() (#508: The Drowned
// Crown finished or a level-60 raid cleared). Story in docs/lore/canon.md; nothing here may name Chapter 1's secrets
// (the lorekeeper holds them at 61). Rewards are horizontal: gold, a title, the abilities.
(function (root) {
  const D = root.D;

  // ---- people
  Object.assign(D.NPCS, {
    regent_carrow: { name: 'Lord Regent Edmund Carrow', title: 'Regent of Kingsmere' },
    meriel_thorne: { name: 'Lady Meriel Thorne', title: 'Prisoner of Kingsmere Gaol' },
    high_chief_grask: { name: 'High Chief Grask', title: 'Krugar' },
    class_tutor: { name: 'Tutor Ione Calder', title: 'Teacher of Every Class' },
  });
  const put = (place, npc) => { const p = D.PLACES[place]; if (p && !p.npcs.includes(npc)) p.npcs.push(npc); };
  put('stormwind_gate', 'regent_carrow'); put('stormwind_gate', 'meriel_thorne');
  put('orgrimmar', 'high_chief_grask'); put('rumhook_bay', 'class_tutor');

  // ---- things
  D.item('unsigned_note', { name: 'Unsigned Debt Note', slot: 'quest', q: 1, icon: 'journal' });
  D.item('thornes_book', { name: "Thorne's Own Book", slot: 'quest', q: 1, icon: 'journal' });
  D.item('courier_satchel', { name: "Courier's Satchel", slot: 'quest', q: 1, icon: 'journal' });
  const qd = (mob, item, p) => { const M = D.MOBS[mob]; M.qdrops = (M.qdrops || []).concat([[item, p]]); };
  qd('ledger_collector', 'unsigned_note', 0.6); qd('ledger_collector', 'courier_satchel', 0.3); qd('brood_dragonspawn', 'thornes_book', 0.25);

  const Q = (id, q, faction) => { D.QUESTS[id] = Object.assign({ lvl: 60, prepatch: true, main: true, arc: 'The Notes Come Due' }, q, faction ? { faction } : {}); };
  const notes = { type: 'collect', item: 'unsigned_note', n: 5 }, collectors = (n) => ({ type: 'kill', mob: 'ledger_collector', n });

  // ---- the Accord
  Q('pp_a_notes', { name: 'Signed by No One', giver: 'commander_ashby', turnin: 'commander_ashby',
    text: 'Veshmira is dead, and the notes keep coming. My patrols take them off Ledger collectors all along this coast, and the ink is still warm. Not one of them is signed. Bring me 5.',
    objs: [notes], reward: { money: 6000 } }, 'alliance');
  Q('pp_a_hand', { name: "The Ledger's Hand", giver: 'commander_ashby', turnin: 'regent_carrow', pre: ['pp_a_notes'],
    text: 'Nobody in Harborwatch can read the Ledger\'s hand. Every note names Coronation Day, and that is all we can make out. Take them to the Regent in Kingsmere.',
    objs: [{ type: 'visit', place: 'stormwind_gate' }], reward: { money: 4000 } }, 'alliance');
  Q('pp_a_gaol', { name: 'The Prisoner', giver: 'regent_carrow', turnin: 'meriel_thorne', pre: ['pp_a_hand'],
    text: 'My clerks cannot read them either. There is one person in this city who can, and I put her in Kingsmere Gaol. I will have her brought up. Ask her. Do not promise her anything.',
    objs: [{ type: 'visit', place: 'stormwind_gate' }], reward: { money: 4000 } }, 'alliance');
  Q('pp_a_book', { name: 'Her Own Book', giver: 'meriel_thorne', turnin: 'meriel_thorne', pre: ['pp_a_gaol'],
    text: 'I will read them. My price is my own book. I left it in the Dragonmire the night your friends came for her. It is the only thing in that marsh I wrote myself.',
    objs: [{ type: 'collect', item: 'thornes_book', n: 1 }], reward: { money: 6000 } }, 'alliance');
  Q('pp_a_read', { name: 'Read Aloud', giver: 'meriel_thorne', turnin: 'regent_carrow', pre: ['pp_a_book'],
    text: 'Every one falls due on Coronation Day. They are not drawn on her; they are drawn on the vault in Cinderpeak Spire. The book has a new keeper. Its collectors are serving these now, all over the kingdom. Stop 8 of them, and tell the Regent what I said.',
    objs: [collectors(8)], reward: { money: 6000 } }, 'alliance');
  Q('pp_a_crown', { name: 'Coronation Day', giver: 'regent_carrow', turnin: 'regent_carrow', pre: ['pp_a_read'],
    text: 'Tamlin will be crowned. If the kingdom waits on the Ledger\'s pleasure, it is sold already. Read the proclamation in the Market Ward, then come back to me.',
    objs: [{ type: 'visit', place: 'stormwind' }], reward: { money: 8000 } }, 'alliance');

  // ---- the Krugar
  Q('pp_h_notes', { name: 'Signed by No One', giver: 'warlord_durnak', turnin: 'warlord_durnak',
    text: 'The dragon is dead, and still her collectors walk the marsh with paper in their packs. The notes have no name on them. The ink is warm. Bring me 5.',
    objs: [notes], reward: { money: 6000 } }, 'horde');
  Q('pp_h_rumhook', { name: 'Warm Coin, Cold Ink', giver: 'warlord_durnak', turnin: 'rh_gorvo', pre: ['pp_h_notes'],
    text: 'These came up the coast on goblin ships. Rumhook Bay. Find out who carries them.',
    objs: [{ type: 'visit', place: 'rumhook_bay' }], reward: { money: 4000 } }, 'horde');
  Q('pp_h_courier', { name: 'The Courier Road', giver: 'rh_gorvo', turnin: 'rh_gorvo', pre: ['pp_h_rumhook'],
    text: 'My ships carry them north. I am paid in warm coin, and I do not read what I carry. Their collectors keep the satchels. Bring me one and we will both read it.',
    objs: [{ type: 'collect', item: 'courier_satchel', n: 1 }], reward: { money: 6000 } }, 'horde');
  Q('pp_h_grask', { name: 'The High Chief', giver: 'rh_gorvo', turnin: 'high_chief_grask', pre: ['pp_h_courier'],
    text: 'The satchel was going to Vazhrak. It has the Krugar\'s name in it. Take it to your High Chief before somebody else does.',
    objs: [{ type: 'visit', place: 'orgrimmar' }], reward: { money: 4000 } }, 'horde');
  Q('pp_h_debt', { name: 'What the Krugar Owe', giver: 'high_chief_grask', turnin: 'high_chief_grask', pre: ['pp_h_grask'],
    text: 'After the war we borrowed too. Every wall in Vazhrak stands on it. These notes fall due the day the humans crown their boy, ours with theirs. We will not be sold with them. Stop 8 of their collectors.',
    objs: [collectors(8)], reward: { money: 6000 } }, 'horde');
  Q('pp_h_crown', { name: 'Coronation Day', giver: 'high_chief_grask', turnin: 'warlord_durnak', pre: ['pp_h_debt'],
    text: 'The Accord will crown its king. Their couriers\' road runs toward Cinderpeak, and the notes will come down it. Go back to Mudwall and tell Durnak to watch it.',
    objs: [{ type: 'visit', place: 'brackenwall_village' }], reward: { money: 8000 } }, 'horde');

  D.TITLES.push({ id: 'notes_due_a', name: '%s, Reader of Notes', need: { quest: 'pp_a_crown' }, how: 'The Notes Come Due (Accord)' });
  D.TITLES.push({ id: 'notes_due_h', name: '%s, Reader of Notes', need: { quest: 'pp_h_crown' }, how: 'The Notes Come Due (Krugar)' });

  // the journal's longer telling, for the first and last of each chain (lore_quests.js)
  Object.assign(D.QUEST_STORY, {
    pp_a_notes: 'We thought the debt died with her. It did not. Every note we take is new, written after she fell, and every one is drawn on the same day. Somebody is still keeping the Ledger\'s books.',
    pp_a_crown: 'The proclamation is nailed up in the Market Ward: Prince Tamlin Aldane will be crowned in Kingsmere. When you come back, the Regent is not at his desk. On it is a note, warm, unsigned, addressed to the King.',
    pp_h_notes: 'The marsh is quiet without her, and the Krugar like quiet. But these collectors do not act like servants of a dead master. They act like men who were paid in advance.',
    pp_h_crown: 'Grask does not raise his voice. He has seen this before: the humans borrow, the humans fall, and the Krugar are standing next to them when they do. This time he wants to see who is holding the pen.',
  });

  // ---- the class quests: the Tutor in Rumhook Bay (neutral, both factions) teaches each class its pre-patch ability
  const CQ = {
    warrior: 'A warrior who only guards himself is half a warrior. I will teach you Intervene: you take the hit meant for a friend. Show me you can stand in front of something. Stop 6 Ledger collectors.',
    mage: 'Every mage wants to turn back time. I can teach you eight seconds of it: Chronomark. Set the mark, then go back to it. Practise on 6 Ledger collectors.',
    priest: 'Your spells can wound or mend. Vow of Atonement makes them do both, at half the strength each. Show me you can choose. Stop 6 Ledger collectors.',
    rogue: 'You need not take the kill yourself. Set Up gives your finisher to whoever strikes next. Learn to share the work. Stop 6 Ledger collectors.',
    paladin: 'One heal, two people. Lantern of Faith lets you look after a second ally while you heal the first. Stop 6 Ledger collectors and keep your party standing.',
    warlock: 'Blood Bargain makes you and your enemy both bleed faster. It is a race. Learn to win it. Stop 6 Ledger collectors.',
    hunter: 'Lure waits for the next enemy to come and holds it while you finish the first. Timing is everything. Stop 6 Ledger collectors.',
    druid: 'Seed of Renewal grows the longer you leave it. A hard enough blow crushes it. Now, or later? Stop 6 Ledger collectors.',
    shaman: 'Kinship Totem shares your party\'s health out evenly: the healthy give to the hurt. Stop 6 Ledger collectors.',
    bard: 'A song for everyone, or twice the song for one friend? Duet lets you choose. Stop 6 Ledger collectors.',
  };
  for (const cls in CQ) {
    const id = D.PREPATCH_ABILITIES[cls], A = D.ABILITIES[id];
    Q(A.learn, { name: A.name, cls, main: false, giver: 'class_tutor', turnin: 'class_tutor', text: CQ[cls], objs: [collectors(6)], reward: { money: 5000 } });
  }
})(typeof window !== 'undefined' ? window : globalThis);
