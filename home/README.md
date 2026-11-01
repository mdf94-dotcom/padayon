# Daily Practice

One home for daily practice: Padayon (Bisaya), Word Hoard (vocabulary), Brick by Brick Chess, and a Hevy workout check.

- `index.html`: the Today page and the bottom tabs. Each app opens in its own frame and stays loaded when you switch tabs.
- `words/`: Word Hoard.
- `chess/`: Brick by Brick Chess.
- Padayon lives in its own repo and is served at `/padayon/` on the same site, so all four share one sign-in and one set of saved progress.
- `shared/cloud.js`: Google sign-in and sync through Padayon's Firebase project. One Firestore document per person; each app writes only its own field.
- The Hevy API key is entered on the Today page and stays in that browser.
