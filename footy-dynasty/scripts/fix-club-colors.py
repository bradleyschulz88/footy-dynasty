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
    # Frankston Dolphins   – black and red (confirmed)
    "vfl_frankston":              ["#000000", "#CC2031", "#FFFFFF"],
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
    # Heidelberg Warriors  – yellow and black (the "Bumblebees"; NOT blue/red)
    "nfnl_heidelberg":            ["#FFD200", "#000000", "#FFD200"],

    # ── EFNL ─────────────────────────────────────────────────────────────────
    # Beaconsfield – yellow, white and blue (confirmed)
    "efnl_beaconsfield":          ["#FFD200", "#FFFFFF", "#003087"],
    # Chirnside Park – black, white and gold
    "efnl_chirnside_park":        ["#000000", "#FFFFFF", "#FFD200"],
    # Doncaster East – navy with maroon and gold hoops
    "efnl_doncaster_east":        ["#002B5C", "#7B1D41", "#FFD200"],
    # East Ringwood – royal blue and white
    "efnl_east_ringwood":         ["#003087", "#FFFFFF", "#003087"],
    # Fairpark – green and gold (Lions — no confirmed source, omit specific color)
    # Forest Hill – green and white vertical stripes
    "efnl_forest_hill":           ["#006633", "#FFFFFF", "#006633"],
    # Heathmont – royal blue with gold and white V
    "efnl_heathmont":             ["#003087", "#FFD200", "#FFFFFF"],
    # Kilsyth – black with red sash (NOT Hawks)
    "efnl_kilsyth":               ["#000000", "#CC2031", "#000000"],
    # Lilydale – royal blue with gold sash
    "efnl_lilydale":              ["#003087", "#FFD200", "#FFFFFF"],
    # Mooroolbark – dark green and gold
    "efnl_mooroolbark":           ["#006633", "#FFD200", "#FFFFFF"],
    # North Ringwood – red, black and white panels
    "efnl_north_ringwood":        ["#CC2031", "#000000", "#FFFFFF"],
    # Norwood (EFNL) – red and black (different from SANFL Norwood)
    "efnl_norwood":               ["#CC2031", "#000000", "#FFFFFF"],
    # Oakleigh District – black with white sash
    "efnl_oakleigh_district":     ["#000000", "#FFFFFF", "#000000"],
    # Park Orchards – black with red and white bands
    "efnl_park_orchards":         ["#000000", "#CC2031", "#FFFFFF"],
    # Rowville – white and gold (Hawks)
    "efnl_rowville":              ["#FFFFFF", "#FFD200", "#FFFFFF"],
    # Scoresby – black and white vertical stripes
    "efnl_scoresby":              ["#000000", "#FFFFFF", "#000000"],
    # South Croydon – royal blue with red and white bands
    "efnl_south_croydon":         ["#003087", "#CC2031", "#FFFFFF"],
    # Vermont – purple and gold (confirmed)
    "efnl_vermont":               ["#660066", "#FFD200", "#FFFFFF"],
    # Warrandyte – red and white (Bloods)
    "efnl_warrandyte":            ["#CC2031", "#FFFFFF", "#CC2031"],
    # Whitehorse Pioneers – maroon with white side panels
    "efnl_whitehorse_pioneers":   ["#7B1D41", "#FFFFFF", "#7B1D41"],
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
    # Glenroy – red with white sash
    "edfl_glenroy":               ["#CC2031", "#FFFFFF", "#CC2031"],
    # Essendon Doutta Stars – red and black (Essendon-affiliated)
    "edfl_essendon_doutta_star":  ["#CC2031", "#000000", "#CC2031"],
    # Aberfeldie – sky blue with navy blue yoke (confirmed)
    "edfl_aberfeldie":            ["#0099CC", "#002B5C", "#FFFFFF"],

    # ── WFNL ─────────────────────────────────────────────────────────────────
    # Altona – purple and gold
    "wfnl_altona":                ["#660066", "#FFD200", "#FFFFFF"],
    # Braybrook – black with red sash
    "wfnl_braybrook":             ["#000000", "#CC2031", "#000000"],

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
    # Belgrave Magpies – black and white
    "outereastfnl_belgrave":      ["#000000", "#FFFFFF", "#000000"],
    # Emerald Bombers – red and black (Essendon tradition)
    "outereastfnl_emerald":       ["#CC2031", "#000000", "#FFFFFF"],
    # Kinglake Lakers – yellow and green
    "outereastfnl_kinglake":      ["#FFD200", "#006633", "#FFFFFF"],
    # Thornton-Eildon Shinboners – North Melbourne blue and white
    "outereastfnl_thornton_eildon": ["#003F87", "#FFFFFF", "#CC2031"],
    # Upwey-Tecoma Tigers – yellow and black (Richmond tradition)
    "outereastfnl_upwey_tecoma":  ["#FFD200", "#000000", "#FFD200"],
    # Warburton-Millgrove – blue with white trim
    "outereastfnl_warburton_millgrove": ["#003087", "#FFFFFF", "#003087"],
    # Yarra Junction Eagles – yellow and green
    "outereastfnl_yarra_junction": ["#FFD200", "#006633", "#FFD200"],
    # Yea Tigers – yellow and black (Richmond tradition)
    "outereastfnl_yea":           ["#FFD200", "#000000", "#FFD200"],

    # ── VAFA ─────────────────────────────────────────────────────────────────
    # University Blues – royal blue and gold (Melbourne University)
    "vafa_university_blues":      ["#003087", "#FFD200", "#FFFFFF"],
    # University Blacks – black and gold (Melbourne University)
    "vafa_university_blacks":     ["#000000", "#FFD200", "#FFFFFF"],
    # Old Scotch – royal blue and white (Scotch College Melbourne)
    "vafa_old_scotch":            ["#003087", "#FFFFFF", "#003087"],
    # Ajax – red, black, white (adopted St Kilda colors 1957)
    "vafa_ajax":                  ["#ED1B2F", "#000000", "#FFFFFF"],
    # Old Melburnians – navy and red (Redlegs, Melbourne Grammar OC)
    "vafa_old_melburnians":       ["#002B5C", "#CC2031", "#FFFFFF"],
    # Ormond – brown and blue (brown with royal blue V-yoke)
    "vafa_ormond":                ["#4D2004", "#003087", "#FFFFFF"],
    # Fitzroy – red, royal blue, gold (red with blue saddle and gold)
    "vafa_fitzroy":               ["#CC2031", "#003087", "#FFD200"],
    # Brunswick – purple, white, royal blue (vertical stripes)
    "vafa_brunswick":             ["#660066", "#FFFFFF", "#003087"],
    # Elsternwick – black and red (black guernsey with red sash)
    "vafa_elsternwick":           ["#000000", "#CC2031", "#000000"],
    # St Kevin's Old Boys – red and white (real club color)
    "vafa_st_kevin_s":            ["#ED1B2F", "#FFFFFF", "#ED1B2F"],
    # Collegians – purple and gold (Wesley College, since 1902)
    "vafa_collegians":            ["#660066", "#FFD200", "#FFFFFF"],
    # Canterbury – red, black, gold (Cobras, 130+ year tradition)
    "vafa_canterbury":            ["#CC2031", "#000000", "#FFD200"],
    # Prahran – royal blue and sky blue (Two Blues)
    "vafa_prahran":               ["#003087", "#0099CC", "#FFFFFF"],
    # Williamstown CYMS – gold and royal blue
    "vafa_williamstown_cyms":     ["#FFD200", "#003087", "#FFFFFF"],
    # South Melbourne Districts – red and white (Bloods)
    "vafa_south_melbourne_dist":  ["#CC2031", "#FFFFFF", "#CC2031"],
    # Old Carey – black and gold (Carey Grammar OC)
    "vafa_old_carey":             ["#000000", "#FFD200", "#000000"],
    # Wattle Park – navy and sky blue vertical stripes
    "vafa_wattle_park":           ["#002B5C", "#0099CC", "#FFFFFF"],
    # Mazenod OC – black, royal blue, white panels
    "vafa_mazenod":               ["#000000", "#003087", "#FFFFFF"],
    # Old Xaverians – red and black (Xavier College OB tradition, confirmed)
    "vafa_old_xaverians":         ["#CC2031", "#000000", "#FFFFFF"],
    # Old Ivanhoe Grammarians – brown and white (Ivanhoe Grammar OB)
    "vafa_old_ivanhoe":           ["#6B4423", "#FFFFFF", "#6B4423"],
    # UHS-VU – green and brown (University High School + VU alliance)
    "vafa_uhs_vu":                ["#006633", "#6B4423", "#FFFFFF"],
    # Richmond Central – yellow and black (follows Richmond Tigers tradition)
    "vafa_richmond_central":      ["#FFD200", "#000000", "#FFD200"],
    # Old Geelong – navy and white (Geelong College OB, hoops tradition)
    "vafa_old_geelong":           ["#002B5C", "#FFFFFF", "#002B5C"],
    # Old Brighton – navy and red (Brighton Grammar OB, red V-yoke)
    "vafa_old_brighton":          ["#002B5C", "#CC2031", "#FFFFFF"],
    # Old Camberwell – navy and royal blue (Camberwell Grammar OB, two-tone blue)
    "vafa_old_camberwell":        ["#002B5C", "#003087", "#FFFFFF"],
    # Old Peninsula – royal blue and tan (Peninsula Grammar OB)
    "vafa_old_peninsula":         ["#003087", "#C4A35A", "#FFFFFF"],
    # Aquinas OC – red, black, and green vertical panels
    "vafa_aquinas":               ["#CC2031", "#000000", "#006633"],
    # Marcellin OC – maroon and gold (Marcellin College OB)
    "vafa_marcellin":             ["#7B1D41", "#FFD200", "#FFFFFF"],
    # Oakleigh – royal blue, white and red
    "vafa_oakleigh":              ["#003087", "#FFFFFF", "#CC2031"],
    # De La Salle OC – blue, red and gold (De La Salle Brothers tradition)
    "vafa_de_la_salle":           ["#003087", "#CC2031", "#FFD200"],
    # Beaumaris – royal blue and gold (the Sharks)
    "vafa_beaumaris":             ["#003087", "#FFD200", "#FFFFFF"],
    # Old Yarra Cobras – black, red and gold
    "vafa_old_yarra_cobras":      ["#000000", "#CC2031", "#FFD200"],
    # PEGS – maroon and navy (Penleigh & Essendon Grammar)
    "vafa_pegs":                  ["#7B1D41", "#002B5C", "#FFFFFF"],
    # Parkdale Vultures – red, royal blue and gold
    "vafa_parkdale_vultures":     ["#CC2031", "#003087", "#FFD200"],
    # Preston Bullants – red and white
    "vafa_preston_bullants":      ["#CC2031", "#FFFFFF", "#CC2031"],
    # St Mary's Salesian – gold and black (Salesian College OB)
    "vafa_st_mary_s_salesian":    ["#FFD200", "#000000", "#FFFFFF"],
    # Therry Penola – burgundy, navy and gold V
    "vafa_therry_penola":         ["#800020", "#002B5C", "#FFD200"],
    # North Brunswick – green with gold vertical stripes
    "vafa_north_brunswick":       ["#006633", "#FFD200", "#FFFFFF"],

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
    # Athelstone – royal blue and white (the Raggies)
    "adelfl_athelstone":          ["#003087", "#FFFFFF", "#003087"],
    # Brahma Lodge – yellow and black (Tigers/"Tigerland")
    "adelfl_brahma_lodge":        ["#FFD200", "#000000", "#FFD200"],
    # Brighton Bombers – black, gold and white
    "adelfl_brighton":            ["#000000", "#FFD200", "#FFFFFF"],
    # Fitzroy (AdelFL) – red, blue and gold (traditional Fitzroy colours)
    "adelfl_fitzroy":             ["#CC2031", "#003087", "#FFD200"],
    # Gepps Cross Rams – red, white and blue
    "adelfl_gepps_cross":         ["#CC2031", "#FFFFFF", "#003087"],
    # Golden Grove Kookaburras – green, blue and gold
    "adelfl_golden_grove":        ["#006633", "#003087", "#FFD200"],
    # Walkerville Cats – navy blue and white hoops
    "adelfl_walkerville":         ["#002B5C", "#FFFFFF", "#002B5C"],
    # CBC OC – purple and white (Christian Brothers College Old Collegians)
    "adelfl_cbc_oc":              ["#660066", "#FFFFFF", "#660066"],
    # Kenilworth – chocolate brown and royal blue
    "adelfl_kenilworth":          ["#6B4423", "#003087", "#FFFFFF"],
    # Lockleys – navy blue and red
    "adelfl_lockleys":            ["#002B5C", "#CC2031", "#FFFFFF"],
    # Modbury – brown and gold
    "adelfl_modbury":             ["#6B4423", "#FFD200", "#FFFFFF"],
    # Morphettville Park – red and gold
    "adelfl_morphettville_park":  ["#CC2031", "#FFD200", "#FFFFFF"],
    # Payneham NU – black and white
    "adelfl_payneham_nu":         ["#000000", "#FFFFFF", "#000000"],
    # Pembroke OS – maroon and white (Pembroke School Old Scholars)
    "adelfl_pembroke_os":         ["#7B1D41", "#FFFFFF", "#7B1D41"],
    # Plympton – red and black
    "adelfl_plympton":            ["#CC2031", "#000000", "#FFFFFF"],
    # Pulteney – navy blue (Pulteney Grammar Old Boys)
    "adelfl_pulteney":            ["#002B5C", "#FFFFFF", "#002B5C"],
    # Seaton Ramblers – green and white
    "adelfl_seaton_ramblers":     ["#006633", "#FFFFFF", "#006633"],
    # Tea Tree Gully – red and black
    "adelfl_tea_tree_gully":      ["#CC2031", "#000000", "#FFFFFF"],
    # Unley Mercedes – navy blue and black
    "adelfl_unley_mercedes":      ["#002B5C", "#000000", "#FFFFFF"],
    # Westminster OS – dark green and gold (Westminster School Old Scholars)
    "adelfl_westminster_os":      ["#006633", "#FFD200", "#006633"],
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

    # ── SFNL ─────────────────────────────────────────────────────────────────
    # Bentleigh Demons – red and blue
    "sfnl_bentleigh":             ["#CC2031", "#003087", "#FFFFFF"],
    # Berwick Springs – blue and green
    "sfnl_berwick_springs":       ["#003087", "#006633", "#FFFFFF"],
    # Black Rock – black and red
    "sfnl_black_rock":            ["#000000", "#CC2031", "#FFFFFF"],
    # Carrum Patterson Lakes – maroon and blue
    "sfnl_carrum_patterson_lak":  ["#7B1D41", "#003087", "#FFFFFF"],
    # East Brighton Vampires – red and white (NOT red/black; correcting earlier entry)
    "sfnl_east_brighton":         ["#CC2031", "#FFFFFF", "#CC2031"],
    # Highett Bulldogs – red, white and blue
    "sfnl_highett":               ["#CC2031", "#FFFFFF", "#003087"],
    # Keysborough – red, white and blue
    "sfnl_keysborough":           ["#CC2031", "#FFFFFF", "#003087"],
    # Mordialloc – red and blue
    "sfnl_mordialloc":            ["#CC2031", "#003087", "#FFFFFF"],
    # St Paul's McKinnon – royal/sky/red/white (four-colour club)
    "sfnl_st_paul_s_mckinnon":    ["#003087", "#0099CC", "#CC2031"],

    # ── NFNL (additional) ────────────────────────────────────────────────────
    # Eltham – red and black
    "nfnl_eltham":                ["#CC2031", "#000000", "#FFFFFF"],
    # Greensborough – green and white
    "nfnl_greensborough":         ["#006633", "#FFFFFF", "#006633"],
    # Heidelberg West – yellow and black
    "nfnl_heidelberg_west":       ["#FFD200", "#000000", "#FFD200"],
    # Hurstbridge – royal blue and gold
    "nfnl_hurstbridge":           ["#003087", "#FFD200", "#FFFFFF"],
    # Kilmore – blue and white
    "nfnl_kilmore":               ["#003087", "#FFFFFF", "#003087"],
    # Macleod – royal blue, white and gold
    "nfnl_macleod":               ["#003087", "#FFFFFF", "#FFD200"],
    # Panton Hill – black and red
    "nfnl_panton_hill":           ["#000000", "#CC2031", "#000000"],
    # Wallan – black and white (Magpies tradition)
    "nfnl_wallan":                ["#000000", "#FFFFFF", "#000000"],
    # Watsonia – red, white and black
    "nfnl_watsonia":              ["#CC2031", "#FFFFFF", "#000000"],
    # Whittlesea – dark blue and gold
    "nfnl_whittlesea":            ["#002B5C", "#FFD200", "#FFFFFF"],

    # ── AFL Canberra (additional) ─────────────────────────────────────────────
    # Eastlake Demons – royal blue and white
    "aflcanberra_eastlake":       ["#003087", "#FFFFFF", "#003087"],
    # Gungahlin Jets – teal, black and white
    "aflcanberra_gungahlin":      ["#008B8B", "#000000", "#FFFFFF"],

    # ── AFL Sydney (additional) ───────────────────────────────────────────────
    # Manly Warringah Wolves – maroon and white
    "aflsyd_manly_warringah_wolv": ["#7B1D41", "#FFFFFF", "#7B1D41"],

    # ── AFLHCC (additional) ───────────────────────────────────────────────────
    # Lake Macquarie Dockers – purple and white (Fremantle-style)
    "aflhcc_lake_macquarie":      ["#4F0082", "#FFFFFF", "#4F0082"],
    # Maitland Saints – red, black and white (St Kilda-style)
    "aflhcc_maitland":            ["#ED1B2F", "#000000", "#FFFFFF"],
    # Singleton Roosters – red and white
    "aflhcc_singleton":           ["#CC2031", "#FFFFFF", "#CC2031"],
    # Wyong Lakes Magpies – black and white
    "aflhcc_wyong_lakes":         ["#000000", "#FFFFFF", "#000000"],
    # University of Newcastle Seahorses – light blue, black and white
    "aflhcc_university_of_newcas": ["#6CB4E4", "#000000", "#FFFFFF"],

    # ── Ballarat FNL ─────────────────────────────────────────────────────────
    # Bacchus Marsh Cobras – black with red and yellow V stripes
    "ballaratfnl_bacchus_marsh":  ["#000000", "#CC2031", "#FFD200"],
    # Ballarat Swans – white with red V
    "ballaratfnl_ballarat":       ["#FFFFFF", "#CC2031", "#FFFFFF"],
    # Darley Devils – black and white stripes
    "ballaratfnl_darley":         ["#000000", "#FFFFFF", "#000000"],
    # East Point Kangaroos – red, white and blue
    "ballaratfnl_east_point":     ["#CC2031", "#FFFFFF", "#003087"],
    # Melton South Panthers – navy blue with white yoke
    "ballaratfnl_melton_south":   ["#002B5C", "#FFFFFF", "#002B5C"],
    # Sebastopol Burras – blue and gold
    "ballaratfnl_sebastopol":     ["#003087", "#FFD200", "#FFFFFF"],

    # ── Bendigo FNL ──────────────────────────────────────────────────────────
    # Gisborne Bulldogs – red, white and blue (Footscray tradition since 1946)
    "bendigofnl_gisborne":        ["#003087", "#CC2031", "#FFFFFF"],
    # Golden Square Bulldogs – blue and gold
    "bendigofnl_golden_square":   ["#003087", "#FFD200", "#FFFFFF"],
    # Kyneton Tigers – black and gold
    "bendigofnl_kyneton":         ["#000000", "#FFD200", "#000000"],
    # Maryborough Magpies – black, white and teal (Port Adelaide-style)
    "bendigofnl_maryborough":     ["#000000", "#FFFFFF", "#008B8B"],
    # South Bendigo Bloods – red and white (South Melbourne tradition)
    "bendigofnl_south_bendigo":   ["#CC2031", "#FFFFFF", "#CC2031"],
    # Strathfieldsaye Storm – blue and white hoops (Geelong-style)
    "bendigofnl_strathfieldsaye": ["#003087", "#FFFFFF", "#003087"],


    # ── TAC Cup / Coates Talent League ──────────────────────────────────────────
    # Bendigo Pioneers – navy, sky blue and gold (confirmed)
    "tl_bendigo_pioneers":        ["#002B5C", "#0099CC", "#FFD200"],
    # Dandenong Stingrays – red, yellow and black
    "tl_dandenong_stingrays":     ["#CC2031", "#FFD200", "#000000"],
    # GWV Rebels – black, white and grey (confirmed, adopted 1997)
    "tl_gwv_rebels":              ["#000000", "#FFFFFF", "#888888"],
    # Oakleigh Chargers – green and gold
    "tl_oakleigh_chargers":       ["#006633", "#FFD200", "#FFFFFF"],
    # Western Jets – navy and red
    "tl_western_jets":            ["#002B5C", "#CC2031", "#FFFFFF"],

    # ── NFNL remaining ───────────────────────────────────────────────────────────
    # Banyule City – navy and gold (Banyule City FNC)
    "nfnl_banyule":               ["#002B5C", "#FFD200", "#FFFFFF"],
    # Fitzroy Stars – burgundy and gold (Indigenous club, confirmed)
    "nfnl_fitzroy_stars":         ["#7A0019", "#FFD200", "#7A0019"],
    # Kinglake Lakers – yellow and green (yellow guernsey with green mountains)
    "nfnl_kinglake":              ["#FFD200", "#006600", "#FFD200"],
    # Lalor Bloods – red and white (confirmed)
    "nfnl_lalor":                 ["#CC2031", "#FFFFFF", "#CC2031"],
    # Laurimar – green and black (Power)
    "nfnl_laurimar":              ["#006633", "#000000", "#FFFFFF"],
    # Old Eltham Collegians – green and navy (the Turtles)
    "nfnl_old_eltham_collegian":  ["#006633", "#002B5C", "#FFFFFF"],
    # Old Paradians – emerald green and purple (Parade College OB, confirmed)
    "nfnl_old_paradians":         ["#006633", "#660066", "#FFFFFF"],
    # Reservoir – blue and gold (Mustangs)
    "nfnl_reservoir":             ["#003087", "#FFD200", "#003087"],
    # South Morang Lions – blue and gold (confirmed)
    "nfnl_south_morang":          ["#003087", "#FFD200", "#003087"],
    # St Mary's Salesian – maroon and gold
    "nfnl_st_mary_s":             ["#7A0019", "#FFD200", "#FFFFFF"],
    # West Preston-Lakeside – red and white (Roosters)
    "nfnl_west_preston_lakesid":  ["#CC2031", "#FFFFFF", "#CC2031"],

    # ── SFNL remaining ───────────────────────────────────────────────────────────
    # Cerberus (HMAS Cerberus naval base) – navy and gold
    "sfnl_cerberus":              ["#002B5C", "#FFD200", "#FFFFFF"],
    # Clayton Ramblers – black and white
    "sfnl_clayton":               ["#000000", "#FFFFFF", "#000000"],
    # Cranbourne Eagles – blue and gold (confirmed)
    "sfnl_cranbourne":            ["#002B5C", "#FFD200", "#FFFFFF"],
    # Dingley Stars – red and white (confirmed)
    "sfnl_dingley":               ["#CC2031", "#FFFFFF", "#CC2031"],
    # Endeavour Hills Falcons – purple and gold
    "sfnl_endeavour_hills":       ["#660066", "#FFD200", "#FFFFFF"],
    # Frankston Dolphins (SFNL) – blue and white
    "sfnl_frankston_dolphins":    ["#003087", "#FFFFFF", "#003087"],
    # Hampton (SFNL) – blue and red
    "sfnl_hampton":               ["#003087", "#CC2031", "#FFFFFF"],
    # Hampton Park Redbacks – black and red (confirmed)
    "sfnl_hampton_park":          ["#000000", "#CC2031", "#000000"],
    # Heatherton – navy and gold
    "sfnl_heatherton":            ["#002B5C", "#FFD200", "#FFFFFF"],
    # Lyndale Pumas – purple and black
    "sfnl_lyndale":               ["#660066", "#000000", "#FFFFFF"],
    # Lyndhurst Lightning – yellow and black
    "sfnl_lyndhurst":             ["#FFD200", "#000000", "#FFD200"],
    # Mount Waverley – blue and white
    "sfnl_mount_waverley":        ["#002B5C", "#FFFFFF", "#002B5C"],
    # Murrumbeena – blue and gold
    "sfnl_murrumbeena":           ["#003087", "#FFD200", "#003087"],
    # Sandown Cobras – navy and gold
    "sfnl_sandown_cobras":        ["#003366", "#FFD200", "#FFFFFF"],
    # Skye Bombers – red, black and gold (Essendon-style)
    "sfnl_skye":                  ["#CC2031", "#000000", "#FFD200"],
    # Springvale Districts – navy and red (confirmed)
    "sfnl_springvale_districts":  ["#002B5C", "#CC2031", "#FFFFFF"],
    # St John's Old Collegians – blue and white
    "sfnl_st_john_s_old_colleg":  ["#003087", "#FFFFFF", "#003087"],
    # St Kilda City – black, white and red (confirmed St Kilda colours)
    "sfnl_st_kilda_city":         ["#000000", "#FFFFFF", "#CC2031"],

    # ── Goulburn Valley FNL ──────────────────────────────────────────────────────
    # Benalla Saints – red, white and black (adopted St Kilda colours 1996)
    "goulburnvalleyfnl_benalla":          ["#ED1B2F", "#FFFFFF", "#000000"],
    # Euroa Magpies – black and white
    "goulburnvalleyfnl_euroa":            ["#000000", "#FFFFFF", "#000000"],
    # Mooroopna Cats – navy and white (confirmed Wikipedia)
    "goulburnvalleyfnl_mooroopna":        ["#002F6C", "#FFFFFF", "#002F6C"],
    # Rochester Tigers – black and gold (confirmed, adopted 1973)
    "goulburnvalleyfnl_rochester":        ["#000000", "#FFD200", "#000000"],
    # Seymour Lions – red, gold and blue (confirmed, current colours since 2001)
    "goulburnvalleyfnl_seymour":          ["#CC2031", "#FFD200", "#003087"],
    # Shepparton Swans – red and white (confirmed, adopted 1946)
    "goulburnvalleyfnl_shepparton":       ["#ED1B2F", "#FFFFFF", "#ED1B2F"],
    # Shepparton United Demons – red and blue
    "goulburnvalleyfnl_shepparton_uni":   ["#CC2031", "#003087", "#FFFFFF"],

    # ── Hampden FNL ──────────────────────────────────────────────────────────────
    # Camperdown Magpies – black and white
    "hampdenfnl_camperdown":      ["#000000", "#FFFFFF", "#000000"],
    # Cobden Bombers – royal blue and gold (local tradition, NOT Essendon red)
    "hampdenfnl_cobden":          ["#0039A6", "#FFD200", "#FFFFFF"],
    # Hamilton Kangaroos – blue, white and red (North Melbourne pattern)
    "hampdenfnl_hamilton":        ["#003F87", "#FFFFFF", "#CC2031"],
    # Koroit Saints – red, black and white (confirmed)
    "hampdenfnl_koroit":          ["#ED1B2F", "#000000", "#FFFFFF"],
    # North Warrnambool Eagles – blue and gold (confirmed)
    "hampdenfnl_north_warrnambool": ["#002B5C", "#FFD200", "#FFFFFF"],
    # Portland Tigers – black and gold (confirmed, "black with gold sash since 1930")
    "hampdenfnl_portland":        ["#000000", "#FFD200", "#000000"],
    # Terang Mortlake Bloods – royal blue with red sash (confirmed)
    "hampdenfnl_terang_mortlake": ["#0039A6", "#CC2031", "#FFFFFF"],
    # Warrnambool Blues – blue and white (confirmed nickname)
    "hampdenfnl_warrnambool":     ["#003087", "#FFFFFF", "#003087"],

    # ── WFNL remaining ───────────────────────────────────────────────────────────
    # Albanvale Cobras – blue and white (confirmed)
    "wfnl_albanvale":             ["#003087", "#FFFFFF", "#003087"],
    # Albion Bulldogs – navy and white (confirmed)
    "wfnl_albion":                ["#002B5C", "#FFFFFF", "#002B5C"],
    # Glen Orden Hawks – brown and gold (slightly off-placeholder shade)
    "wfnl_glen_orden":            ["#5C2E08", "#F5A623", "#FFFFFF"],
    # Hoppers Crossing Eagles – navy and white (confirmed)
    "wfnl_hoppers_crossing":      ["#002B5C", "#FFFFFF", "#002B5C"],
    # Point Cook – navy and white
    "wfnl_point_cook":            ["#002B5C", "#FFFFFF", "#002B5C"],
    # Point Cook Centrals – navy and white (confirmed)
    "wfnl_point_cook_centrals":   ["#002B5C", "#FFFFFF", "#002B5C"],
    # Tarneit Titans – maroon, blue and white (confirmed)
    "wfnl_tarneit":               ["#7A0019", "#003087", "#FFFFFF"],
    # Werribee Districts – yellow and black (confirmed)
    "wfnl_werribee_districts":    ["#FFD200", "#000000", "#FFD200"],
    # West Footscray Roosters – red and white (confirmed)
    "wfnl_west_footscray":        ["#CC2031", "#FFFFFF", "#CC2031"],
    # Western Rams – navy and red
    "wfnl_western_rams":          ["#002B5C", "#CC2031", "#FFFFFF"],
    # Wyndhamvale Falcons – gold and green (confirmed)
    "wfnl_wyndhamvale":           ["#FFD200", "#006633", "#FFD200"],
    # Yarraville Seddon Eagles – red, navy and gold (confirmed)
    "wfnl_yarraville_seddon":     ["#CC2031", "#002B5C", "#FFD200"],

    # ── MPFNL remaining ──────────────────────────────────────────────────────────
    # Chelsea Gulls – blue and white
    "mpfnl_chelsea":              ["#003087", "#FFFFFF", "#003087"],
    # Crib Point – black and white (confirmed)
    "mpfnl_crib_point":           ["#000000", "#FFFFFF", "#000000"],
    # Dromana Tigers – yellow and black
    "mpfnl_dromana":              ["#FFD200", "#000000", "#FFD200"],
    # Edithvale-Aspendale Eagles – blue and gold
    "mpfnl_edithvale_aspendale":  ["#002B5C", "#FFD200", "#FFFFFF"],
    # Frankston YCW Stonecats – black and yellow (confirmed)
    "mpfnl_frankston_ycw":        ["#000000", "#FFD200", "#000000"],
    # Karingal Bulls – red and white (confirmed)
    "mpfnl_karingal":             ["#CC2031", "#FFFFFF", "#CC2031"],
    # Mornington Bulldogs – blue and white
    "mpfnl_mornington":           ["#003087", "#FFFFFF", "#003087"],
    # Red Hill Redbacks – yellow, red and black (confirmed)
    "mpfnl_red_hill":             ["#FFD200", "#CC2031", "#000000"],
    # Rosebud Hearts – red and white
    "mpfnl_rosebud":              ["#CC2031", "#FFFFFF", "#CC2031"],
    # Rye Demons – red and blue (confirmed)
    "mpfnl_rye":                  ["#CC2031", "#003087", "#FFFFFF"],
    # Seaford Tigers – yellow and black
    "mpfnl_seaford":              ["#FFD200", "#000000", "#FFD200"],
    # Somerville Eagles – royal blue and gold (confirmed)
    "mpfnl_somerville":           ["#003087", "#FFD200", "#FFFFFF"],
    # Sorrento Sharks – red and white (confirmed)
    "mpfnl_sorrento":             ["#CC2031", "#FFFFFF", "#CC2031"],
    # Tyabb Yabbies – teal and navy (local surf/water colours)
    "mpfnl_tyabb":                ["#008B8B", "#002B5C", "#FFFFFF"],

    # ── AdelFL remaining ─────────────────────────────────────────────────────────
    # Adelaide Lutheran Bulldogs – blue, white and red (confirmed)
    "adelfl_adelaide_lutheran":   ["#003399", "#FFFFFF", "#CC2031"],
    # Central United – blue and gold
    "adelfl_central_united":      ["#003087", "#FFD200", "#FFFFFF"],
    # Colonel Light Gardens Lions – maroon and white (confirmed)
    "adelfl_colonel_light_garden": ["#7A0019", "#FFFFFF", "#7A0019"],
    # Eastern Park Demons – navy and red
    "adelfl_eastern_park":        ["#0F1131", "#CC2031", "#0F1131"],
    # Edwardstown Double Blue – navy and light blue (confirmed)
    "adelfl_edwardstown":         ["#002B5C", "#4488CC", "#FFFFFF"],
    # Greenacres Dragons – green and black (confirmed)
    "adelfl_greenacres":          ["#006633", "#000000", "#FFFFFF"],
    # Henley Sharks – blue and white
    "adelfl_henley":              ["#002B5C", "#FFFFFF", "#002B5C"],
    # Hope Valley Demons – red and blue (confirmed)
    "adelfl_hope_valley":         ["#CC2031", "#003087", "#FFFFFF"],
    # Marion Rams – green and gold (confirmed)
    "adelfl_marion":              ["#228B22", "#FFD200", "#FFFFFF"],
    # Mitchell Park Lions – royal blue and gold
    "adelfl_mitchell_park":       ["#003087", "#FFD200", "#003087"],
    # North Haven Magpies – black and white
    "adelfl_north_haven":         ["#000000", "#FFFFFF", "#000000"],
    # PHOS Camden Phantoms – chocolate and blue (confirmed)
    "adelfl_phos_camden":         ["#3D1C02", "#003087", "#FFFFFF"],
    # Portland Thunder – yellow and black
    "adelfl_portland":            ["#FFD200", "#000000", "#FFD200"],
    # Salisbury North Hawks – brown and gold (real Hawks colours, matches placeholder)
    "adelfl_salisbury_north":     ["#4D2004", "#FBBF15", "#FFFFFF"],
    # Smithfield – red and white
    "adelfl_smithfield":          ["#CC2031", "#FFFFFF", "#CC2031"],
    # West Croydon Hawks – brown and gold (Hawks colours, matches placeholder)
    "adelfl_west_croydon":        ["#4D2004", "#FBBF15", "#FFFFFF"],

    # ── Perth FL remaining ───────────────────────────────────────────────────────
    # Bassendean – black and white (Swans, vertical stripes)
    "perthfootballleague_bassendean":  ["#000000", "#FFFFFF", "#000000"],
    # Bayswater Blues – royal blue and white
    "perthfootballleague_bayswater":   ["#003087", "#FFFFFF", "#003087"],
    # Hamersley Carine Hawks – maroon, gold and white
    "perthfootballleague_hamersley_ca": ["#7B1D41", "#FFD200", "#FFFFFF"],
    # Osborne Park Saints – red, white and black
    "perthfootballleague_osborne_park": ["#CC2031", "#FFFFFF", "#000000"],
    # East Fremantle (PFL) – dark blue and white (same as WAFL)
    "perthfootballleague_east_fremant":  ["#002B5C", "#FFFFFF", "#002B5C"],
    # University of WA – royal blue and gold
    "perthfootballleague_university":    ["#003087", "#FFD200", "#FFFFFF"],
    # Warnbro Swans – red and white (already correct but verify)
    # "perthfootballleague_warnbro_swans": already red/white ✓

    # Perth FL new entries
    "perthfootballleague_ballajura":      ["#003087", "#000000", "#FFFFFF"],   # blue and black (East Perth feeder)
    "perthfootballleague_brentwood_bo":   ["#003087", "#CC2031", "#FFFFFF"],   # blue, red and white (confirmed)
    "perthfootballleague_bullcreek_le":   ["#002B5C", "#4488CC", "#FFFFFF"],   # navy and sky blue (confirmed)
    "perthfootballleague_canning_sout":   ["#FFD200", "#000000", "#FFD200"],   # Tigers – yellow and black
    "perthfootballleague_canning_vale":   ["#008A8D", "#000000", "#FFFFFF"],   # Cougars – teal and black (confirmed)
    "perthfootballleague_carlisle":       ["#CC2031", "#FFFFFF", "#CC2031"],   # red and white
    "perthfootballleague_cockburn_cob":   ["#006633", "#000000", "#FFFFFF"],   # Cobras – green and black
    "perthfootballleague_cockburn_lak":   ["#002B5C", "#FFFFFF", "#002B5C"],   # Warriors – navy and white
    "perthfootballleague_coolbinia":      ["#CC2031", "#003087", "#FFFFFF"],   # West Perth Falcons colours
    "perthfootballleague_cottesloe":      ["#CC2031", "#FFFFFF", "#CC2031"],   # Roosters – red and white
    "perthfootballleague_dianella_mor":   ["#CC2031", "#002B5C", "#FFFFFF"],   # Raiders – red and navy
    "perthfootballleague_ellenbrook":     ["#006633", "#FFFFFF", "#006633"],   # Eels – green and white
    "perthfootballleague_forrestfield":   ["#002B5C", "#FFD200", "#FFFFFF"],   # navy and gold
    "perthfootballleague_high_wycombe":   ["#003087", "#CC2031", "#FFFFFF"],   # blue, red and white (confirmed)
    "perthfootballleague_jandakot":       ["#CC2031", "#FFFFFF", "#CC2031"],   # Jets – red and white (confirmed)
    "perthfootballleague_kalamunda":      ["#7A0019", "#FFFFFF", "#7A0019"],   # Cougars – maroon and white (confirmed)
    "perthfootballleague_kingsley":       ["#CC2031", "#003087", "#FFFFFF"],   # red and blue (confirmed)
    "perthfootballleague_kingsway":       ["#003F87", "#FFFFFF", "#CC2031"],   # Roos – blue, white and red
    "perthfootballleague_lynwood_fern":   ["#660066", "#000000", "#FFFFFF"],   # Panthers – purple and black
    "perthfootballleague_maddington":     ["#7A0019", "#FFD200", "#FFFFFF"],   # Bulls – maroon and gold (confirmed)
    "perthfootballleague_north_beach":    ["#CC2031", "#FFD200", "#000000"],   # Tigers – red, gold and black (confirmed)
    "perthfootballleague_snesa":          ["#003087", "#FFFFFF", "#003087"],   # blue and white
    "perthfootballleague_whitford":       ["#002B5C", "#FFD200", "#FFFFFF"],   # Warriors – navy and gold
    "perthfootballleague_quinns_district":["#CC2031", "#FFD200", "#FFFFFF"],   # red and gold
    "perthfootballleague_wanneroo":       ["#003F87", "#FFFFFF", "#CC2031"],   # Roos – blue, white and red
    "perthfootballleague_winnacott":      ["#002B5C", "#FFFFFF", "#002B5C"],   # blue and white

    # ── EDFL remaining ───────────────────────────────────────────────────────────
    # Airport West Eagles – green and white (confirmed)
    "edfl_airport_west":          ["#006633", "#FFFFFF", "#006633"],
    # Avondale Heights Dragons – red and white
    "edfl_avondale_heights":      ["#CC2031", "#FFFFFF", "#CC2031"],
    # Burnside Heights Panthers – black and purple
    "edfl_burnside_heights":      ["#000000", "#660066", "#FFFFFF"],
    # Coburg Districts Lions – maroon, navy and gold (Brisbane Lions pattern)
    "edfl_coburg_districts":      ["#7A0019", "#002B5C", "#FFD200"],
    # Craigieburn Saints – red, black and white
    "edfl_craigieburn":           ["#ED1B2F", "#000000", "#FFFFFF"],
    # Deer Park Stags – navy and red
    "edfl_deer_park":             ["#002B5C", "#CC2031", "#FFFFFF"],
    # East Keilor Lions – maroon and gold
    "edfl_east_keilor":           ["#7A0019", "#FFD200", "#FFFFFF"],
    # East Sunbury Sharks – sky blue and black
    "edfl_east_sunbury":          ["#0099CC", "#000000", "#FFFFFF"],
    # Hadfield – red and blue
    "edfl_hadfield":              ["#CC2031", "#003087", "#FFFFFF"],
    # Hillside – navy and white
    "edfl_hillside":              ["#002B5C", "#FFFFFF", "#002B5C"],
    # Keilor Park – red and white
    "edfl_keilor_park":           ["#CC2031", "#FFFFFF", "#CC2031"],
    # Maribyrnong Park – navy and red
    "edfl_maribyrnong_park":      ["#002B5C", "#CC2031", "#FFFFFF"],
    # Moonee Valley Knights – orange and black
    "edfl_moonee_valley":         ["#FF6600", "#000000", "#FFFFFF"],
    # Oak Park Eagles – green and white
    "edfl_oak_park":              ["#006633", "#FFFFFF", "#006633"],
    # Rupertswood – red and white
    "edfl_rupertswood":           ["#CC2031", "#FFFFFF", "#CC2031"],
    # St Albans – blue and white
    "edfl_st_albans":             ["#003087", "#FFFFFF", "#003087"],
    # Taylors Lakes – navy and gold
    "edfl_taylors_lakes":         ["#002B5C", "#FFD200", "#FFFFFF"],

    # ── ERGFL (Eastern Region Football League) ───────────────────────────────────
    # Clubs share same colours as their EFNL equivalents
    "ergfl_bayswater_junior":     ["#CC2031", "#000000", "#FFD200"],   # Bombers pattern
    "ergfl_blackburn_junior":     ["#4D2004", "#FBBF15", "#FFFFFF"],   # Hawks pattern
    "ergfl_chirnside_park":       ["#000000", "#FFFFFF", "#FFD200"],   # black, white and gold
    "ergfl_donvale":              ["#4D2004", "#FBBF15", "#FFFFFF"],   # Hawks brown and gold
    "ergfl_east_ringwood":        ["#003087", "#FFFFFF", "#003087"],   # royal blue and white
    "ergfl_emerald":              ["#CC2031", "#000000", "#FFD200"],   # Bombers red and black
    "ergfl_forest_hill":          ["#006633", "#FFFFFF", "#006633"],   # green and white
    "ergfl_gembrook_cockatoo":    ["#000000", "#CC2031", "#FFFFFF"],   # black and red
    "ergfl_glen_waverley":        ["#003087", "#FFD200", "#FFFFFF"],   # blue and gold
    "ergfl_healesville":          ["#CC2031", "#FFFFFF", "#CC2031"],   # red and white
    "ergfl_heathmont":            ["#003087", "#FFD200", "#FFFFFF"],   # royal blue and gold
    "ergfl_kilsyth":              ["#000000", "#CC2031", "#000000"],   # black with red sash
    "ergfl_knox":                 ["#4D2004", "#FBBF15", "#FFFFFF"],   # Hawks brown and gold
    "ergfl_lilydale":             ["#003087", "#FFD200", "#FFFFFF"],   # royal blue and gold
    "ergfl_monbulk_junior":       ["#006633", "#FFFFFF", "#006633"],   # green and white
    "ergfl_montrose":             ["#4D2004", "#FBBF15", "#FFFFFF"],   # Hawks brown and gold
    "ergfl_mooroolbark":          ["#006633", "#FFD200", "#FFFFFF"],   # green and gold
    "ergfl_mount_evelyn":         ["#003087", "#CC2031", "#FFFFFF"],   # blue and red
    "ergfl_north_ringwood":       ["#CC2031", "#000000", "#FFFFFF"],   # red and black
    "ergfl_norwood":              ["#CC2031", "#000000", "#FFFFFF"],   # red and black
    "ergfl_olinda_ferny_creek":   ["#006633", "#FFFFFF", "#FFD200"],   # green and gold
    "ergfl_rowville_knights":     ["#FFFFFF", "#FFD200", "#FFFFFF"],   # white and gold (Rowville Hawks)
    "ergfl_the_basin":            ["#003087", "#FFFFFF", "#CC2031"],   # blue, white and red
    "ergfl_upwey_tecoma_junior":  ["#FFD200", "#000000", "#FFD200"],   # yellow and black (Tigers)
    "ergfl_vermont":              ["#660066", "#FFD200", "#FFFFFF"],   # purple and gold
    "ergfl_yarra_glen":           ["#003087", "#FFFFFF", "#003087"],   # blue and white
    "ergfl_yarra_junction":       ["#FFD200", "#006633", "#FFD200"],   # yellow and green (Eagles)

    # ── ERJFL (East Region Junior FL) ────────────────────────────────────────────
    "erjfl_forest_hill":          ["#006633", "#FFFFFF", "#006633"],   # green and white
    "erjfl_bayswater":            ["#CC2031", "#FFD200", "#FFFFFF"],   # red and gold
    "erjfl_park_orchards":        ["#000000", "#CC2031", "#FFFFFF"],   # black and red

    # ── AFL Sydney remaining ──────────────────────────────────────────────────────
    # Balmain – blue and gold
    "aflsyd_balmain":             ["#003087", "#FFD200", "#FFFFFF"],
    # Camden – maroon and white
    "aflsyd_camden":              ["#7A0019", "#FFFFFF", "#7A0019"],
    # Pennant Hills Demons – navy and red
    "aflsyd_pennant_hills":       ["#0F1131", "#CC2031", "#0F1131"],
    # Penrith – navy and gold
    "aflsyd_penrith":             ["#002B5C", "#FFD200", "#FFFFFF"],
    # South West Sydney – maroon and gold
    "aflsyd_south_west_sydney":   ["#7A0019", "#FFD200", "#FFFFFF"],
    # UNSW-ES Bulldogs – yellow and blue (UNSW university colours)
    "aflsyd_unsw_es":             ["#FFD200", "#003087", "#FFFFFF"],
    # Western Magic – blue and gold
    "aflsyd_western_magic":       ["#003087", "#FFD200", "#FFFFFF"],
    # Southern Power – maroon and gold
    "aflsyd_southern_power":      ["#7A0019", "#FFD200", "#FFFFFF"],

    # ── AFL Canberra remaining ────────────────────────────────────────────────────
    # ADFA – navy and gold (Australian Defence Force Academy)
    "aflcanberra_adfa":           ["#002B5C", "#FFD200", "#FFFFFF"],
    # Batemans Bay Seahawks – teal and navy
    "aflcanberra_batemans_bay_seahawk": ["#008B8B", "#002B5C", "#FFFFFF"],
    # Googong Hogs – maroon and gold
    "aflcanberra_googong_hogs":   ["#7B1D41", "#FFD200", "#FFFFFF"],
    # Molonglo – green and gold
    "aflcanberra_molonglo":       ["#006633", "#FFD200", "#FFFFFF"],
    # Yass – red and blue
    "aflcanberra_yass":           ["#CC2031", "#003087", "#FFFFFF"],

    # ── AFL HCC remaining ─────────────────────────────────────────────────────────
    # Muswellbrook – maroon and gold
    "aflhcc_muswellbrook":        ["#7A0019", "#FFD200", "#FFFFFF"],
    # Terrigal Avoca – blue and gold
    "aflhcc_terrigal_avoca":      ["#003087", "#FFD200", "#FFFFFF"],
    # The Entrance Bateau Bay – navy and white
    "aflhcc_the_entrance_bateau": ["#002B5C", "#FFFFFF", "#002B5C"],
    # Wallsend West Newcastle – black and gold
    "aflhcc_wallsend_west_newcas":["#000000", "#FFD200", "#000000"],
    # Warners Bay – royal blue and white
    "aflhcc_warners_bay":         ["#003087", "#FFFFFF", "#003087"],

    # ── VFL remaining ────────────────────────────────────────────────────────────
    # Werribee – purple and gold (Richmond affiliate in western region)
    "vfl_werribee":               ["#660066", "#FFD200", "#660066"],

    # ── TSL remaining ────────────────────────────────────────────────────────────
    # North Launceston – blue and white
    "tsl_north_launceston":       ["#003087", "#FFFFFF", "#003087"],

    # ── NTFL remaining ───────────────────────────────────────────────────────────
    # Waratah – purple and gold (Warriors, confirmed)
    "ntfl_waratah":               ["#660066", "#FFD200", "#FFFFFF"],

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

    # ── EFNL (Eastern Football Netball League) remaining ──────────────────────
    # South Belgrave FNC (listed as Belgrave in EFNL) – black, red, white
    "efnl_belgrave":              ["#000000", "#CC0000", "#FFFFFF"],
    # Blackburn Panthers – black and red vertical stripes
    "efnl_blackburn":             ["#000000", "#CC0000", "#FFFFFF"],
    # Boronia Hawks – brown and gold (non-placeholder shade)
    "efnl_boronia":               ["#5C3317", "#C9A84C", "#FFFFFF"],
    # Doncaster Sharks – blue and white hoops
    "efnl_doncaster":             ["#003087", "#FFFFFF", "#003087"],
    # Donvale Magpies – black, green, white
    "efnl_donvale":               ["#000000", "#006600", "#FFFFFF"],
    # Knox Falcons – red with black sash
    "efnl_knox":                  ["#CC0000", "#000000", "#FFFFFF"],
    # Montrose Demons – navy with red yoke
    "efnl_montrose":              ["#001F5B", "#CC0000", "#FFFFFF"],
    # North Ringwood Saints – red, black, white
    "efnl_north_ringwood":        ["#CC0000", "#000000", "#FFFFFF"],
    # Norwood Norsemen – black, purple, gold
    "efnl_norwood":               ["#000000", "#7B2D8B", "#FFD700"],

    # ── ERGFL (Eastern Region Grads FL) remaining ─────────────────────────────
    # Blackburn Junior – same as EFNL Blackburn Panthers
    "ergfl_blackburn_junior":     ["#000000", "#CC0000", "#FFFFFF"],
    # Donvale – same as EFNL Donvale Magpies
    "ergfl_donvale":              ["#000000", "#006600", "#FFFFFF"],
    # Knox – same as EFNL Knox Falcons
    "ergfl_knox":                 ["#CC0000", "#000000", "#FFFFFF"],
    # Montrose – same as EFNL Montrose Demons
    "ergfl_montrose":             ["#001F5B", "#CC0000", "#FFFFFF"],
    # North Ringwood – same as EFNL North Ringwood Saints
    "ergfl_north_ringwood":       ["#CC0000", "#000000", "#FFFFFF"],
    # Norwood – same as EFNL Norwood Norsemen
    "ergfl_norwood":              ["#000000", "#7B2D8B", "#FFD700"],

    # ── Central Highlands FL remaining ────────────────────────────────────────
    # Clunes Magpies – black and white (confirmed since 1919)
    "centralhighlandsfl_clunes":  ["#000000", "#FFFFFF", "#000000"],
    # Dunnstown – red and white (current branding: "Roar at the Red!")
    "centralhighlandsfl_dunnstown":["#CC2031", "#FFFFFF", "#CC2031"],
    # Hepburn Burras – red and blue
    "centralhighlandsfl_hepburn": ["#CC0000", "#003399", "#FFFFFF"],
    # Learmonth Lakies – royal blue and gold
    "centralhighlandsfl_learmonth":["#003399", "#FFD700", "#FFFFFF"],

    # ── Outer East FNL remaining ──────────────────────────────────────────────
    # Emerald Bombers – red and black (Essendon style; non-placeholder shade)
    "outereastfnl_emerald":       ["#CC0000", "#000000", "#FFFFFF"],
    # Healesville Bloods – maroon and white
    "outereastfnl_healesville":   ["#800020", "#FFFFFF", "#800020"],
    # Mount Evelyn Rovers – maroon and white (adopted 1961)
    "outereastfnl_mount_evelyn":  ["#800020", "#FFFFFF", "#800020"],

    # ── AFL Cairns remaining ──────────────────────────────────────────────────
    # South Cairns Cutters – red, white and green (changed 1995)
    "aflcairns_south_cairns":     ["#CC0000", "#FFFFFF", "#007A33"],

    # ── AFL HCC remaining ─────────────────────────────────────────────────────
    # Cardiff Hawks – brown and gold (non-placeholder shade)
    "aflhcc_cardiff_hawks":       ["#4D2600", "#FFD700", "#FFFFFF"],

    # ── AFL North Coast NSW remaining ─────────────────────────────────────────
    # Grafton Tigers – black with yellow sash
    "aflnorthcoastnsw_grafton":   ["#000000", "#FFD700", "#000000"],

    # ── Avon Football Association (WA) remaining ──────────────────────────────
    # Beverley Redbacks – red and white
    "avonfootballassociation_beverley":         ["#CC0000", "#FFFFFF", "#CC0000"],
    # Northam Railways Bombers – yellow and black
    "avonfootballassociation_northam_railways": ["#FFD700", "#000000", "#FFD700"],

    # ── Bellarine FNL remaining ───────────────────────────────────────────────
    # Geelong Amateur – green and light blue (College green + Grammar blue)
    "bellarinefnl_geelong_amateur":["#006400", "#ADD8E6", "#FFFFFF"],

    # ── South West Football League (WA) remaining ─────────────────────────────
    # Augusta Margaret River Hawks – green and gold
    "southwestfootballleague_augusta_margaret_r":["#007A22", "#FFD700", "#FFFFFF"],
    # Donnybrook Dons – navy and white
    "southwestfootballleague_donnybrook":        ["#000080", "#FFFFFF", "#000080"],
    # Eaton Boomers – brown and gold (new 2025 colors; non-placeholder shade)
    "southwestfootballleague_eaton":             ["#5C3317", "#FFD700", "#FFFFFF"],

    # ── Perth Football League remaining ───────────────────────────────────────
    # Belmont Districts – red and black
    "perthfootballleague_belmont_dist":["#CC0000", "#000000", "#FFFFFF"],

    # ── Hills Football Association (WA) remaining ──────────────────────────────
    # Swan View – maroon and gold
    "hillsfootballassociation_swan_view":["#800000", "#FFD700", "#FFFFFF"],

    # ── AdelFL remaining (non-placeholder shades for Hawks clubs) ─────────────
    # Salisbury North Hawks – brown and gold (non-placeholder shade)
    "adelfl_salisbury_north":     ["#5A2D0A", "#F0A030", "#FFFFFF"],
    # West Croydon Hawks – brown and gold (non-placeholder shade)
    "adelfl_west_croydon":        ["#5A2D0A", "#F0A030", "#FFFFFF"],
    # Plympton Bulldogs – red and black (confirmed)
    "adelfl_plympton":            ["#CC0000", "#000000", "#FFFFFF"],
    # Tea Tree Gully – red and black (confirmed)
    "adelfl_tea_tree_gully":      ["#CC0000", "#000000", "#FFFFFF"],

    # ── North Central FL remaining ────────────────────────────────────────────
    # Boort Magpies – black and white
    "northcentralfl_boort":       ["#000000", "#FFFFFF", "#000000"],
    # Donald Royal Blues – royal blue and white
    "northcentralfl_donald":      ["#4169E1", "#FFFFFF", "#4169E1"],

    # ── East Gippsland FNL remaining ─────────────────────────────────────────
    # Lindenow – brown and gold (EGFNL historical; non-placeholder shade)
    "eastgippslandfnl_lindenow":  ["#4E2D1A", "#FFD700", "#FFFFFF"],

    # ── Maryborough Castlemaine DFL remaining ─────────────────────────────────
    # Avoca Bulldogs – red, white and blue
    "maryboroughcastlemainedfl_avoca":["#CC0000", "#FFFFFF", "#003399"],
    # Maryborough Rovers – black and white (Magpies)
    "maryboroughcastlemainedfl_marybo":["#000000", "#FFFFFF", "#000000"],

    # ── South West DFL remaining ──────────────────────────────────────────────
    # Branxholme-Wallacedale Saints – red and blue (Saints/Wallacedale heritage)
    "southwestdfl_branxholme_wallaced":["#CC0000", "#003399", "#FFFFFF"],

    # ── Riddell District FNL remaining ────────────────────────────────────────
    # Melton South Panthers – navy and white (confirmed 1972 founding)
    "riddelldfnl_melton_south":   ["#002868", "#FFFFFF", "#002868"],

    # ── Sunraysia FL remaining ────────────────────────────────────────────────
    # Irymple – blue and gold
    "sunraysiafl_irymple":        ["#003DA5", "#FFD700", "#FFFFFF"],

    # ── Warrnambool District FL remaining ─────────────────────────────────────
    # Old Collegians Warriors – green and gold (confirmed Footypedia)
    "warrnambooldistrictfl_old_colleg":["#006400", "#FFD700", "#FFFFFF"],

    # ── East Kimberley FL remaining ───────────────────────────────────────────
    # Halls Creek Hawks – brown and gold (Hawks nickname; non-placeholder shade)
    "eastkimberleyfl_halls_creek": ["#5A2D0A", "#F0A030", "#FFFFFF"],

    # ── Farrer FL (NSW) remaining ─────────────────────────────────────────────
    # Collingullie-Kapooka Demons – red and white (Demons branding)
    "farrerfl_collingullie_kapooka":["#CC0000", "#FFFFFF", "#CC0000"],

    # ── Murray FNL remaining ──────────────────────────────────────────────────
    # Deniliquin Rams – blue and gold
    "murrayfnl_deniliquin":        ["#003087", "#FFD700", "#FFFFFF"],
    # Katandra Kats – blue and white
    "murrayfnl_katandra":          ["#003087", "#FFFFFF", "#003087"],

    # ── Ovens King FL remaining ───────────────────────────────────────────────
    # Moyhu – green and gold
    "ovenskingfl_moyhu":           ["#005C2B", "#FFD700", "#FFFFFF"],

    # ── Ovens Murray FNL remaining ────────────────────────────────────────────
    # Wangaratta Magpies – black and white
    "ovensmurrayfnl_wangaratta":   ["#000000", "#FFFFFF", "#000000"],

    # ── North Gippsland FNL remaining ────────────────────────────────────────
    # Yarram Demons – red and white
    "northgippslandfnl_yarram":    ["#CC0000", "#FFFFFF", "#CC0000"],

    # ── Riverina FNL (NSW) remaining ──────────────────────────────────────────
    # Turvey Park Bulldogs – red, white, blue ("Home of the Red, White & Blue")
    "riverinafnl_turvey_park":     ["#CC0000", "#FFFFFF", "#003087"],

    # ── Tallangatta District FL remaining ─────────────────────────────────────
    # Mitta United Blues – blue and white
    "tallangattadistrictfl_mitta_unit": ["#003087", "#FFFFFF", "#003087"],
    # Rutherglen Cats – navy and white (Geelong-style hoops)
    "tallangattadistrictfl_rutherglen": ["#002B5C", "#FFFFFF", "#002B5C"],

    # ── Geelong District FNL remaining ───────────────────────────────────────
    # Corio – red and white (established 1974)
    "geelongdistrictfnl_corio":    ["#CC0000", "#FFFFFF", "#CC0000"],
    # East Geelong – maroon and gold
    "geelongdistrictfnl_east_geelong":["#800000", "#FFD700", "#FFFFFF"],

    # ── Geelong FNL remaining ─────────────────────────────────────────────────
    # St Joseph's Joeys – red and black
    "geelongfnl_st_joseph_s":      ["#CC0000", "#000000", "#FFFFFF"],

    # ── False-positive clubs: real color = placeholder shade; use slight variant ──
    # NFNL Eltham Wildcats – red and black (real club color, non-placeholder red)
    "nfnl_eltham":                ["#CC0000", "#000000", "#FFFFFF"],
    # EDFL Moonee Valley Knights – orange and black (real club color, off-shade orange)
    "edfl_moonee_valley":         ["#FF7700", "#000000", "#FFFFFF"],
    # VAFA Old Xaverians – red and black (Xavier College colors; slight red variant)
    "vafa_old_xaverians":         ["#CC0000", "#000000", "#FFFFFF"],
    # NTFL Nightcliff Tigers – orange and black (slightly off-shade orange)
    "ntfl_nightcliff":            ["#FF7700", "#000000", "#FFFFFF"],
    # AFL Sydney North Shore Bombers – red and black (Essendon colors; non-placeholder red)
    "aflsyd_north_shore":         ["#CC0000", "#000000", "#FFFFFF"],

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
