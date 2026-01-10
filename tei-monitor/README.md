# TEI XML Derivatives Monitor

Comprehensive monitoring dashboard for TEI XML derivative files with automatic detection of missing, stale, or problematic files. Designed for multi-volume works, metadata-only entries, and complex TEI processing workflows.

## Features

### Core Detection
- **Work ID filtering**: Only processes directories matching `W[0-9]{4}` pattern
- **Dummy file detection**: Identifies metadata-only works by checking:
  - `/TEI/teiHeader/editionStmt/edition/@n = "unpublished"`
  - `/TEI/text/body/div[1]/head[1]` contains "Content is forthcoming!"
- **Multi-volume detection**: Identifies multi-volume works via IIIF manifest `@type: "sc:Collection"`
- **Staleness detection**: Highlights files older than reference anchor
- **Fragment consistency**: Warns when HTML fragments or snippets span >24h (configurable)

### Enhanced Information Display
- **File counts**: HTML fragments, search snippets, routes, node index nodes, IIIF canvases, CSV rows
- **File sizes**: TEI XML, PDFs, plaintext files, RDF (human-readable format)
- **Accurate totals**: ~720,000 files tracked with aggregate sizes
- **Time ranges**: First/last modification times for fragment collections and multi-volume files
- **Multi-volume aggregation**: Combined statistics for volume-based files
- **Column totals**: Aggregate counts and sizes displayed in footer row

### Interactive Dashboard
- **Clickable cells**: Each cell links to regeneration endpoint (opens in new tab)
- **Hover tooltips**: Shows column name when headers scroll out of view (including in totals row)
- **Date-based highlighting**: Highlight works not regenerated since a specific date
- **Issue filtering**: Show only works with problems, hide metadata-only works
- **Column visibility**: Hide unmonitored columns (Stats, RDF) to focus on critical files
- **Summary statistics**: Total works, files, sizes, full/metadata-only split, multi-volume count, works with issues

### Smart Reference Anchoring
- **Full works**: Use `*_nodeIndex.xml` as reference for staleness checking
- **Metadata-only works**: Use IIIF manifest as reference
- **IIIF manifests**: Special 72-hour threshold vs nodeIndex (legitimately older)

## Installation

### Requirements
- Python 3.6+
- No additional dependencies (uses only standard library)

### Setup
```bash
chmod +x tei_monitor.py
```

## Configuration

### Environment Variables

```bash
# Required: Base directory containing all work folders
export PROJECT_DATA_DIR="/path/to/your/project/data"

# Optional: Log file for detailed diagnostics (recommended for cron)
export LOG_FILE="/var/log/tei_monitor.log"

# Optional: Disable progress indicator for cron jobs
export QUIET_MODE="true"

# Optional: Age warning thresholds
export FRAGMENT_AGE_THRESHOLD_HOURS="24"  # Warning if fragments span >24h
export MANIFEST_AGE_THRESHOLD_HOURS="72"  # Manifests can be 72h older than nodeIndex

# Optional: Custom link prefix for regeneration endpoints
export LINK_PREFIX="https://your-domain.com/admin?rid="
```

## Usage

### Manual Execution

```bash
# Basic usage - shows live progress
PROJECT_DATA_DIR=/path/to/data python3 tei_monitor.py > dashboard.html

# With all options
LOG_FILE=/var/log/tei_monitor.log \
FRAGMENT_AGE_THRESHOLD_HOURS=48 \
MANIFEST_AGE_THRESHOLD_HOURS=168 \
PROJECT_DATA_DIR=/path/to/data \
python3 tei_monitor.py > dashboard.html

# Quiet mode (no progress indicator - good for scripts)
QUIET_MODE=true \
PROJECT_DATA_DIR=/path/to/data \
python3 tei_monitor.py > dashboard.html
```

### Cron Job Setup

For cron jobs, use `QUIET_MODE=true` to prevent stderr output:

**Hourly monitoring (recommended):**
```cron
0 * * * * QUIET_MODE=true LOG_FILE=/var/log/tei_monitor.log PROJECT_DATA_DIR=/path/to/data /usr/bin/python3 /path/to/tei_monitor.py > /var/www/html/tei_monitor.html 2>&1
```

