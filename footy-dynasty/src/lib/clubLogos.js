// Optional real club logos — bring-your-own.
//
// The repo ships NO official club artwork: real AFL/state-league marks are
// registered trademarks and this app is publicly deployed. Instead, any image
// dropped into src/assets/logos/ named <clubId>.<ext> (e.g. col.png,
// ric.svg, vfl_werribee.png) is picked up at build time and replaces the
// procedural crest everywhere ClubBadge renders. See the README in that
// folder for club ids and the IP note.
const files = import.meta.glob('../assets/logos/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const CLUB_LOGO_URLS = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split('/').pop().replace(/\.(svg|png|jpe?g|webp)$/i, '').toLowerCase(),
    url,
  ])
);

/** URL for a club's real logo if one has been added, else null. */
export function clubLogoUrl(clubId) {
  return CLUB_LOGO_URLS[String(clubId || '').toLowerCase()] ?? null;
}
