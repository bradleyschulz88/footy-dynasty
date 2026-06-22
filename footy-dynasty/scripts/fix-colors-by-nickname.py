#!/usr/bin/env python3
"""
Bulk-patch club colours in pyramid.js based on nickname patterns.

In Australian rules football virtually every local club named after an AFL
club's mascot follows that club's colour scheme.  This script applies those
standard patterns to any club whose current primary colour looks like a
placeholder (one of the five most-common placeholder triplets).

Usage:  python3 scripts/fix-colors-by-nickname.py [--dry-run] [--verbose]
"""

import re, sys, os

# ─── Placeholder detection ────────────────────────────────────────────────────
# These five triplets account for 304 / 1537 entries and are the most common
# placeholder colours used by the generator.
PLACEHOLDERS = {
    ('1A6B3C', 'FFD200', 'FFFFFF'),   # 77 uses  – dark green / gold
    ('6B4423', 'FFD200', 'FFFFFF'),   # 62 uses  – dark brown / gold  ← treated carefully below
    ('CC2031', '000000', 'FFFFFF'),   # 59 uses  – red / black (some real clubs!)
    ('4D2004', 'FBBF15', 'FFFFFF'),   # 56 uses  – dark brown / gold  ← careful
    ('0099CC', '000000', 'FFFFFF'),   # 50 uses  – sky blue / black
    ('800020', 'FFD200', 'FFFFFF'),   # 50 uses  – dark maroon / gold
    ('8B0000', 'FFFFFF', 'FFD200'),   # dark red / white
    ('006633', 'CC0000', 'FFFFFF'),   # dark green / red
    ('006633', 'FFFFFF', 'FFD200'),   # dark green / white
    ('003366', 'CC0000', 'FFFFFF'),   # dark navy / red
    ('003366', 'FFD200', '000000'),   # dark navy / gold / black
    ('000080', 'FFD200', 'FFFFFF'),   # pure navy / gold
    ('660066', 'FFD200', 'FFFFFF'),   # purple / gold  ← some real clubs!
    ('FF6600', '000000', 'FFFFFF'),   # orange / black  ← some real clubs!
    ('1A6B3C', 'FFD200', '000000'),   # dark green / gold / black
}

def is_placeholder(colors_str: str) -> bool:
    """Return True if the colours look like a placeholder triplet."""
    # Strip whitespace and quotes, extract hex values
    hexes = tuple(h.strip().strip('"').strip('#').upper()
                  for h in colors_str.split(','))
    return hexes in PLACEHOLDERS

# ─── Nickname → colour mapping ────────────────────────────────────────────────
# Each entry: keyword (case-insensitive match against club name) → [p, s, t]
# Listed from most-specific to least-specific so more-specific patterns win.
# Nicknames that appear in the name field of the club object.
NICKNAME_COLORS = [
    # ── Highly reliable — virtually universal in Aust. football ──────────────
    # (Magpies = Collingwood: black + white — no exceptions in community footy)
    ("Magpies",     ["#000000", "#FFFFFF", "#000000"]),
    # Bombers = Essendon: red + black
    ("Bombers",     ["#CC2031", "#000000", "#FFD200"]),
    # Swans = Sydney: red + white
    ("Swans",       ["#ED1B2F", "#FFFFFF", "#ED1B2F"]),
    # Blues = Carlton: navy + white
    ("Blues",       ["#002B5C", "#FFFFFF", "#002B5C"]),
    # Cats = Geelong: navy + white
    ("Cats",        ["#002F6C", "#FFFFFF", "#002F6C"]),
    # Demons = Melbourne: navy + red
    ("Demons",      ["#0F1131", "#CC2031", "#0F1131"]),
    # Kangaroos / Roos = North Melbourne: blue + white + red
    ("Kangaroos",   ["#003F87", "#FFFFFF", "#CC2031"]),
    (" Roos",       ["#003F87", "#FFFFFF", "#CC2031"]),
    # Crows = Adelaide: navy + red + gold
    ("Crows",       ["#002B5C", "#E21937", "#FFD200"]),
    # Saints = St Kilda: red + black + white
    ("Saints",      ["#ED1B2F", "#000000", "#FFFFFF"]),
    # Hawks = Hawthorn: brown + gold
    ("Hawks",       ["#4D2004", "#FBBF15", "#FFFFFF"]),
    # Giants = GWS: orange + black
    ("Giants",      ["#F47920", "#231F20", "#FFFFFF"]),
    # Power = Port Adelaide (AFL): teal + black
    ("Power",       ["#008A8D", "#000000", "#FFFFFF"]),
    # Suns = Gold Coast: red + gold
    ("Suns",        ["#D71920", "#FDB813", "#FFFFFF"]),

    # ── Fairly reliable ───────────────────────────────────────────────────────
    # Tigers = Richmond: yellow + black  (Nightcliff Tigers are orange, but
    #   Nightcliff already corrected. Most other Tigers follow Richmond.)
    ("Tigers",      ["#FFD200", "#000000", "#FFD200"]),
    # Eagles = West Coast: navy + gold  (some exceptions already corrected)
    ("Eagles",      ["#002B5C", "#FFD200", "#FFFFFF"]),
    # Lions = Brisbane: maroon + navy + gold
    ("Lions",       ["#7A0019", "#002B5C", "#FFD200"]),
    # Bulldogs = Western Bulldogs: blue + red + white
    ("Bulldogs",    ["#0039A6", "#E21937", "#FFFFFF"]),
    # Roosters = North Adelaide: red + white
    ("Roosters",    ["#CC2031", "#FFFFFF", "#CC2031"]),
    # Bears = Brisbane (old): maroon + gold + white
    ("Bears",       ["#7A0019", "#FFD200", "#FFFFFF"]),

    # ── Partially reliable ────────────────────────────────────────────────────
    # Sharks — teal or red+white varies widely; skip here
    # Wolves — no standard colour; skip
    # Panthers — no standard; skip
    # Falcons — no standard; skip
    # Ravens — no standard; skip
    # Cobras — no standard; skip
]

