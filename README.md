# Time Until

A personal countdown board for the moments you are looking forward to.

- Live countdowns in days, hours, minutes, and seconds
- Multiple named events with editable dates, times, and accent colors
- A focus view for the selected countdown
- Automatic saving in local browser storage
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
- `.openai/hosting.json`: the existing Sites deployment configuration

Dates and times are entered in the browser's local time zone and saved as absolute instants. Events are stored under `timeuntil.events.v1` in `localStorage`, independently for each browser and website origin. There is no account, backend database, or cross-device sync.

Serve `dist/` with any static web host. The current Sites deployment is [Time Until](https://time-until-moments.cicadaarmada.chatgpt.site).
