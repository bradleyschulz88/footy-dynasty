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
    # Highett – red and black
    "sfnl_highett":               ["#CC2031", "#000000", "#FFFFFF"],
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
