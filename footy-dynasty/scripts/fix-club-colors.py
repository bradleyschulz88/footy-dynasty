#!/usr/bin/env python3
"""
Patch club colours in pyramid.js.

Usage:  python3 scripts/fix-club-colors.py [--dry-run]

CORRECTIONS maps club id → [primary, secondary, tertiary] hex strings.
Only entries that differ from the current value are changed.
"""

import re, sys, os

# ─────────────────────────────────────────────────────────────────────────────
# CORRECTIONS — real guernsey colours sourced from official club / league sites
# Organised by league for readability.
# ─────────────────────────────────────────────────────────────────────────────
CORRECTIONS = {

    # ── NTFL ─────────────────────────────────────────────────────────────────
    # Darwin Buffaloes     – navy blue and gold
    "ntfl_darwin_buffaloes":      ["#002B5C", "#FFD200", "#FFFFFF"],
    # Nightcliff Tigers    – orange and black
    "ntfl_nightcliff":            ["#FF6600", "#000000", "#FFFFFF"],
    # PINT Bushrangers     – green, gold, black
    "ntfl_pint":                  ["#006633", "#FFD200", "#000000"],
    # Palmerston Magpies   – black and white
    "ntfl_palmerston_magpies":    ["#000000", "#FFFFFF", "#000000"],
    # Southern Districts   – red, white, blue
    "ntfl_southern_districts":    ["#CC2031", "#FFFFFF", "#003087"],
    # St Mary's Saints     – red and white
    "ntfl_st_mary_s":             ["#CC2031", "#FFFFFF", "#CC2031"],
    # Tiwi Bombers         – red, black, gold (Essendon-esque)
    "ntfl_tiwi_bombers":          ["#CC2031", "#000000", "#FFD200"],
    # Wanderers            – green and gold
    "ntfl_wanderers":             ["#006633", "#FFD200", "#FFFFFF"],
    # Waratah Warriors     – purple and gold
    "ntfl_waratah":               ["#660066", "#FFD200", "#FFFFFF"],

    # ── QAFL ─────────────────────────────────────────────────────────────────
    # Aspley Hornets       – blue and gold
    "qafl_aspley":                ["#003F87", "#FFD200", "#FFFFFF"],
    # Broadbeach Cats      – blue and white
    "qafl_broadbeach":            ["#003366", "#FFFFFF", "#FFD200"],
    # Coorparoo Kings      – royal blue and gold (new 2025 club)
    "qafl_coorparoo":             ["#002B5C", "#FFD200", "#FFFFFF"],
    # Labrador Tigers      – blue and gold
    "qafl_labrador":              ["#003F87", "#FFD200", "#FFFFFF"],
    # Maroochydore Roos    – blue and red
    "qafl_maroochydore":          ["#003366", "#CC2031", "#FFFFFF"],
    # Morningside Panthers – maroon and white
    "qafl_morningside":           ["#7B1D41", "#FFFFFF", "#7B1D41"],
    # Mt Gravatt Hawks     – maroon and gold
    "qafl_mt_gravatt":            ["#7B1D41", "#FFD200", "#FFFFFF"],
    # Noosa Tigers         – blue and gold
    "qafl_noosa_tigers":          ["#003F87", "#FFD200", "#FFFFFF"],
    # Palm Beach Currumbin – blue and gold
    "qafl_palm_beach_currumbin":  ["#003F87", "#FFD200", "#FFFFFF"],
    # Redland-Victoria Point Sharks – blue, red, white
    "qafl_redland_victoria_point":["#003F87", "#FFFFFF", "#CC2031"],
    # Sherwood Magpies     – black and white
    "qafl_sherwood_magpies":      ["#000000", "#FFFFFF", "#000000"],
    # Surfers Paradise Demons – red and navy (Melbourne-style)
    "qafl_surfers_paradise":      ["#CC2031", "#002B5C", "#FFFFFF"],
    # Wilston Grange Gorillas – blue and red
    "qafl_wilston_grange":        ["#003087", "#CC2031", "#FFFFFF"],

    # ── SANFL ────────────────────────────────────────────────────────────────
    # Adelaide (SANFL Crows affiliate) – navy, red, gold
    "sanfl_adelaide":             ["#002B5C", "#E21937", "#FFD200"],
    # Central District Bulldogs – navy and red
    "sanfl_central_district":     ["#002B5C", "#CC2031", "#FFFFFF"],
    # Glenelg Tigers       – black and gold
    "sanfl_glenelg":              ["#000000", "#FFD200", "#000000"],
    # North Adelaide Roosters – red and white
    "sanfl_north_adelaide":       ["#CC2031", "#FFFFFF", "#CC2031"],
    # Norwood Redlegs      – red and royal blue
    "sanfl_norwood":              ["#CC2031", "#003087", "#FFFFFF"],
    # Port Adelaide Magpies (SANFL) – black and white (not teal like AFL club)
    "sanfl_port_adelaide":        ["#000000", "#FFFFFF", "#000000"],
    # South Adelaide Panthers – navy and gold
    "sanfl_south_adelaide":       ["#002B5C", "#FFD200", "#FFFFFF"],
    # Sturt Double Blues   – two blues (royal and dark)
    "sanfl_sturt":                ["#003087", "#0099CC", "#FFFFFF"],
    # West Adelaide Bloods – red and navy
    "sanfl_west_adelaide":        ["#CC2031", "#002B5C", "#FFFFFF"],
    # Woodville-West Torrens Eagles – royal blue and gold
    "sanfl_woodville_west_torre": ["#003087", "#FFD200", "#FFFFFF"],

    # ── TSL (Tasmania) ───────────────────────────────────────────────────────
    # Clarence Roos        – royal blue, white, red  (current is correct)
    # "tsl_clarence":          ["#0033A0", "#FFFFFF", "#CC2031"],
    # Glenorchy Magpies    – black and white
    "tsl_glenorchy":              ["#000000", "#FFFFFF", "#000000"],
    # Kingborough Tigers   – brown and gold (Hawthorn-esque)
    "tsl_kingborough_tigers":     ["#4D2004", "#FFD200", "#FFFFFF"],
    # Lauderdale Bombers   – red, black, gold (Essendon-esque)
    "tsl_lauderdale":             ["#CC2031", "#000000", "#FFD200"],
    # Launceston Blues     – royal blue and white
    "tsl_launceston":             ["#003087", "#FFFFFF", "#003087"],
    # North Hobart Demons  – red and navy
    "tsl_north_hobart":           ["#CC2031", "#002B5C", "#FFFFFF"],
    # North Launceston     – red and black
    "tsl_north_launceston":       ["#CC2031", "#000000", "#FFFFFF"],

    # ── VFL ──────────────────────────────────────────────────────────────────
    # Box Hill Hawks       – brown and gold (Hawthorn affiliate)  — ALREADY CORRECT
    # Brisbane Lions VFL   – maroon, navy, gold                   — ALREADY CORRECT
    # Carlton VFL          – navy and white                        — ALREADY CORRECT
    # Casey Demons         – navy and red (Melbourne affiliate)    — ALREADY CORRECT
    # Coburg Lions         – royal blue and gold
    "vfl_coburg_lions":           ["#003087", "#FFD200", "#000000"],
    # Collingwood VFL      – black and white                       — ALREADY CORRECT
    # Essendon VFL         – red and black                         — ALREADY CORRECT
    # Footscray VFL        – blue, red, white                      — ALREADY CORRECT
    # Frankston Dolphins   – red, black, white
    "vfl_frankston":              ["#CC2031", "#000000", "#FFFFFF"],
    # Geelong VFL          – navy and white                        — ALREADY CORRECT
    # Gold Coast Suns VFL  – red and gold                          — ALREADY CORRECT
    # GWS Giants VFL       – orange and black                      — ALREADY CORRECT
    # North Melbourne VFL  – blue and white                        — ALREADY CORRECT
    # Northern Bullants    – navy, red, white (Carlton affiliate)  — ALREADY CORRECT
    # Port Melbourne Borough – red and navy
    "vfl_port_melbourne":         ["#CC2031", "#002B5C", "#FFFFFF"],
    # Richmond VFL         – gold and black                        — ALREADY CORRECT
    # Sandringham Zebras   – black, white, red (St Kilda affiliate)
    "vfl_sandringham":            ["#000000", "#FFFFFF", "#ED1B2F"],
    # Southport Sharks     – navy and gold                         — ALREADY CORRECT
    # St Kilda VFL         – red, black, white                     — ALREADY CORRECT
    # Sydney Swans VFL     – red and white                         — ALREADY CORRECT
    # Tasmania Devils VFL  – red and black                         — ALREADY CORRECT
    # Werribee Tigers      – purple and gold                       — ALREADY CORRECT
    # Williamstown Seagulls – red and white                        — ALREADY CORRECT

    # ── NFNL ─────────────────────────────────────────────────────────────────
    # Ivanhoe Eagles       – red and white (confirmed)
    "nfnl_ivanhoe":               ["#CC2224", "#FFFFFF", "#CC2224"],
    # Montmorency Magpies  – black and white
    "nfnl_montmorency":           ["#000000", "#FFFFFF", "#000000"],
    # Northcote Park Reds  – red and white
    "nfnl_northcote_park":        ["#CC2031", "#FFFFFF", "#CC2031"],
    # Heidelberg Warriors  – royal blue and red
    "nfnl_heidelberg":            ["#003087", "#CC2031", "#FFFFFF"],

    # ── EFNL ─────────────────────────────────────────────────────────────────
    # All Hawks clubs — brown and gold (Hawthorn tradition)
    "efnl_blackburn":             ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_boronia":               ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_belgrave":              ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_doncaster":             ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_montrose":              ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_knox":                  ["#4D2004", "#FBBF15", "#FFFFFF"],
    "efnl_donvale":               ["#4D2004", "#FBBF15", "#FFFFFF"],
    # Bombers — red and black (Essendon tradition)
    "efnl_bulleen_templestowe":   ["#CC2031", "#000000", "#FFD200"],
    # Eagles — navy and gold
    "efnl_berwick":               ["#002B5C", "#FFD200", "#FFFFFF"],
    "efnl_east_burwood":          ["#002B5C", "#FFD200", "#FFFFFF"],

    # ── EDFL ─────────────────────────────────────────────────────────────────
    # Essendon Doutta Stars – red and black (Essendon-affiliated)
    "edfl_essendon_doutta_star":  ["#CC2031", "#000000", "#CC2031"],
    # Aberfeldie – navy blue and white
    "edfl_aberfeldie":            ["#002B5C", "#FFFFFF", "#FFD200"],

    # ── SFNL ─────────────────────────────────────────────────────────────────
    # East Brighton Vampires – red and black
    "sfnl_east_brighton":         ["#CC2031", "#000000", "#FFFFFF"],
    # Moorabbin Kangaroos – navy and gold
    "sfnl_moorabbin_kangaroos":   ["#003087", "#FFD200", "#FFFFFF"],
    # Port Melbourne Colts – red and navy
    "sfnl_port_melbourne_colts":  ["#CC2031", "#002B5C", "#FFFFFF"],

    # ── MPFNL ────────────────────────────────────────────────────────────────
    # Hastings Blues – blue and white
    "mpfnl_hastings":             ["#003087", "#FFFFFF", "#003087"],
    # Mt Eliza Redbacks – red and white
    "mpfnl_mt_eliza":             ["#CC2031", "#FFFFFF", "#CC2031"],
    # Frankston Bombers – red and black
    "mpfnl_frankston_bombers":    ["#CC2031", "#000000", "#FFD200"],
    # Langwarrin Kangaroos – navy and gold
    "mpfnl_langwarrin":           ["#003087", "#FFD200", "#FFFFFF"],

    # ── OuterEastFNL ─────────────────────────────────────────────────────────
    # Belgrave Hawks – brown and gold
    "outereastfnl_belgrave":      ["#4D2004", "#FBBF15", "#FFFFFF"],

    # ── VAFA ─────────────────────────────────────────────────────────────────
    # University Blues – royal blue and gold (Melbourne University)
    "vafa_university_blues":      ["#003087", "#FFD200", "#FFFFFF"],
    # University Blacks – black and gold (Melbourne University)
    "vafa_university_blacks":     ["#000000", "#FFD200", "#FFFFFF"],
    # Old Scotch – royal blue and white (Scotch College Melbourne)
    "vafa_old_scotch":            ["#003087", "#FFFFFF", "#003087"],

    # ── AFL Canberra ──────────────────────────────────────────────────────────
    # Ainslie Tricolours – blue, white, red (the name says it all)
    "aflcanberra_ainslie":                ["#0033A0", "#FFFFFF", "#CC2031"],
    # Belconnen Magpies – black and white
    "aflcanberra_belconnen_magpies":      ["#000000", "#FFFFFF", "#000000"],
    # Queanbeyan Tigers – yellow and black
    "aflcanberra_queanbeyan_tigers":      ["#FFD200", "#000000", "#FFD200"],
    # Goulburn City Swans – red and white
    "aflcanberra_goulburn_city_swans":    ["#CC2031", "#FFFFFF", "#CC2031"],
    # Woden Blues – navy and white
    "aflcanberra_woden_blues":            ["#003087", "#FFFFFF", "#003087"],
    # ANU – gold and black (Australian National University colors)
    "aflcanberra_anu":                    ["#FFD200", "#000000", "#FFFFFF"],
    # Tuggeranong Valley Eagles – red and navy
    "aflcanberra_tuggeranong_valley":     ["#CC2031", "#003087", "#FFFFFF"],

    # ── AFL Sydney ────────────────────────────────────────────────────────────
    # Inner West Magpies – black and white
    "aflsyd_inner_west_magpies":          ["#000000", "#FFFFFF", "#000000"],
    # Sydney University – black and gold (the "Blacks")
    "aflsyd_sydney_university":           ["#000000", "#FFD200", "#000000"],
    # East Coast Eagles – navy and gold
    "aflsyd_east_coast_eagles":           ["#002B5C", "#FFD200", "#FFFFFF"],
    # UTS (University of Technology Sydney) – blue and red
    "aflsyd_uts":                         ["#003087", "#CC2031", "#FFFFFF"],
    # St George – red and white
    "aflsyd_st_george":                   ["#CC2031", "#FFFFFF", "#CC2031"],
    # Macquarie University – maroon and gold
    "aflsyd_macquarie_university":        ["#7B1D41", "#FFD200", "#FFFFFF"],
    # North Shore Bombers – red and black
    "aflsyd_north_shore":                 ["#CC2031", "#000000", "#FFFFFF"],

    # ── AFLHCC ───────────────────────────────────────────────────────────────
    # Cardiff Hawks – brown and gold
    "aflhcc_cardiff_hawks":               ["#4D2004", "#FBBF15", "#FFFFFF"],
    # Gosford Tigers – yellow and black
    "aflhcc_gosford_tigers":              ["#FFD200", "#000000", "#FFD200"],
    # Nelson Bay Marlins – teal and white
    "aflhcc_nelson_bay_marlins":          ["#008B8B", "#FFFFFF", "#000000"],
    # Wallsend West Newcastle – maroon (city club)
    # Newcastle City – navy and gold
    "aflhcc_newcastle_city":              ["#002B5C", "#FFD200", "#FFFFFF"],

    # ── Adelaide FL ───────────────────────────────────────────────────────────
    # Rostrevor OC – maroon and gold (Rostrevor College)
    "adelfl_rostrevor_oc":               ["#7B1D41", "#FFD200", "#FFFFFF"],
    # Sacred Heart OC – green and white (Sacred Heart College)
    "adelfl_sacred_heart_oc":            ["#006633", "#FFFFFF", "#006633"],
    # St Peters OC – red and white (St Peters College)
    "adelfl_st_peters_oc":               ["#CC2031", "#FFFFFF", "#CC2031"],
    # Goodwood Saints – red, white, black
    "adelfl_goodwood_saints":            ["#CC2031", "#FFFFFF", "#000000"],
    # Adelaide University – navy and gold (Uni of Adelaide)
    "adelfl_adelaide_university":        ["#002B5C", "#FFD200", "#FFFFFF"],
    # Prince Alfred OC – navy and gold (PAC colors)
    "adelfl_prince_alfred_oc":           ["#002B5C", "#FFD200", "#FFFFFF"],
    # Scotch OC – navy and white (Scotch College Adelaide)
    "adelfl_scotch_oc":                  ["#002B5C", "#FFFFFF", "#FFD200"],
    # Flinders University – navy and gold (FU colors)
    "adelfl_flinders_university":        ["#002B5C", "#FFD200", "#FFFFFF"],

    # ── Perth Football League ─────────────────────────────────────────────────
    # East Fremantle (PFL) – dark blue and white (same as WAFL)
    "perthfootballleague_east_fremant":  ["#002B5C", "#FFFFFF", "#002B5C"],
    # University of WA – royal blue and gold
    "perthfootballleague_university":    ["#003087", "#FFD200", "#FFFFFF"],
    # Warnbro Swans – red and white (already correct but verify)
    # "perthfootballleague_warnbro_swans": already red/white ✓

    # ── WAFL ─────────────────────────────────────────────────────────────────
    # Claremont Tigers     – gold and black (gold guernsey, black trim)
    "wafl_claremont":             ["#FFD200", "#000000", "#FFFFFF"],
    # East Fremantle Sharks – dark blue and white
    "wafl_east_fremantle":        ["#002B5C", "#FFFFFF", "#002B5C"],
    # East Perth Eagles    – scarlet and gold
    "wafl_east_perth":            ["#CC2031", "#FFD200", "#FFFFFF"],
    # Peel Thunder         – navy, gold, white
    "wafl_peel_thunder":          ["#002B5C", "#FFD200", "#FFFFFF"],
    # Perth Demons         – red and navy
    "wafl_perth":                 ["#CC2031", "#002B5C", "#FFFFFF"],
    # South Fremantle Bulldogs – red and navy
    "wafl_south_fremantle":       ["#CC2031", "#002B5C", "#FFFFFF"],
    # Subiaco Lions        – cobalt blue and white
    "wafl_subiaco":               ["#003087", "#FFFFFF", "#003087"],
    # Swan Districts Swans – black and white
    "wafl_swan_districts":        ["#000000", "#FFFFFF", "#000000"],
    # West Coast Eagles (WAFL) – blue and gold (same as AFL club)
    "wafl_west_coast_eagles":     ["#003087", "#F2A900", "#003087"],
    # West Perth Falcons   – royal blue and gold
    "wafl_west_perth":            ["#003087", "#FFD200", "#FFFFFF"],

}

