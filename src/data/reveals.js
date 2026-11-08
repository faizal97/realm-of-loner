// The bible's Reveals table (docs/lore/canon.md): a term a player may not read below its level, as [regex, level]. The
// game's own screens use it through G.nameable (#54: the same rule the news follows, #18); tools/lorekeeper.js fails the
// build if this list and the bible ever differ, so edit the bible and copy the row here.
(function (root) {
  const D = root.D;
  D.REVEALS = [
    ["Veshmira", 60],
    ["(master|creditor).{0,40}\\bdragon|\\bdragon.{0,40}(master|creditor)", 60],
    ["Vale.{0,60}Kethriax|Kethriax.{0,60}Vale", 60],
    ["Hale.{0,40}(alive|in chains|prisoner|cell)", 40],
    ["Hale.{0,40}(free|escaped|walks out)", 60],
    ["Sael'anor|Aeldran|Nal'veshra|Deepmother|Stormveil|Tidecrown|Wavebreaker|Shal'zua|Vessaria", 60],
    ["Marrow", 45],
    ["Lyveus|\\bLyv\\b|Cloveus", 37],
    ["Unmoored", 61],
    ["oldest debt|blood debt|debt of blood", 61],
    ["(Ledger|Veshmira|Brood).{0,60}Ossarak|Ossarak.{0,60}(Ledger|Veshmira|Brood)", 61],
  ];
})(typeof window !== 'undefined' ? window : globalThis);