**Daily at 2 AM:**
```cron
0 2 * * * QUIET_MODE=true LOG_FILE=/var/log/tei_monitor.log PROJECT_DATA_DIR=/path/to/data /usr/bin/python3 /path/to/tei_monitor.py > /var/www/html/tei_monitor.html 2>&1
```

**Every 6 hours:**
```cron
0 */6 * * * QUIET_MODE=true LOG_FILE=/var/log/tei_monitor.log PROJECT_DATA_DIR=/path/to/data /usr/bin/python3 /path/to/tei_monitor.py > /var/www/html/tei_monitor.html 2>&1
```

### Why QUIET_MODE for Cron?

- **Without QUIET_MODE**: Progress indicator uses `\r` (carriage return) which is harmless but may clutter cron emails
- **With QUIET_MODE**: No progress to stderr, only actual errors reported
- **Recommended**: Always use `QUIET_MODE=true` in cron jobs

## Output Behavior

The script uses multiple output channels:

- **Stdout**: HTML dashboard (redirect to save file)
- **Stderr**: Progress indicator (unless `QUIET_MODE=true`)
  - Live-updating in terminals: `Processing 45/120: W0045...`
  - Cleared on completion (no clutter)
- **Log file**: Detailed diagnostics with timestamps (optional, via `LOG_FILE`)

### Progress Indicator Behavior