# ─── Exceptions: clubs that should NOT be changed despite matching a keyword ──
# These clubs have been corrected already or are known to differ.
EXCEPTIONS = {
    # Nightcliff Tigers already corrected to orange/black
    "ntfl_nightcliff",
    # WAFL teams corrected via explicit CORRECTIONS dict already
    "wafl_claremont",   # Tigers but gold/black
    # VFL / AFL clubs already correct
    "afl_richmond",
    "vfl_richmond",
    # QAFL Surfers Paradise Demons — red/navy (already corrected)
    "qafl_surfers_paradise",
    # NFNL Bundoora "Bulls" – not Bombers
    "nfnl_bundoora",
    # Adelaide Crows specific clubs
    "sanfl_adelaide",
    "afl_adelaide",
    # AFL Sydney Southern Power — not Port Adelaide
    "aflsyd_southern_power",
    # WFNL Sunshine / North Sunshine are suburb names, not Suns clubs
    "wfnl_sunshine",
    "wfnl_north_sunshine",
    # VAFA Hampton Rovers — green/gold IS their real color (not a placeholder)
    "vafa_hampton_rovers",
    # VAFA Collegians — purple/gold IS their real Wesley College color
    "vafa_collegians",
    # VAFA Old Xaverians — red/black IS their real Xavier College color
    "vafa_old_xaverians",
    # NFNL Eltham Wildcats — red/black IS their real color
    "nfnl_eltham",
    # EDFL Moonee Valley Knights — orange/black IS their real color
    "edfl_moonee_valley",
    # AFL Sydney North Shore Bombers — red/black IS their real color
    "aflsyd_north_shore",
    # Perth FL Belmont Districts — red/black IS their real color
    "perthfootballleague_belmont_dist",
    # Outer East Emerald Bombers — red/black IS their real color (slight shade diff but treat as correct)
    "outereastfnl_emerald",
}

# ─────────────────────────────────────────────────────────────────────────────

def main():
    dry = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv

    path = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "src", "data", "pyramid.js")
    )
    print(f"Target: {path}")

    with open(path) as f:
        src = f.read()

    # Find all club blocks: id, name, colors
    club_pattern = re.compile(
        r'(id:\s*"(?P<id>[^"]+)",\s*name:\s*"(?P<name>[^"]+)".*?colors:\s*)\[(?P<colors>[^\]]+)\]',
        re.DOTALL,
    )

    changed = 0
    skipped_exception = 0
    skipped_color_ok = 0
    skipped_no_match = 0

    def replacer(m):
        nonlocal changed, skipped_exception, skipped_color_ok, skipped_no_match
        club_id   = m.group("id")
        club_name = m.group("name")
        cur_colors = m.group("colors")
        prefix     = m.group(1)

        if club_id in EXCEPTIONS:
            skipped_exception += 1
            return m.group(0)

        if not is_placeholder(cur_colors):
            skipped_color_ok += 1
            return m.group(0)

        # Try each keyword in order — use word boundaries to avoid false matches
        # e.g. "Hawks" must not match "Seahawks", "Suns" must not match "Sunshine"
        for keyword, new_colors in NICKNAME_COLORS:
            pat = r'\b' + re.escape(keyword.strip()) + r'\b'
            if re.search(pat, club_name, re.IGNORECASE):
                color_str = ", ".join(f'"{c}"' for c in new_colors)
                new_block = f"{prefix}[{color_str}]"
                if verbose:
                    print(f"  {club_id}: '{club_name}' → {new_colors}")
                changed += 1
                return new_block

        skipped_no_match += 1
        return m.group(0)

    new_src = club_pattern.sub(replacer, src)

    if not dry:
        with open(path, "w") as f:
            f.write(new_src)

    print(
        f"\n{'DRY RUN — ' if dry else ''}Done.\n"
        f"  {changed} clubs updated\n"
        f"  {skipped_exception} skipped (exception list)\n"
        f"  {skipped_color_ok} skipped (non-placeholder colour already set)\n"
        f"  {skipped_no_match} skipped (no keyword matched)\n"
    )


if __name__ == "__main__":
    main()
