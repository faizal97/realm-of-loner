# Player guides: write, send, review (#231)

The guide site (`/guide/`) has the official class guides (`guides/<class>.md`, `by: official`). Players can write their
own: they write and preview on the site, send it for review, and an approved guide is added to `guides/` and goes live
with the next release.

## Write page (`#write`)
- Class, title, the author name shown on the guide ("Guide by …"), and the text in the guide format (`## Role` tabs,
  `### ` headings, `- ` and `1. ` lists, `**bold**`, `[[links]]`).
- Toolbar: role tab, heading, list, bold, and "Link a game thing" (searches the database, inserts `[[kind/id|Name]]`).
- Live preview with the real guide renderer: tabs, icons, hover and tap cards. A link that finds nothing, or more than
  one page, is marked in the preview and listed above the Send button; Send is off until there are none.
- The draft is kept in this browser (localStorage), so nothing is lost on closing the tab.
- Send needs Google sign-in, the same sign-in as Friends (same Firebase app name, so a player signed in to Friends on
  the web is already signed in here).

## Storage (Firestore `guides_in/{uid}`)
- One open submission per account: sending again replaces it. Fields: `cls`, `title`, `by` (≤ 32), `text`
  (≤ 20,000), `at`, `status` (`new` | `approved` | `declined` | `published`), `note` (≤ 300, the reason for a decline).
- Rules (`firebase/firestore.rules`, tested in `firebase/rules.test.js`):
  - the author creates and replaces their own while it is `new` or `declined` (a replacement is `new` again);
  - the author reads their own (to see its status); the reviewer reads all;
  - only the reviewer changes `status` and `note`;
  - anyone reads an `approved` one (it is about to be public), so the inbox tool needs no sign-in.
- The reviewer is one account id in the rules (`REVIEWER`). Rules are pasted into the Firebase console by hand, as for
  Friends; the console must equal the repo file.

## Review page (`#review`, the reviewer only)
- Each new submission rendered as it would look, with Approve and Decline (a short reason the author sees).

## Publishing (`node tools/guide_inbox.js`)
- Reads the approved submissions (no sign-in), writes `guides/<cls>-<slug>.md` with `by:`, `written:` and `checked:`
  the latest release, and runs the guide build (link check). Claude checks the claims against the game data and reports
  any problem before a pull request. The merged pull request is the record; the guide ships with the next release.
  Then the reviewer marks it `published` on the review page.

## Not in this
- Editing a published guide (a new submission replaces the file through the same review).
- Comments, ratings, more than one open submission per account.

## Privacy
- `web/privacy.html` gets a line: a guide submission stores the account id, the author name entered and the guide text,
  and the name and text become public once the guide is approved.
