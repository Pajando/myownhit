# My Own Hit / Mi Propio Hit

Custom-song site. English at `index.html`, Spanish at `es.html`.
Static files, no build step. Made by Ojeda Works.

## Add a demo song
1. Drop the MP3 into `demos/` (example: `demos/rosa-birthday.mp3`).
2. Open `assets/demos.js`, find an entry, change `file: null` to `file: "demos/rosa-birthday.mp3"`.
3. Edit the title and note (English + Spanish). `label` is the name printed on the spinning record.
Entries left as `file: null` show "Coming soon".

## Where form answers go
Both forms (song questionnaire + demo email signup) post to FormSubmit,
which emails alejandro@ojedaworks.com. The endpoint must be activated once
(FormSubmit sends an "Activate" email on the first submission).

## Files
- `assets/record.js`: the 3D record (Three.js 0.160 from jsDelivr)
- `assets/site.js`: player, questionnaire, email signup
- `assets/site.css`: all styles