# ─────────────────────────────────────────────────────────────────────────────

def parse_and_patch(path: str, dry_run: bool = False):
    with open(path) as f:
        src = f.read()

    changed = 0
    skipped = 0

    for club_id, new_colors in CORRECTIONS.items():
        color_str = ", ".join(f'"{c}"' for c in new_colors)
        # Match the full colors array for this specific club id
        pattern = (
            r'(id:\s*"' + re.escape(club_id) + r'"[^}]*?colors:\s*)\[([^\]]*)\]'
        )
        def replacer(m, cs=color_str):
            old = m.group(2).strip()
            new_str = m.group(1) + f"[{cs}]"
            return new_str

        new_src, n = re.subn(pattern, replacer, src, flags=re.DOTALL)
        if n == 0:
            print(f"  WARN: id '{club_id}' not found in file")
            skipped += 1
        elif new_src == src:
            skipped += 1  # no change needed
        else:
            src = new_src
            changed += 1

    if not dry_run:
        with open(path, "w") as f:
            f.write(src)

    print(f"\n{'DRY RUN — ' if dry_run else ''}Done. {changed} clubs updated, {skipped} already correct / not found.")
    return changed


if __name__ == "__main__":
    dry = "--dry-run" in sys.argv
    target = os.path.join(os.path.dirname(__file__), "..", "src", "data", "pyramid.js")
    target = os.path.normpath(target)
    print(f"Target: {target}")
    parse_and_patch(target, dry_run=dry)