| Context | Behavior |
|---------|----------|
| Interactive terminal | Overwrites line, shows live progress |
| Cron job (with `QUIET_MODE=true`) | Silent, no stderr output |
| Cron job (without `QUIET_MODE`) | Progress cleared before exit, no emails triggered |
| SSH session | Usually works (overwrites) |
| Redirected stderr (`2>file`) | Shows each line (doesn't overwrite) |

## Interactive Dashboard Features

### Summary Statistics

Seven summary cards display at the top:
- **Total Works**: Number of work directories processed
- **Full Transcriptions**: Works with complete text content
- **Metadata Only**: Works with only catalog information
- **Multi-volume Works**: Works spanning multiple volumes
- **Works with Issues**: Count of works with missing/stale monitored files
- **Total Files**: Accurate count of all derivative files (~720,000)
- **Total Size**: Aggregate size of all files (human-readable)

### Filter Controls

**Work-level filters:**
- ☑ Show only works with issues
- ☑ Hide metadata-only works

**Column-level filters:**
- ☑ Hide unmonitored columns (Stats, RDF)

**Date-based highlighting:**
- Select a date and column to highlight works not regenerated since that date
- Perfect for tracking which works need regeneration after bug fixes
- Preserves all cell colors while adding prominent orange left border
- Shows count of highlighted works

### Date-Based Highlighting

**Use case**: "I fixed a bug in HTML fragment generation on Dec 15, 2024 - which works need regenerating?"

**How to use:**
1. Enter date: `2024-12-15`
2. Select column: `HTML Fragments`
3. Click **Highlight**
4. Rows with fragments older than Dec 15 get orange left border
5. Status colors (green/red/yellow) remain visible
6. Counter shows: "23 works highlighted"
7. Click **Clear** to remove highlights

**Smart date extraction:**
- Single date cells: Uses that date
- Multi-file cells: Uses **oldest** date (e.g., "First: 2024-12-01" from multi-date cell)
- Ignores N/A cells

### Visual Status Indicators

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 Green | Present & Current | File exists and is newer than reference |
| 🟠 Orange | Stale | File exists but is older than reference |
| 🟡 Yellow | Warning | Fragments span >24h (configurable threshold) |
| 🔴 Red | Missing | Required file is missing |
| ⚪ Gray | N/A | File not expected for this work type |
| 🔶 Orange border | Date-highlighted | File predates specified date |

Gray overlay on Stats and RDF columns indicates they're not monitored for issues.

## File Structure & Detection Logic

### Expected Directory Structure

```
$PROJECT_DATA_DIR/
├── W0001/                                    # Monograph work
│   ├── W0001.xml                             # Main TEI XML
│   ├── W0001_nodeIndex.xml                   # Reference anchor (full works)
│   ├── W0001.json                            # IIIF manifest (@type: "sc:Manifest")
│   ├── W0001.pdf                             # Single PDF
│   ├── W0001.csv                             # Tabular export
│   ├── W0001_routes.json                     # URL routing (JSON array)
│   ├── W0001-stats.json                      # Statistics (not monitored)
│   ├── W0001.rdf                             # RDF export (not monitored)
│   ├── html/
│   │   ├── 00001_W0001-01-0006-fm-03e8.html  # Fragment (numbered)
│   │   ├── 00002_W0001-01-0020-d1-03ee.html
│   │   ├── W0001_details.html                # Catalog page
│   │   ├── W0001_toc.html                    # Table of contents
│   │   └── W0001_pages.html                  # Pagination navigation
│   ├── snippets/
│   │   ├── 00001_W0001-01-0006-tp-03e8.snippet.xml
│   │   └── 00002_W0001-01-0008-he-03e8.snippet.xml
│   └── text/
│       ├── W0001_edit.txt                    # Normalized plaintext
│       └── W0001_orig.txt                    # Original plaintext
│
├── W0002/                                    # Multi-volume work
│   ├── W0002.xml                             # Container TEI XML
│   ├── W0002_nodeIndex.xml                   # Reference anchor
│   ├── W0002.json                            # IIIF collection (@type: "sc:Collection")
│   ├── W0002_Vol01.json                      # Per-volume manifests
│   ├── W0002_Vol02.json
│   ├── W0002_Vol01.pdf                       # Per-volume PDFs (checked)
│   ├── W0002_Vol02.pdf
│   ├── W0002.pdf                             # Optional: manual comprehensive PDF (ignored)
│   ├── html/
│   │   ├── [fragments as above]
│   │   ├── W0002_details.html                # Main catalog page
│   │   ├── W0002_Vol01_details.html          # Per-volume catalog pages
│   │   └── W0002_Vol02_details.html
│   └── [other directories as above]
│
└── W0003/                                    # Metadata-only work
    ├── W0003.xml                             # Dummy TEI (edition n="unpublished")
    ├── W0003.json                            # IIIF manifest (reference anchor)
    ├── W0003_routes.json                     # Routes present
    ├── html/
    │   └── W0003_details.html                # Catalog page only
    └── [no fragments, snippets, plaintext, CSV, or PDF]
```

### Work Type Detection

#### Work ID Pattern
Only directories matching `^W\d{4}$` are processed:
- ✅ `W0001`, `W1234`, `W9999`
- ❌ `W123`, `W12345`, `work_001`, `test`

#### Dummy (Metadata-Only) Detection
A work is metadata-only if **either**:
1. TEI XML has `<edition n="unpublished">` in editionStmt
2. First div head contains "Content is forthcoming!"

For dummy works:
- Node Index: N/A (not expected)
- HTML fragments, snippets, TOC, pages, PDF, plaintext, CSV: N/A
- Only manifest, routes, details page, and stats/RDF checked

#### Multi-Volume Detection
A work is multi-volume if:
- IIIF manifest root has `"@type": "sc:Collection"` (not `"sc:Manifest"`)

For multi-volume works:
- **PDFs**: Checks `_Vol01.pdf`, `_Vol02.pdf`, etc. (ignores main `*.pdf`)
- **Manifests**: Checks container + all `_Vol01.json`, `_Vol02.json`, etc.
- **Details**: Checks main + all `_Vol01_details.html`, `_Vol02_details.html`, etc.
- **Glob pattern**: Uses `_Vol[0-9][0-9]` to match exactly two digits

### Staleness Reference Anchors

| Work Type | Reference File | Purpose |
|-----------|---------------|---------|
| Full works | `*_nodeIndex.xml` | Pretend it's not a derivative |
| Metadata-only | `*.json` (IIIF manifest) | Pretend it's not a derivative |
| All files vs reference | Compare mtime | Flag if older |
| IIIF manifests | Special: 72h threshold | Legitimately older than nodeIndex |

**No time threshold** for staleness (except manifests) - any file older than reference is flagged immediately.

### Issue Counting

**Monitored file types** (counted in "Works with Issues"):
- IIIF Manifest, Node Index, HTML Fragments, Details, TOC, Pages
- Plaintext (Edit/Orig), TEI XML, PDF, Snippets, CSV, Routes

**Unmonitored file types** (displayed but not counted):
- Stats (`*-stats.json`)
- RDF (`*.rdf`)

**Note**: Issues are counted by **works**, not individual file types. A work with 5 missing files counts as 1 issue.

## Column Information

### Column Order (left to right)

1. **IIIF Manifest** - First generated file, canvas count
   - Monograph: Date + canvas count
   - Multi-volume: "Container + N volumes" + date + total canvases
2. **Node Index** - Second generated, node count (N/A for metadata-only)
3. **HTML Fragments** - Count with first/last dates, warns if span >24h
4. **Pages Nav** - Pagination navigation
5. **TOC Nav** - Table of contents navigation
6. **Details Page** - Catalog pages
   - Monograph: Single date
   - Multi-volume: "Main + N volumes" with first/last dates
7. **Text (Edit)** - Normalized plaintext with size
8. **Text (Orig)** - Original plaintext with size
9. **TEI XML** - Source file with size
10. **PDF** - Rendered PDF with size
    - Monograph: Single file with size
    - Multi-volume: "N files, total size" with first/last dates
    - Metadata-only multi-volume: N/A
11. **Snippets** - Search engine snippets, count with first/last dates
12. **CSV** - Tabular export with row count
13. **Routes** - URL routing with route count
14. **Stats** - Statistics (NOT monitored for issues)
15. **RDF** - RDF export with size (NOT monitored for issues)

### Clickable Links

Each cell (except N/A and Missing) is a clickable link that opens the regeneration endpoint in a new tab.

**Default URL format:**
```
https://www.salamanca.school:8443/exist/apps/salamanca/de/webdata-admin.xql?rid=<work-id>&format=<suffix>
```

**Format suffixes per column:**
- IIIF Manifest → `iiif`
- Node Index → `index`
- HTML Fragments, Pages, TOC, Text (Edit), Text (Orig) → `html`
- Details Page → `details`
- TEI XML → `html`
- PDF → `pdf_create`
- Snippets → `snippets`
- CSV → `nlp`
- Routes → `routing`
- Stats → `stats`
- RDF → `rdf`

**Customize URL prefix:**
```bash
LINK_PREFIX="https://your-domain.com/admin?work=" python3 tei_monitor.py > dashboard.html
```

### Column Totals (Footer Row)

Aggregate counts and sizes displayed for all columns:

**Columns with counts + sizes:**
- **IIIF Manifest**: "1,365 canvases, 2.3 MB"
- **Node Index**: "3,857 nodes, 45.2 MB"
- **HTML Fragments**: "1,234 files, 156.7 MB"
- **Snippets**: "1,234 files, 89.3 MB"
- **CSV**: "12,345 rows, 4.5 MB"
- **Routes**: "234 routes, 1.2 MB"

**Columns with sizes only:**
- **Pages Nav**: "12.3 MB"
- **TOC Nav**: "8.7 MB"
- **Details**: "3.4 MB"
- **Text (Edit)**: "45.6 MB"
- **Text (Orig)**: "47.8 MB"
- **TEI XML**: "156.3 MB"
- **PDF**: "234.5 MB"
- **Stats**: "2.1 MB"
- **RDF**: "67.8 MB"

Footer cells also have hover tooltips showing column names, and Stats/RDF totals hide when the "Hide unmonitored columns" checkbox is checked.

### Hover Tooltips

When you hover over any cell (including footer totals), a tooltip shows the column name. This helps when column headers have scrolled out of view.

## Troubleshooting

### No works found

**Check:**
- `PROJECT_DATA_DIR` is correct: `echo $PROJECT_DATA_DIR`
- Work directories match pattern: `ls -d $PROJECT_DATA_DIR/W[0-9][0-9][0-9][0-9]`
- Permissions: `ls -la $PROJECT_DATA_DIR`

### Total files count seems wrong

The script counts actual file instances:
- **Collection types** (fragments, snippets): Extracts count from "N files" in cell text
- **Multi-volume files**: Parses "Container + 2 volumes" → counts 3 files
- **Single files**: Counts 1 if size > 0

If count seems low, check that file globs are matching correctly:
```bash
# Count fragments manually
find $PROJECT_DATA_DIR/W0001/html -name '[0-9]*_W0001-*.html' | wc -l
```

### Totals showing "—" instead of numbers

The script uses regex to extract counts from cell text. Check that:
- Files exist and are being counted
- Text format matches expected patterns (e.g., "N files", "N canvases")
- Check stderr or log file for parsing errors

### Volume counting incorrect

**Check glob pattern matching:**
```bash
# Should only match Vol01, Vol02, etc. (two digits)
ls W0013/W0013_Vol[0-9][0-9].json

# Not these:
W0013_Vol1.json      # Single digit
W0013_Volumen.json   # Different suffix
```

The script uses `_Vol[0-9][0-9]` pattern to match exactly 2 digits.

### Date highlighting not working

**Check:**
1. Date is selected in date picker
2. Column is selected from dropdown
3. Selected column actually has date information
4. Date format in cells matches `YYYY-MM-DD`

**Debug:**
- Open browser console (F12)
- Look for JavaScript errors
- Check that cells contain parseable dates

### Cron sending error emails

**Solution 1: Use QUIET_MODE (recommended)**
```cron
0 * * * * QUIET_MODE=true PROJECT_DATA_DIR=/path/to/data python3 /path/to/tei_monitor.py > /var/www/html/dashboard.html 2>&1
```

**Solution 2: Redirect stderr to log**
```cron
0 * * * * PROJECT_DATA_DIR=/path/to/data python3 /path/to/tei_monitor.py > /var/www/html/dashboard.html 2>> /var/log/tei_monitor_stderr.log
```

**Solution 3: Suppress stderr**
```cron
0 * * * * PROJECT_DATA_DIR=/path/to/data python3 /path/to/tei_monitor.py > /var/www/html/dashboard.html 2>/dev/null
```

### Links not working

**Check:**
1. `LINK_PREFIX` is correct
2. Work IDs are correctly extracted
3. Browser isn't blocking pop-ups
4. Target URLs are accessible

**Test a link manually:**
```bash
# Extract from dashboard
grep "href=" dashboard.html | head -1
```

## Advanced Usage

### Identifying Works Needing Regeneration

**Scenario**: You fixed a bug in PDF generation on January 1, 2025.

**Steps**:
1. Open the dashboard
2. Enter date: `2025-01-01`
3. Select column: `PDF`
4. Click **Highlight**
5. See which works have PDFs from before the fix
6. Click each highlighted work's PDF cell to regenerate

**Workflow integration**:
```bash
# Generate dashboard
python3 tei_monitor.py > dashboard.html

# Open in browser, use date highlighting to identify works
# Click links to regenerate specific files

# Regenerate entire dashboard after fixes
python3 tei_monitor.py > dashboard_updated.html
```

### Monitoring Specific Subsets

```bash
# Generate separate dashboards for different subsets
mkdir /tmp/full_works
for d in $PROJECT_DATA_DIR/W*/; do
    if ! grep -q 'edition n="unpublished"' "$d/$(basename $d).xml" 2>/dev/null; then
        ln -s "$d" "/tmp/full_works/"
    fi
done
PROJECT_DATA_DIR=/tmp/full_works python3 tei_monitor.py > full_works_dashboard.html
```

### Comparing Runs

```bash
# Generate with timestamp
DATE=$(date +%Y%m%d_%H%M)
python3 tei_monitor.py > "dashboard_${DATE}.html"

# Compare two runs
diff dashboard_20240108_1400.html dashboard_20240108_1600.html
```

### CI/CD Integration

```bash
#!/bin/bash
# Fail if issues detected

python3 tei_monitor.py > dashboard.html

# Extract issue count from summary card
ISSUES=$(grep -A2 'Works with Issues' dashboard.html | grep 'value' | grep -oP '\d+')

if [ "$ISSUES" -gt 0 ]; then
    echo "ERROR: $ISSUES works have issues"
    exit 1
fi

echo "✓ All checks passed"
```

## Configuration Examples

### Development Environment
```bash
# Verbose, with live progress
LOG_FILE=/tmp/tei_monitor.log \
FRAGMENT_AGE_THRESHOLD_HOURS=48 \
PROJECT_DATA_DIR=/data/tei \
python3 tei_monitor.py > dashboard.html
```

### Production Cron Job
```bash
# Silent, production thresholds
QUIET_MODE=true \
LOG_FILE=/var/log/tei_monitor.log \
FRAGMENT_AGE_THRESHOLD_HOURS=24 \
MANIFEST_AGE_THRESHOLD_HOURS=72 \
PROJECT_DATA_DIR=/data/tei \
LINK_PREFIX="https://salamanca.school:8443/exist/apps/salamanca/de/webdata-admin.xql?rid=" \
python3 /usr/local/bin/tei_monitor.py > /var/www/html/tei_monitor.html
```

### Testing/Debug Mode
```bash
# Maximum logging, relaxed thresholds
LOG_FILE=/tmp/debug.log \
FRAGMENT_AGE_THRESHOLD_HOURS=168 \
MANIFEST_AGE_THRESHOLD_HOURS=336 \
PROJECT_DATA_DIR=/data/tei_test \
python3 tei_monitor.py > test_dashboard.html 2>&1
```

## Design Decisions

### Why Clickable Cells?

Makes regeneration workflow seamless:
1. Spot issue in dashboard
2. Click cell to regenerate
3. Refresh dashboard to verify

### Why Count Issues by Works?

More actionable than counting individual file types:
- "5 works need attention" vs "23 missing files"
- Focuses on work-level problems
- Prevents double-counting related issues

### Why Special Threshold for Manifests?

IIIF manifests are generated first but rarely change. They can legitimately be 2-3 days older than nodeIndex without being "stale". The 72h threshold prevents false positives.

### Why QUIET_MODE?

Progress indicators are great for interactive use but unnecessary in automated contexts. `QUIET_MODE` keeps cron jobs clean while preserving progress feedback for manual runs.

### Why Date Highlighting Instead of Filtering?

Filtering would hide rows entirely, losing context. Highlighting keeps all data visible while drawing attention to specific works. The orange border and preserved cell colors let you see both "needs regeneration" and "what's the current status".

### Why Orange Border Instead of Yellow Background?

A solid colored background would hide the important status colors (green OK, red missing, orange stale). The orange left border is prominent enough to catch attention while preserving all status information in the cells.

### Why Stdout for HTML?

Maximum flexibility:
- Atomic updates: `script > new.html && mv new.html live.html`
- Pipes: `script | gzip > archive.html.gz`
- Version control: Easy diffs
- Multiple destinations: `tee`

## Performance

Typical performance for different collection sizes:

| Works | Time | Bottleneck |
|-------|------|------------|
| <100 | <1 min | Negligible |
| 100-500 | 1-5 min | XML/JSON parsing |
| 500-1000 | 5-10 min | File system operations |
| >1000 | 10+ min | Consider optimization |

No caching or parallel processing currently implemented (complexity vs benefit tradeoff).

## License

Free to modify and adapt to your needs.

## Support

For issues:
1. Check stderr or log file for diagnostic messages
2. Enable debug logging: `LOG_FILE=/tmp/debug.log`
3. Test with subset: Symlink a few works to temp directory
4. Verify file timestamps: `ls -lt` on problematic files
5. Check XML structure: `xmllint` or `grep` on TEI files

## Changelog

### Recent Improvements
- ✅ Date-based highlighting to identify works predating specific dates
- ✅ Accurate file counting (all ~720,000 files tracked)
- ✅ File size totals for all columns
- ✅ Clickable regeneration links in all cells
- ✅ Hover tooltips on all cells including footer
- ✅ Column totals in footer row (with hide support)
- ✅ Issue counting by works (not file types)
- ✅ TEI XML column repositioned (between text and PDF)
- ✅ Multi-volume metadata-only PDF handling fixed
- ✅ Consistent date labels (First/Last)
- ✅ Volume counting fixed (specific glob patterns)
- ✅ Manifest staleness logic corrected
- ✅ QUIET_MODE for cron-friendly execution
- ✅ Debug logging isolated to log file only
- ✅ Unmonitored columns visually indicated and hideable
