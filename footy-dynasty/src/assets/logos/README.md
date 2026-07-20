# Club logos (bring-your-own)

Drop image files in this folder named by **club id** and they automatically
replace the procedural crest everywhere in the game (squad lists, match day,
schedule, draft room, ladders...). Supported: `.svg` `.png` `.jpg` `.webp`.

```
src/assets/logos/
  col.png                → Collingwood
  ric.svg                → Richmond
  vfl_werribee.png       → Werribee (VFL)
  sanfl_glenelg.png      → Glenelg (SANFL)
```

Club ids are the `id` fields in `src/data/pyramid.js` — AFL clubs use short
ids (`ade, bri, car, col, ess, fre, gee, gcs, gws, haw, mel, nor, pad, ric,
stk, syd, tas, wce, wbd`); state/community clubs are prefixed by league
(`vfl_*, sanfl_*, wafl_*, qafl_*, ntfl_*, tsl_*, ...`).

Nothing needs registering — the build picks up whatever is here. If no file
exists for a club, its procedural crest renders as before.

**⚠️ Trademark note:** official club logos are registered trademarks. Adding
them here is fine for a personal build on your own devices, but do not commit
them to the repo or ship them on a public deployment without a licence.
