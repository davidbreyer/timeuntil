# Time Until

A personal countdown board for the moments you are looking forward to.

- Live countdowns in days, hours, minutes, and seconds
- Automatic **Time since** counting when a countdown reaches its target date
- Multiple named events with editable dates, times, and accent colors
- A focus view for the selected countdown
- A separate black-and-white Clock screen with local 24-hour time and a ring of 60 second dots
- Automatic saving in local browser storage
- Import and export JSON backups, with imports merging into existing countdowns
- Responsive layouts and keyboard-accessible dialogs

## Run locally

This is a static website. No dependency installation or build step is needed.

From the repository directory, run:

```sh
python -m http.server 5173 --directory dist
```

Open [localhost:5173](http://localhost:5173).

## Source

- `dist/index.html`: page structure and forms
- `dist/styles.css`: visual theme and responsive layout
- `dist/app.js`: countdowns, event management, and browser persistence
- `dist/clock.html`, `dist/clock.css`, `dist/clock.js`: the separate Clock screen
- `.openai/hosting.json`: the existing Sites deployment configuration

Dates and times are entered in the browser's local time zone and saved as absolute instants. Events are stored under `timeuntil.events.v1` in `localStorage`, independently for each browser and website origin. There is no account, backend database, or cross-device sync.

At the target instant, a countdown switches to **Time since** and counts upward from zero. Past dates immediately show elapsed time, including on event cards and in focus view. The original date stays saved, so refreshing or importing a backup restores the correct elapsed time.

Open **Clock** in the header to see the current local time as `HH:MM`. At the start of each minute all 60 dots are white; one dot turns black each second, clockwise from the top. The dots reset when the minute changes. Use **Countdowns** or Escape to return to the board.

## Publishing

The public GitHub Pages site is [www.davidbreyer.com/timeuntil](https://www.davidbreyer.com/timeuntil/). GitHub Pages inherits the existing account domain; the default [davidbreyer.github.io/timeuntil](https://davidbreyer.github.io/timeuntil/) address redirects there.

The workflow in `.github/workflows/pages.yml` publishes `dist/` automatically when website files change on `main`. It can also be run manually from the repository's Actions tab. GitHub Pages uses GitHub Actions as its publishing source; no build or additional secrets are needed.

Each publication stamps a release version such as `v20261012-1442` using Eastern time and a 24-hour clock. The footer and all stylesheet/script URLs share that version, with asset URLs using `?v=v20261012-1442`. Before publishing elsewhere, run `node scripts/stamp-version.cjs`.

Use **Export** to download a JSON backup, then **Import** on another browser or either hosted copy. Names, target instants, colors, and the selected countdown are included. Imports keep existing countdowns, skip duplicates by ID or matching name and target instant, and reject invalid backups without changing saved data.

The original Sites deployment remains available at [Time Until](https://time-until-moments.cicadaarmada.chatgpt.site). Each site origin has its own locally saved countdowns.
