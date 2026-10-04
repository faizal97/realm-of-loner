<!-- Thanks for helping! PRs are welcome, but one may be closed if the same work is already planned or done. Thank you either way. -->

**What and why**


Fixes #

**How it was tested**
- [ ] `node tools/validate.js` passes
- [ ] `python3 build.py` passes (it runs the lore and IP checks)
- Sims or gates run:
- UI change: a screenshot at 375 px wide

**Checklist**
- [ ] Old saves still load (migrate, never break)
- [ ] No names from other games (`node tools/ipcheck.js`)
- [ ] No spoilers below their level (`node tools/lorekeeper.js`)
- [ ] Only the files this change needs
