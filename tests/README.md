# Padayon checks
Run from the repo root: `node tests/run_all.js`, or one script, e.g. `node tests/02_sim.js 60`.
They need Playwright with Chromium. Everything runs against a local copy with a fake in-memory Firebase (fake users only); anything else leaving localhost is blocked, and Discord calls are answered locally and only counted.

- 01_ui: real clicks through every screen at 390×844, 320×568, 1280×800; layout problems are listed as notes; screenshots in tests/shots
- 02_sim: simulated learners over 35+ days
- 03_grading: every exercise type, typed boxes, "I don't know", misses coming back, choices
- 04_audio: the clip matches the card; late audio never plays over the next question
- 05_content: every card; full lists in tests/content-report.json
- 06_sync: streaks, time zones, two devices, leaderboard, announcements, old saved data
- 07_pwa: offline and service worker updates
- 08_perf: start time, session build, hot helpers
- 11_newq: the newer kinds of questions (reply, hear the difference, fill the gap, picture, Tell me about you, Retell it faster, Record and compare)
- 12_games: plays Padayon Rush, Province Rush and Language Rush all the way through (picking and typing), map practice, Numbers, Conversations, every Story and Real Bisaya
