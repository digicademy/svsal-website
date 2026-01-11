#!/usr/bin/env python3
"""
Salamanca TEI XML Derivative Files Monitor
Generates an HTML dashboard showing file presence and freshness for all work-ids
Outputs to stdout - redirect to file as needed
"""

import os
import sys
import re
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import xml.etree.ElementTree as ET

##############################################################################
# Configuration
##############################################################################

PROJECT_DATA_DIR = os.environ.get('PROJECT_DATA_DIR', '/path/to/project/data')
LOG_FILE = os.environ.get('LOG_FILE', None)  # Optional log file path
QUIET_MODE = os.environ.get('QUIET_MODE', 'false').lower() in ('true', '1', 'yes')  # Disable progress indicator for cron
LINK_PREFIX = os.environ.get('LINK_PREFIX', 'https://www.salamanca.school:8443/exist/apps/salamanca/de/webdata-admin.xql?rid=')

# Work ID pattern: W[0-9]{4}
WORK_ID_PATTERN = re.compile(r'^W\d{4}$')

# Age warning thresholds
FRAGMENT_AGE_THRESHOLD_HOURS = int(os.environ.get('FRAGMENT_AGE_THRESHOLD_HOURS', '24'))
MANIFEST_AGE_THRESHOLD_HOURS = int(os.environ.get('MANIFEST_AGE_THRESHOLD_HOURS', '72'))

# Link suffixes for regeneration
LINK_SUFFIXES = {
    'manifest': 'iiif',
    'node_index': 'index',
    'html_fragments': 'html',
    'pages': 'html',
    'toc': 'html',
    'text_edit': 'html',
    'text_orig': 'html',
    'tei_xml': 'html',
    'details': 'details',
    'pdf': 'pdf_create',
    'snippets': 'snippets',
    'csv': 'nlp',
    'routes': 'routing',
    'stats': 'stats',
    'rdf': 'rdf'
}

# TEI and custom namespaces
TEI_NS = {'tei': 'http://www.tei-c.org/ns/1.0'}
SAL_NS = {'sal': 'http://salamanca.adwmainz.de'}

# Status codes and colors
STATUS_OK = ('ok', '#90EE90', 'Present & Current')
STATUS_STALE = ('stale', '#FFE4B5', 'Stale')
STATUS_MISSING = ('missing', '#FFB6C6', 'Missing')
STATUS_NA = ('na', '#E0E0E0', 'N/A')
STATUS_WARNING = ('warning', '#FFEB3B', 'Warning')

# File types that count towards "issues"
MONITORED_FILE_TYPES = {
    'tei_xml', 'node_index', 'manifest', 'details',
    'toc', 'pages', 'routes', 'pdf', 'text_edit',
    'text_orig', 'csv', 'html_fragments', 'snippets',
    'stats'
}

# File types displayed but not monitored (yet)
UNMONITORED_FILE_TYPES = {'rdf'}

##############################################################################
# Logging Helper
##############################################################################

_log_file_handle = None

def log(message: str, to_stderr: bool = True):
    """Log message to stderr and optionally to log file"""
    if to_stderr:
        print(message, file=sys.stderr)

    if LOG_FILE:
        global _log_file_handle
        if _log_file_handle is None:
            try:
                _log_file_handle = open(LOG_FILE, 'a', encoding='utf-8')
            except OSError as e:
                print(f"Warning: Could not open log file {LOG_FILE}: {e}", file=sys.stderr)
                return

        try:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            _log_file_handle.write(f"[{timestamp}] {message}\n")
            _log_file_handle.flush()
        except OSError:
            pass

def close_log():
    """Close log file if open"""
    global _log_file_handle
    if _log_file_handle:
        try:
            _log_file_handle.close()
        except OSError:
            pass
        _log_file_handle = None

##############################################################################
# Helper Functions
##############################################################################

def get_file_mtime(filepath: Path) -> Optional[float]:
    """Get file modification time as timestamp"""
    try:
        return filepath.stat().st_mtime if filepath.exists() else None
    except OSError:
        return None

def format_date(timestamp: Optional[float]) -> str:
    """Format timestamp as human-readable date"""
    if timestamp is None:
        return "—"
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")

def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def get_file_size(filepath: Path) -> Optional[int]:
    """Get file size in bytes"""
    try:
        return filepath.stat().st_size if filepath.exists() else None
    except OSError:
        return None

def is_dummy_file(xml_path: Path) -> bool:
    """
    Determine if TEI XML file is a dummy (metadata-only) file

    Checks:
    1. /TEI/teiHeader/editionStmt/edition/@n = "unpublished"
    2. /TEI/text/body/div[1]/head[1] contains "Content is forthcoming!"
    """
    if not xml_path.exists():
        return False

    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()

        # Check edition/@n attribute for "unpublished"
        edition_elem = root.find('.//tei:teiHeader/tei:editionStmt/tei:edition[@n="unpublished"]', TEI_NS)
        if edition_elem is not None:
            return True

        # Try without namespace
        edition_elem = root.find('.//teiHeader/editionStmt/edition[@n="unpublished"]')
        if edition_elem is not None:
            return True

        # Check for "Content is forthcoming!" in first div head
        head_elem = root.find('.//tei:text/tei:body/tei:div[1]/tei:head[1]', TEI_NS)
        if head_elem is not None and head_elem.text and 'Content is forthcoming!' in head_elem.text:
            return True

        # Try without namespace
        head_elem = root.find('.//text/body/div[1]/head[1]')
        if head_elem is not None and head_elem.text and 'Content is forthcoming!' in head_elem.text:
            return True

    except (ET.ParseError, OSError) as e:
        log(f"Warning: Could not parse {xml_path}: {e}")

    return False

def is_multivolume_work(manifest_path: Path) -> bool:
    """
    Determine if work is multi-volume by checking IIIF manifest
    Multi-volume works have @type: "sc:Collection" instead of "sc:Manifest"
    """
    try:
        if not manifest_path.exists():
            return False
        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('@type') == 'sc:Collection'
    except (json.JSONDecodeError, OSError) as e:
        log(f"Warning: Could not parse manifest {manifest_path}: {e}")
    return False

def count_files_matching(directory: Path, pattern: str) -> int:
    """Count files matching a glob pattern"""
    try:
        return len(list(directory.glob(pattern)))
    except OSError:
        return 0

def get_file_mtime_range(directory: Path, pattern: str) -> Tuple[Optional[float], Optional[float], int]:
    """
    Get earliest and latest modification times for files matching pattern
    Returns: (earliest_mtime, latest_mtime, count)
    """
    try:
        files = list(directory.glob(pattern))
        if not files:
            return None, None, 0

        mtimes = []
        for f in files:
            try:
                mtimes.append(f.stat().st_mtime)
            except OSError:
                pass

        if not mtimes:
            return None, None, len(files)

        return min(mtimes), max(mtimes), len(files)
    except OSError:
        return None, None, 0

def get_volume_pdfs_info(work_dir: Path, work_id: str, reference_time: Optional[float], is_dummy: bool = False) -> Tuple[str, str, str]:
    """
    Get status of volume PDFs for multi-volume works
    Returns: (status_code, color, display_text)
    """
    # For metadata-only works, PDFs are not expected
    if is_dummy:
        return STATUS_NA

    # Use specific pattern: _Vol01, _Vol02, etc. (two digits)
    vol_pdfs = sorted(work_dir.glob(f"{work_id}_Vol[0-9][0-9].pdf"))

    if not vol_pdfs:
        return STATUS_MISSING

    total_size = 0
    earliest_mtime = None
    latest_mtime = None

    for pdf in vol_pdfs:
        try:
            size = pdf.stat().st_size
            mtime = pdf.stat().st_mtime
            total_size += size

            if earliest_mtime is None or mtime < earliest_mtime:
                earliest_mtime = mtime
            if latest_mtime is None or mtime > latest_mtime:
                latest_mtime = mtime
        except OSError:
            pass

    if earliest_mtime is None or latest_mtime is None:
        return STATUS_MISSING

    # Check staleness
    status_code = 'ok'
    color = STATUS_OK[1]

    if reference_time and latest_mtime < reference_time:
        status_code = 'stale'
        color = STATUS_STALE[1]

    # Build display text
    count = len(vol_pdfs)
    size_str = format_file_size(total_size)
    earliest_str = format_date(earliest_mtime)
    latest_str = format_date(latest_mtime)

    if earliest_mtime == latest_mtime or count == 1:
        text = f"{count} file{'s' if count > 1 else ''}, {size_str}<br>{earliest_str}"
    else:
        text = f"{count} files, {size_str}<br>First: {earliest_str}<br>Last: {latest_str}"

    return (status_code, color, text)

def get_volume_manifests_info(work_dir: Path, work_id: str, reference_time: Optional[float]) -> Tuple[str, str, str]:
    """
    Get status of volume manifests for multi-volume works
    Checks both container manifest and per-volume manifests
    Returns: (status_code, color, display_text)
    """
    # Check container manifest
    container_path = work_dir / f"{work_id}.json"
    if not container_path.exists():
        return STATUS_MISSING

    container_mtime = get_file_mtime(container_path)

    # Check volume manifests - use specific pattern to avoid over-matching
    vol_manifests = sorted(work_dir.glob(f"{work_id}_Vol[0-9][0-9].json"))

    if not vol_manifests:
        return STATUS_MISSING

    status_code = 'ok'
    color = STATUS_OK[1]

    # Debug logging (only to log file, not stderr)
    if LOG_FILE:
        log(f"  {work_id} manifest check: container_mtime={format_date(container_mtime)}, reference_time={format_date(reference_time) if reference_time else 'None'}", to_stderr=False)

    # For multi-volume works with full transcriptions, check staleness against nodeIndex
    # The manifest can legitimately be older, but not by more than the threshold
    if reference_time:
        # Check staleness of container - only if it's OLDER than reference
        if container_mtime and container_mtime < reference_time:
            # Apply special threshold for manifests
            age_hours = (reference_time - container_mtime) / 3600
            if LOG_FILE:
                log(f"  {work_id} container is {age_hours:.1f}h older than reference (threshold: {MANIFEST_AGE_THRESHOLD_HOURS}h)", to_stderr=False)
            if age_hours > MANIFEST_AGE_THRESHOLD_HOURS:
                status_code = 'stale'
                color = STATUS_STALE[1]
                if LOG_FILE:
                    log(f"  {work_id} container marked as STALE", to_stderr=False)
        elif container_mtime and LOG_FILE:
            log(f"  {work_id} container is NEWER than reference - OK", to_stderr=False)

        # Check each volume manifest - only if OLDER than reference
        for vol_manifest in vol_manifests:
            vol_mtime = get_file_mtime(vol_manifest)
            if vol_mtime and vol_mtime < reference_time:
                age_hours = (reference_time - vol_mtime) / 3600
                if age_hours > MANIFEST_AGE_THRESHOLD_HOURS:
                    status_code = 'stale'
                    color = STATUS_STALE[1]
                    if LOG_FILE:
                        log(f"  {work_id} volume {vol_manifest.name} marked as STALE", to_stderr=False)
                    break

    # Count total canvases
    total_canvases = 0
    for manifest_file in [container_path] + vol_manifests:
        canvas_count = count_iiif_canvases(manifest_file)
        if canvas_count:
            total_canvases += canvas_count

    container_str = format_date(container_mtime)
    vol_count = len(vol_manifests)
    text = f"Container + {vol_count} volume{'s' if vol_count != 1 else ''}<br>{container_str}"
    if total_canvases > 0:
        text += f"<br>{total_canvases} canvases"

    if LOG_FILE:
        log(f"  {work_id} final status: {status_code}, volumes: {vol_count}", to_stderr=False)

    return (status_code, color, text)

def get_volume_details_info(work_dir: Path, work_id: str, reference_time: Optional[float]) -> Tuple[str, str, str]:
    """
    Get status of volume detail pages for multi-volume works
    Checks both main details page and per-volume details pages
    Returns: (status_code, color, display_text)
    """
    html_dir = work_dir / 'html'

    # Check main details page
    main_details = html_dir / f"{work_id}_details.html"
    if not main_details.exists():
        return STATUS_MISSING

    main_mtime = get_file_mtime(main_details)

    # Check volume details pages - use specific pattern: _Vol01, _Vol02, etc.
    vol_details = sorted(html_dir.glob(f"{work_id}_Vol[0-9][0-9]_details.html"))

    if not vol_details:
        return STATUS_MISSING

    status_code = 'ok'
    color = STATUS_OK[1]

    # Collect all mtimes
    all_mtimes = [main_mtime] if main_mtime else []
    for vol_detail in vol_details:
        vol_mtime = get_file_mtime(vol_detail)
        if vol_mtime:
            all_mtimes.append(vol_mtime)

    if not all_mtimes:
        return STATUS_MISSING

    earliest_mtime = min(all_mtimes)
    latest_mtime = max(all_mtimes)

    # Check staleness
    if reference_time:
        if latest_mtime < reference_time:
            status_code = 'stale'
            color = STATUS_STALE[1]

    earliest_str = format_date(earliest_mtime)
    latest_str = format_date(latest_mtime)

    # Build display text
    if earliest_mtime == latest_mtime:
        text = f"Main + {len(vol_details)} volumes<br>{earliest_str}"
    else:
        text = f"Main + {len(vol_details)} volumes<br>First: {earliest_str}<br>Last: {latest_str}"

    return (status_code, color, text)

def count_json_array_items(filepath: Path) -> Optional[int]:
    """Count items in a JSON array file"""
    try:
        if not filepath.exists():
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return len(data)
    except (json.JSONDecodeError, OSError) as e:
        log(f"Warning: Could not parse JSON {filepath}: {e}")
    return None

def count_iiif_canvases(filepath: Path) -> Optional[int]:
    """Count Canvas objects in IIIF manifest"""
    try:
        if not filepath.exists():
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # IIIF manifests have sequences containing canvases
            count = 0
            if 'sequences' in data:
                for seq in data['sequences']:
                    if 'canvases' in seq:
                        for canvas in seq['canvases']:
                            if canvas.get('@type') == 'sc:Canvas':
                                count += 1
            return count if count > 0 else None
    except (json.JSONDecodeError, OSError) as e:
        log(f"Warning: Could not parse IIIF manifest {filepath}: {e}")
    return None

def count_node_index_nodes(filepath: Path) -> Optional[int]:
    """Count sal:node elements in nodeIndex XML"""
    try:
        if not filepath.exists():
            return None
        tree = ET.parse(filepath)
        root = tree.getroot()
        # Count with namespace
        nodes = root.findall('.//sal:node', SAL_NS)
        if nodes:
            return len(nodes)
        # Fallback without namespace
        nodes = root.findall('.//node')
        return len(nodes) if nodes else None
    except (ET.ParseError, OSError) as e:
        log(f"Warning: Could not parse nodeIndex {filepath}: {e}")
    return None

def count_csv_rows(filepath: Path) -> Optional[int]:
    """Count rows in CSV file (excluding header)"""
    try:
        if not filepath.exists():
            return None
        with open(filepath, 'r', encoding='utf-8') as f:
            # Count lines, subtract 1 for header
            lines = sum(1 for _ in f)
            return max(0, lines - 1)
    except OSError as e:
        log(f"Warning: Could not read CSV {filepath}: {e}")
    return None

def check_file_status(
    filepath: Path,
    reference_time: Optional[float],
    required: bool,
    monitored: bool = True,
    age_threshold_hours: Optional[int] = None
) -> Tuple[str, str, str]:
    """
    Check file status and return (status_code, color, display_text)

    Args:
        filepath: Path to file to check
        reference_time: Reference timestamp to compare against
        required: Whether this file is required for this work type
        monitored: Whether issues in this file count towards problem detection
        age_threshold_hours: Special age threshold for this file type
    """
    if not filepath.exists():
        if required:
            return STATUS_MISSING
        else:
            return STATUS_NA

    file_time = get_file_mtime(filepath)
    if file_time is None:
        return STATUS_MISSING

    date_str = format_date(file_time)

    # Check if file is stale compared to reference
    if reference_time and file_time < reference_time:
        # Apply special threshold if provided
        if age_threshold_hours:
            age_seconds = reference_time - file_time
            age_hours = age_seconds / 3600
            if age_hours > age_threshold_hours:
                return ('stale', STATUS_STALE[1], f"{date_str} (outdated)")
            else:
                return ('ok', STATUS_OK[1], date_str)
        else:
            return ('stale', STATUS_STALE[1], f"{date_str} (outdated)")

    return ('ok', STATUS_OK[1], date_str)

def check_fragments_status(
    directory: Path,
    work_id: str,
    pattern: str,
    reference_time: Optional[float]
) -> Tuple[str, str, str]:
    """
    Check status of fragment files (HTML or snippets)
    Returns status with count and time range
    """
    earliest, latest, count = get_file_mtime_range(directory, pattern)

    if count == 0:
        return STATUS_NA

    if earliest is None or latest is None:
        return ('info', '#FFFFFF', f"{count} files")

    earliest_str = format_date(earliest)
    latest_str = format_date(latest)

    # Calculate time span
    time_span_seconds = latest - earliest
    time_span_hours = time_span_seconds / 3600

    # Check if reference is outdated
    status_code = 'ok'
    color = STATUS_OK[1]

    if reference_time:
        if latest < reference_time:
            status_code = 'stale'
            color = STATUS_STALE[1]

    # Check if time span exceeds threshold
    if time_span_hours > FRAGMENT_AGE_THRESHOLD_HOURS:
        if status_code == 'ok':
            status_code = 'warning'
            color = STATUS_WARNING[1]

    # Build display text
    if earliest == latest or count == 1:
        time_info = f"{count} file{'s' if count > 1 else ''}<br>{earliest_str}"
    else:
        time_info = f"{count} files<br>First: {earliest_str}<br>Last: {latest_str}"

    return (status_code, color, time_info)

##############################################################################
# Work Analysis
##############################################################################

class WorkAnalysis:
    """Analyzes a single work directory"""

    def __init__(self, work_dir: Path):
        self.work_dir = work_dir
        self.work_id = work_dir.name
        self.is_dummy = self._check_if_dummy()
        self.is_multivolume = self._check_if_multivolume()

        # Determine reference time based on work type
        if self.is_dummy:
            # For metadata-only: use IIIF manifest as anchor
            self.reference_time = get_file_mtime(work_dir / f"{self.work_id}.json")
        else:
            # For full works: use nodeIndex as anchor
            self.reference_time = get_file_mtime(work_dir / f"{self.work_id}_nodeIndex.xml")

    def _check_if_dummy(self) -> bool:
        """Check if this is a metadata-only work"""
        tei_file = self.work_dir / f"{self.work_id}.xml"
        return is_dummy_file(tei_file)

    def _check_if_multivolume(self) -> bool:
        """Check if this is a multi-volume work"""
        manifest_file = self.work_dir / f"{self.work_id}.json"
        return is_multivolume_work(manifest_file)

    def analyze(self) -> Dict:
        """Analyze all derivative files and return status dict"""
        require_content = not self.is_dummy

        # TEI XML file - with size
        tei_path = self.work_dir / f"{self.work_id}.xml"
        tei_size = get_file_size(tei_path)
        tei_status = check_file_status(tei_path, None, True)
        if tei_size:
            tei_status = (tei_status[0], tei_status[1],
                         f"{tei_status[2]}<br>{format_file_size(tei_size)}")

        # IIIF Manifest - handle multi-volume vs single
        if self.is_multivolume:
            manifest_status = get_volume_manifests_info(self.work_dir, self.work_id, self.reference_time)
        else:
            manifest_path = self.work_dir / f"{self.work_id}.json"
            canvas_count = count_iiif_canvases(manifest_path)
            # Use special threshold for manifests (72h vs nodeIndex)
            if self.is_dummy:
                manifest_status = check_file_status(manifest_path, None, True, age_threshold_hours=None)
            else:
                manifest_status = check_file_status(
                    manifest_path, self.reference_time, True,
                    age_threshold_hours=MANIFEST_AGE_THRESHOLD_HOURS
                )
            if canvas_count:
                manifest_status = (manifest_status[0], manifest_status[1],
                                 f"{manifest_status[2]}<br>{canvas_count} canvases")

        # Node Index - with node count (N/A for metadata-only)
        if self.is_dummy:
            nodeindex_status = STATUS_NA
        else:
            nodeindex_path = self.work_dir / f"{self.work_id}_nodeIndex.xml"
            node_count = count_node_index_nodes(nodeindex_path)
            nodeindex_status = check_file_status(nodeindex_path, None, True)
            if node_count:
                nodeindex_status = (nodeindex_status[0], nodeindex_status[1],
                                   f"{nodeindex_status[2]}<br>{node_count} nodes")

        # HTML Fragments
        html_dir = self.work_dir / 'html'
        if require_content:
            html_fragments_status = check_fragments_status(
                html_dir, self.work_id,
                f"[0-9]*_{self.work_id}-*.html",
                self.reference_time
            )
        else:
            html_fragments_status = STATUS_NA

        # Pages navigation
        pages_status = check_file_status(
            html_dir / f"{self.work_id}_pages.html",
            self.reference_time, require_content
        )

        # TOC navigation
        toc_status = check_file_status(
            html_dir / f"{self.work_id}_toc.html",
            self.reference_time, require_content
        )

        # Details page(s) - handle multi-volume vs single
        if self.is_multivolume:
            details_status = get_volume_details_info(self.work_dir, self.work_id, self.reference_time)
        else:
            details_status = check_file_status(
                html_dir / f"{self.work_id}_details.html",
                self.reference_time, True
            )

        # Plaintext files - with size
        text_edit_path = self.work_dir / 'text' / f"{self.work_id}_edit.txt"
        text_edit_size = get_file_size(text_edit_path)
        text_edit_status = check_file_status(text_edit_path, self.reference_time, require_content)
        if text_edit_size and text_edit_status[0] != 'na':
            text_edit_status = (text_edit_status[0], text_edit_status[1],
                               f"{text_edit_status[2]}<br>{format_file_size(text_edit_size)}")

        text_orig_path = self.work_dir / 'text' / f"{self.work_id}_orig.txt"
        text_orig_size = get_file_size(text_orig_path)
        text_orig_status = check_file_status(text_orig_path, self.reference_time, require_content)
        if text_orig_size and text_orig_status[0] != 'na':
            text_orig_status = (text_orig_status[0], text_orig_status[1],
                               f"{text_orig_status[2]}<br>{format_file_size(text_orig_size)}")

        # PDF - handle multi-volume vs single
        if self.is_multivolume:
            pdf_status = get_volume_pdfs_info(self.work_dir, self.work_id, self.reference_time, self.is_dummy)
        else:
            pdf_path = self.work_dir / f"{self.work_id}.pdf"
            pdf_size = get_file_size(pdf_path)
            pdf_status = check_file_status(pdf_path, self.reference_time, require_content)
            if pdf_size and pdf_status[0] != 'na':
                pdf_status = (pdf_status[0], pdf_status[1],
                             f"{pdf_status[2]}<br>{format_file_size(pdf_size)}")

        # Search Snippets
        snippets_dir = self.work_dir / 'snippets'
        if require_content:
            snippets_status = check_fragments_status(
                snippets_dir, self.work_id,
                f"[0-9]*_{self.work_id}-*.snippet.xml",
                self.reference_time
            )
        else:
            snippets_status = STATUS_NA

        # CSV - with row count (N/A for metadata-only)
        if self.is_dummy:
            csv_status = STATUS_NA
        else:
            csv_path = self.work_dir / f"{self.work_id}.csv"
            csv_rows = count_csv_rows(csv_path)
            csv_status = check_file_status(csv_path, self.reference_time, require_content)
            if csv_rows is not None and csv_status[0] != 'na':
                csv_status = (csv_status[0], csv_status[1],
                             f"{csv_status[2]}<br>{csv_rows} rows")

        # Routes - with route count
        routes_path = self.work_dir / f"{self.work_id}_routes.json"
        route_count = count_json_array_items(routes_path)
        routes_status = check_file_status(routes_path, self.reference_time, True)
        if route_count is not None:
            routes_status = (routes_status[0], routes_status[1],
                            f"{routes_status[2]}<br>{route_count} routes")

        # Stats - NOT monitored for issues (N/A for metadata-only)
        if self.is_dummy:
            stats_status = STATUS_NA
        else:
            stats_path = self.work_dir / f"{self.work_id}-stats.json"
            stats_status = check_file_status(stats_path, self.reference_time, True, monitored=False)

        # RDF - NOT monitored for issues
        rdf_path = self.work_dir / f"{self.work_id}.rdf"
        rdf_size = get_file_size(rdf_path)
        rdf_status = check_file_status(rdf_path, self.reference_time, False, monitored=False)
        if rdf_size and rdf_status[0] not in ['na', 'missing']:
            rdf_status = (rdf_status[0], rdf_status[1],
                         f"{rdf_status[2]}<br>{format_file_size(rdf_size)}")

        # Return in the correct column order
        result = {
            'work_id': self.work_id,
            'is_dummy': self.is_dummy,
            'is_multivolume': self.is_multivolume,
            'manifest': manifest_status,
            'node_index': nodeindex_status,
            'html_fragments': html_fragments_status,
            'pages': pages_status,
            'toc': toc_status,
            'details': details_status,
            'text_edit': text_edit_status,
            'text_orig': text_orig_status,
            'tei_xml': tei_status,  # Moved between text and PDF
            'pdf': pdf_status,
            'snippets': snippets_status,
            'csv': csv_status,
            'routes': routes_status,
            'stats': stats_status,
            'rdf': rdf_status,
            # Size metadata for totals calculation
            '_sizes': {
                'manifest': self._get_manifest_size(),
                'node_index': get_file_size(self.work_dir / f"{self.work_id}_nodeIndex.xml") or 0 if not self.is_dummy else 0,
                'html_fragments': self._get_fragments_size(html_dir, f"[0-9]*_{self.work_id}-*.html"),
                'pages': get_file_size(html_dir / f"{self.work_id}_pages.html") or 0,
                'toc': get_file_size(html_dir / f"{self.work_id}_toc.html") or 0,
                'details': self._get_details_size(html_dir),
                'text_edit': text_edit_size or 0,
                'text_orig': text_orig_size or 0,
                'tei_xml': tei_size or 0,
                'pdf': self._get_pdf_size(),
                'snippets': self._get_fragments_size(self.work_dir / 'snippets', f"[0-9]*_{self.work_id}-*.snippet.xml"),
                'csv': get_file_size(self.work_dir / f"{self.work_id}.csv") or 0,
                'routes': get_file_size(self.work_dir / f"{self.work_id}_routes.json") or 0,
                'stats': get_file_size(self.work_dir / f"{self.work_id}-stats.json") or 0,
                'rdf': rdf_size or 0,
            }
        }

        return result

    def _get_manifest_size(self) -> int:
        """Get total size of manifest files (container + volumes for multi-volume)"""
        total = 0
        container = self.work_dir / f"{self.work_id}.json"
        if container.exists():
            try:
                total += container.stat().st_size
            except OSError:
                pass

        if self.is_multivolume:
            for vol_manifest in self.work_dir.glob(f"{self.work_id}_Vol[0-9][0-9].json"):
                try:
                    total += vol_manifest.stat().st_size
                except OSError:
                    pass
        return total

    def _get_fragments_size(self, directory: Path, pattern: str) -> int:
        """Get total size of all files matching pattern"""
        try:
            total = 0
            for f in directory.glob(pattern):
                try:
                    total += f.stat().st_size
                except OSError:
                    pass
            return total
        except OSError:
            return 0

    def _get_details_size(self, html_dir: Path) -> int:
        """Get total size of details pages (main + volumes for multi-volume)"""
        total = 0
        main_details = html_dir / f"{self.work_id}_details.html"
        if main_details.exists():
            try:
                total += main_details.stat().st_size
            except OSError:
                pass

        if self.is_multivolume:
            for vol_detail in html_dir.glob(f"{self.work_id}_Vol[0-9][0-9]_details.html"):
                try:
                    total += vol_detail.stat().st_size
                except OSError:
                    pass
        return total

    def _get_pdf_size(self) -> int:
        """Get total PDF size (volumes for multi-volume, single for monograph)"""
        total = 0
        if self.is_multivolume:
            for pdf in self.work_dir.glob(f"{self.work_id}_Vol[0-9][0-9].pdf"):
                try:
                    total += pdf.stat().st_size
                except OSError:
                    pass
        else:
            pdf_path = self.work_dir / f"{self.work_id}.pdf"
            if pdf_path.exists():
                try:
                    total += pdf_path.stat().st_size
                except OSError:
                    pass
        return total

##############################################################################
# HTML Generation
##############################################################################

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salamanca TEI XML Derivatives Monitor</title>
    <style>
        * {{
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }}
        .container {{
            max-width: 100%;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        h1 {{
            color: #333;
            margin: 0 0 10px 0;
        }}
        .timestamp {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 20px;
        }}
        .summary {{
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }}
        .summary-card {{
            padding: 15px 20px;
            background: #f9f9f9;
            border-radius: 5px;
            border-left: 4px solid #4a5568;
        }}
        .summary-card .label {{
            font-size: 0.85em;
            color: #666;
            margin-bottom: 5px;
        }}
        .summary-card .value {{
            font-size: 1.5em;
            font-weight: bold;
            color: #2d3748;
        }}
        .legend {{
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .legend-box {{
            width: 20px;
            height: 20px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }}
        .filter-controls {{
            margin: 15px 0;
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }}
        .filter-controls label {{
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        }}
        .filter-controls input[type="checkbox"] {{
            cursor: pointer;
        }}
        .table-wrapper {{
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85em;
        }}
        th {{
            background: #4a5568;
            color: white;
            padding: 10px 6px;
            text-align: left;
            position: sticky;
            top: 0;
            z-index: 10;
            font-size: 0.9em;
            line-height: 1.3;
        }}
        td {{
            padding: 8px 6px;
            border-bottom: 1px solid #e0e0e0;
            line-height: 1.4;
            vertical-align: top;
        }}
        tr:hover {{
            background: #f9f9f9;
        }}
        .work-id {{
            font-weight: bold;
            color: #2d3748;
            white-space: nowrap;
        }}
        .file-cell {{
            text-align: center;
            font-size: 0.85em;
            max-width: 150px;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }}
        .status-missing {{
            background: #FFB6C6 !important;
            color: #721c24;
        }}
        .status-stale {{
            background: #FFE4B5 !important;
            color: #856404;
        }}
        .status-ok {{
            background: #90EE90 !important;
            color: #155724;
        }}
        .status-na {{
            background: #E0E0E0 !important;
            color: #666;
        }}
        .status-warning {{
            background: #FFEB3B !important;
            color: #856404;
        }}
        .dummy-indicator {{
            font-style: italic;
            color: #666;
            font-size: 0.85em;
        }}
        .volume-indicator {{
            font-size: 0.75em;
            color: #2563eb;
            display: block;
        }}
        .file-cell a {{
            color: inherit;
            text-decoration: none;
            display: block;
            width: 100%;
            height: 100%;
        }}
        .file-cell a:hover {{
            text-decoration: underline;
        }}
        .unmonitored-column {{
            position: relative;
        }}
        .unmonitored-column::after {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.3);
            pointer-events: none;
        }}
        th.unmonitored-header {{
            position: relative;
        }}
        th.unmonitored-header::after {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.15);
            pointer-events: none;
        }}
        .hide-unmonitored .unmonitored-column,
        .hide-unmonitored .unmonitored-header {{
            display: none;
        }}
        .info-note {{
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 12px 16px;
            margin: 15px 0;
            font-size: 0.9em;
            color: #1565c0;
            border-radius: 4px;
        }}
        .info-note strong {{
            color: #0d47a1;
        }}
        tr.outdated-highlight {{
            border-left: 6px solid #ff9800;
            box-shadow: -6px 0 0 0 rgba(255, 152, 0, 0.15) inset;
        }}
        tr.outdated-highlight:hover {{
            box-shadow: -6px 0 0 0 rgba(255, 152, 0, 0.25) inset;
        }}
        tfoot td {{
            font-weight: bold;
            background: #f0f0f0;
            border-top: 2px solid #4a5568;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Salamanca TEI XML Derivatives Monitor</h1>
        <div class="timestamp">Generated: {timestamp}</div>

        <div class="summary">
            <div class="summary-card">
                <div class="label">Total Works</div>
                <div class="value">{total_works}</div>
            </div>
            <div class="summary-card">
                <div class="label">Full Transcriptions</div>
                <div class="value">{full_works}</div>
            </div>
            <div class="summary-card">
                <div class="label">Metadata Only</div>
                <div class="value">{dummy_works}</div>
            </div>
            <div class="summary-card">
                <div class="label">Multi-volume Works</div>
                <div class="value">{multivolume_works}</div>
            </div>
            <div class="summary-card">
                <div class="label">Works with Issues</div>
                <div class="value">{issues_count}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Files</div>
                <div class="value">{total_files:,}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Size</div>
                <div class="value">{total_size_str}</div>
            </div>
        </div>

        <div class="info-note">
            <strong>Note:</strong> Issues are tracked for all columns except <strong>{unmonitored_columns}</strong>, which are displayed with a lighter overlay and do not count toward the "Works with Issues" metric.
        </div>

        <div class="legend">
            <div class="legend-item">
                <div class="legend-box" style="background: #90EE90;"></div>
                <span>Present & Current</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #FFE4B5;"></div>
                <span>Stale (older than reference)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #FFEB3B;"></div>
                <span>Warning (time span &gt;{fragment_threshold}h)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #FFB6C6;"></div>
                <span>Missing (expected)</span>
            </div>
            <div class="legend-item">
                <div class="legend-box" style="background: #E0E0E0;"></div>
                <span>N/A (not expected)</span>
            </div>
        </div>

        <div class="filter-controls">
            <label>
                <input type="checkbox" id="filter-issues" onchange="filterTable()">
                Show only works with issues
            </label>
            <label>
                <input type="checkbox" id="filter-dummy" onchange="filterTable()">
                Hide metadata-only works
            </label>
            <label>
                <input type="checkbox" id="filter-unmonitored" onchange="toggleUnmonitored()">
                Hide unmonitored columns (Stats, RDF)
            </label>
        </div>

        <div class="filter-controls" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
            <label style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 500;">Highlight outdated files:</span>
                <input type="date" id="filter-date" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;">
                <select id="filter-column" style="padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">Select column...</option>
                    <option value="2">IIIF Manifest</option>
                    <option value="3">Node Index</option>
                    <option value="4">HTML Fragments</option>
                    <option value="5">Pages Nav</option>
                    <option value="6">TOC Nav</option>
                    <option value="7">Details Page</option>
                    <option value="8">Text (Edit)</option>
                    <option value="9">Text (Orig)</option>
                    <option value="10">TEI XML</option>
                    <option value="11">PDF</option>
                    <option value="12">Snippets</option>
                    <option value="13">CSV</option>
                    <option value="14">Routes</option>
                    <option value="15">Stats</option>
                    <option value="16">RDF</option>
                </select>
                <button onclick="highlightOldFiles()" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    Highlight
                </button>
                <button onclick="clearHighlights()" style="padding: 6px 12px; background: #757575; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    Clear
                </button>
                <span id="highlight-count" style="color: #666; font-size: 0.9em;"></span>
            </label>
        </div>

        <div class="table-wrapper">
            <table id="main-table">
                <thead>
                    <tr>
                        <th>Work ID</th>
                        <th>Type</th>
                        <th>IIIF Manifest</th>
                        <th>Node Index</th>
                        <th>HTML Fragments</th>
                        <th>Pages Nav</th>
                        <th>TOC Nav</th>
                        <th>Details Page</th>
                        <th>Text (Edit)</th>
                        <th>Text (Orig)</th>
                        <th>TEI XML</th>
                        <th>PDF</th>
                        <th>Snippets</th>
                        <th>CSV</th>
                        <th>Routes</th>
                        <th{stats_header_class}>Stats</th>
                        <th{rdf_header_class}>RDF</th>
                    </tr>
                </thead>
                <tbody>
{table_rows}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">Totals:</td>
{totals_row}
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>

    <script>
        function filterTable() {{
            const showIssuesOnly = document.getElementById('filter-issues').checked;
            const hideDummy = document.getElementById('filter-dummy').checked;
            const rows = document.querySelectorAll('#main-table tbody tr');

            rows.forEach(row => {{
                let show = true;

                // Check for issues (missing or stale cells, but not in unmonitored columns)
                if (showIssuesOnly) {{
                    // Get all cells except those with unmonitored-column class
                    const cells = Array.from(row.cells).filter(cell => !cell.classList.contains('unmonitored-column'));
                    const hasIssues = cells.some(cell =>
                        cell.classList.contains('status-missing') ||
                        cell.classList.contains('status-stale')
                    );
                    if (!hasIssues) show = false;
                }}

                // Check for dummy type
                if (hideDummy) {{
                    const typeCell = row.cells[1].textContent;
                    if (typeCell.includes('Metadata Only')) show = false;
                }}

                row.style.display = show ? '' : 'none';
            }});
        }}

        function toggleUnmonitored() {{
            const hideUnmonitored = document.getElementById('filter-unmonitored').checked;
            const table = document.getElementById('main-table');

            if (hideUnmonitored) {{
                table.classList.add('hide-unmonitored');
            }} else {{
                table.classList.remove('hide-unmonitored');
            }}
        }}

        function highlightOldFiles() {{
            const dateInput = document.getElementById('filter-date').value;
            const columnIndex = parseInt(document.getElementById('filter-column').value);

            if (!dateInput) {{
                alert('Please select a date');
                return;
            }}

            if (!columnIndex) {{
                alert('Please select a column');
                return;
            }}

            const filterDate = new Date(dateInput);
            filterDate.setHours(0, 0, 0, 0); // Start of day

            const rows = document.querySelectorAll('#main-table tbody tr');
            let highlightCount = 0;

            rows.forEach(row => {{
                const cell = row.cells[columnIndex];
                if (!cell) return;

                const cellText = cell.textContent;

                // Extract date(s) from cell text
                // Handles formats like "2025-01-08 14:30" or "First: 2025-01-08 10:00"
                const dateMatches = cellText.match(/(\d{{4}}-\d{{2}}-\d{{2}})/g);

                if (dateMatches && dateMatches.length > 0) {{
                    // For multi-file columns (with "First:" and "Last:"), use the first (oldest) date
                    const oldestDateStr = dateMatches[0];
                    const fileDate = new Date(oldestDateStr);
                    fileDate.setHours(0, 0, 0, 0); // Start of day

                    if (fileDate < filterDate) {{
                        row.classList.add('outdated-highlight');
                        highlightCount++;
                    }}
                }}
            }});

            // Update count display
            const countSpan = document.getElementById('highlight-count');
            if (highlightCount > 0) {{
                countSpan.textContent = `${{highlightCount}} work${{highlightCount !== 1 ? 's' : ''}} highlighted`;
                countSpan.style.color = '#f57c00';
                countSpan.style.fontWeight = '500';
            }} else {{
                countSpan.textContent = 'No matches found';
                countSpan.style.color = '#666';
            }}
        }}

        function clearHighlights() {{
            const rows = document.querySelectorAll('#main-table tbody tr');
            rows.forEach(row => {{
                row.classList.remove('outdated-highlight');
            }});

            // Clear count display
            document.getElementById('highlight-count').textContent = '';

            // Clear inputs
            document.getElementById('filter-date').value = '';
            document.getElementById('filter-column').value = '';
        }}
    </script>
</body>
</html>
"""

def format_cell(status_tuple: Tuple[str, str, str], work_id: str, column_name: str, column_label: str) -> str:
    """Format a status tuple into an HTML table cell with tooltip and link"""
    status_code, color, text = status_tuple

    # Add unmonitored class for columns not tracked in issues
    extra_class = ' unmonitored-column' if column_name in UNMONITORED_FILE_TYPES else ''

    # Build the link if we have a suffix for this column
    link_suffix = LINK_SUFFIXES.get(column_name)
    if link_suffix:
        link_url = f"{LINK_PREFIX}{work_id}&format={link_suffix}"
        cell_content = f'<a href="{link_url}" target="_blank" title="{column_label}">{text}</a>'
    else:
        cell_content = f'<span title="{column_label}">{text}</span>'

    return f'<td class="file-cell status-{status_code}{extra_class}" style="background: {color};">{cell_content}</td>'

def generate_html(analyses: List[Dict]) -> str:
    """Generate complete HTML document from work analyses"""

    # Calculate summary statistics
    total_works = len(analyses)
    full_works = sum(1 for a in analyses if not a['is_dummy'])
    dummy_works = sum(1 for a in analyses if a['is_dummy'])
    multivolume_works = sum(1 for a in analyses if a.get('is_multivolume', False))

    # Calculate total files and total size across all works
    # For collections (fragments, snippets), count actual number of files
    # For single files, count 1 if exists (size > 0)
    total_files = 0
    total_size = 0

    # File type categories
    collection_types = ['html_fragments', 'snippets']  # These have multiple files
    multifile_types = ['manifest', 'details']  # Can have multiple files for multi-volume
    single_file_types = ['node_index', 'pages', 'toc', 'text_edit', 'text_orig',
                         'tei_xml', 'pdf', 'csv', 'routes', 'stats', 'rdf']

    for analysis in analyses:
        if '_sizes' not in analysis:
            continue

        # Count collection files from display text
        import re
        for col_type in collection_types:
            if col_type in analysis:
                text = analysis[col_type][2]
                match = re.search(r'(\d+)\s+files?', text)
                if match:
                    count = int(match.group(1))
                    total_files += count
                    total_size += analysis['_sizes'].get(col_type, 0)

        # Count multi-volume manifest/details files
        if analysis.get('is_multivolume'):
            # Manifest: container + volume manifests
            manifest_text = analysis.get('manifest', ('', '', ''))[2]
            match = re.search(r'Container \+ (\d+) volumes?', manifest_text)
            if match:
                vol_count = int(match.group(1))
                total_files += 1 + vol_count  # Container + volumes
                total_size += analysis['_sizes'].get('manifest', 0)

            # Details: main + volume details
            details_text = analysis.get('details', ('', '', ''))[2]
            match = re.search(r'Main \+ (\d+) volumes?', details_text)
            if match:
                vol_count = int(match.group(1))
                total_files += 1 + vol_count  # Main + volumes
                total_size += analysis['_sizes'].get('details', 0)

            # PDF: count volume PDFs
            pdf_text = analysis.get('pdf', ('', '', ''))[2]
            match = re.search(r'(\d+) files?', pdf_text)
            if match:
                total_files += int(match.group(1))
                total_size += analysis['_sizes'].get('pdf', 0)
        else:
            # Single manifest and details for non-multi-volume
            if analysis['_sizes'].get('manifest', 0) > 0:
                total_files += 1
                total_size += analysis['_sizes']['manifest']
            if analysis['_sizes'].get('details', 0) > 0:
                total_files += 1
                total_size += analysis['_sizes']['details']
            if analysis['_sizes'].get('pdf', 0) > 0:
                total_files += 1
                total_size += analysis['_sizes']['pdf']

        # Count single files
        for file_type in single_file_types:
            size = analysis['_sizes'].get(file_type, 0)
            if size > 0:
                total_files += 1
                total_size += size

    # Count works with issues (not individual file type issues)
    works_with_issues = 0
    for analysis in analyses:
        has_issue = False
        for key, value in analysis.items():
            if key in ['work_id', 'is_dummy', 'is_multivolume', '_sizes']:
                continue
            # Skip unmonitored file types
            if key in UNMONITORED_FILE_TYPES:
                continue
            status_code = value[0]
            if status_code in ['missing', 'stale']:
                has_issue = True
                break
        if has_issue:
            works_with_issues += 1

    # Calculate totals for columns with counts - extract from text more robustly
    totals = {
        'manifest': {'canvases': 0, 'count': 0, 'size': 0},
        'node_index': {'nodes': 0, 'count': 0, 'size': 0},
        'html_fragments': {'files': 0, 'count': 0, 'size': 0},
        'pages': {'count': 0, 'size': 0},
        'toc': {'count': 0, 'size': 0},
        'details': {'count': 0, 'size': 0},
        'text_edit': {'count': 0, 'size': 0},
        'text_orig': {'count': 0, 'size': 0},
        'tei_xml': {'count': 0, 'size': 0},
        'pdf': {'count': 0, 'size': 0},
        'snippets': {'files': 0, 'count': 0, 'size': 0},
        'csv': {'rows': 0, 'count': 0, 'size': 0},
        'routes': {'routes': 0, 'count': 0, 'size': 0},
        'stats': {'count': 0, 'size': 0},
        'rdf': {'count': 0, 'size': 0}
    }

    for analysis in analyses:
        # Extract counts from display text using regex
        import re

        for key in ['manifest', 'node_index', 'html_fragments', 'snippets', 'csv', 'routes']:
            if key not in analysis:
                continue
            text = analysis[key][2]  # Get display text

            if key == 'manifest':
                # Extract canvas count - look for "N canvases"
                match = re.search(r'(\d+)\s+canvases', text)
                if match:
                    totals['manifest']['canvases'] += int(match.group(1))
                    totals['manifest']['count'] += 1

            elif key == 'node_index':
                # Extract node count - look for "N nodes"
                match = re.search(r'(\d+)\s+nodes', text)
                if match:
                    totals['node_index']['nodes'] += int(match.group(1))
                    totals['node_index']['count'] += 1

            elif key in ['html_fragments', 'snippets']:
                # Extract file count - look for "N file(s)"
                match = re.search(r'(\d+)\s+files?', text)
                if match:
                    totals[key]['files'] += int(match.group(1))
                    totals[key]['count'] += 1

            elif key == 'csv':
                # Extract row count - look for "N rows"
                match = re.search(r'(\d+)\s+rows', text)
                if match:
                    totals['csv']['rows'] += int(match.group(1))
                    totals['csv']['count'] += 1

            elif key == 'routes':
                # Extract route count - look for "N routes"
                match = re.search(r'(\d+)\s+routes', text)
                if match:
                    totals['routes']['routes'] += int(match.group(1))
                    totals['routes']['count'] += 1

        # Aggregate file sizes from _sizes metadata
        if '_sizes' in analysis:
            sizes = analysis['_sizes']
            for key, size in sizes.items():
                if key in totals and size > 0:
                    totals[key]['size'] += size
                    # Count non-zero sizes for files without other counts
                    if key in ['pages', 'toc', 'details', 'text_edit', 'text_orig', 'tei_xml', 'pdf', 'stats', 'rdf']:
                        if size > 0:
                            totals[key]['count'] += 1

    # Generate totals row with both counts and sizes, plus tooltips and unmonitored classes
    totals_cells = []

    # Manifest
    if totals['manifest']['count'] > 0:
        parts = [f"{totals['manifest']['canvases']:,} canvases"]
        if totals['manifest']['size'] > 0:
            parts.append(format_file_size(totals['manifest']['size']))
        totals_cells.append(f'<td title="IIIF Manifest">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="IIIF Manifest">—</td>')

    # Node Index
    if totals['node_index']['count'] > 0:
        parts = [f"{totals['node_index']['nodes']:,} nodes"]
        if totals['node_index']['size'] > 0:
            parts.append(format_file_size(totals['node_index']['size']))
        totals_cells.append(f'<td title="Node Index">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="Node Index">—</td>')

    # HTML Fragments
    if totals['html_fragments']['count'] > 0:
        parts = [f"{totals['html_fragments']['files']:,} files"]
        if totals['html_fragments']['size'] > 0:
            parts.append(format_file_size(totals['html_fragments']['size']))
        totals_cells.append(f'<td title="HTML Fragments">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="HTML Fragments">—</td>')

    # Pages Nav
    if totals['pages']['size'] > 0:
        totals_cells.append(f'<td title="Pages Navigation">{format_file_size(totals["pages"]["size"])}</td>')
    else:
        totals_cells.append('<td title="Pages Navigation">—</td>')

    # TOC Nav
    if totals['toc']['size'] > 0:
        totals_cells.append(f'<td title="TOC Navigation">{format_file_size(totals["toc"]["size"])}</td>')
    else:
        totals_cells.append('<td title="TOC Navigation">—</td>')

    # Details
    if totals['details']['size'] > 0:
        totals_cells.append(f'<td title="Details Page">{format_file_size(totals["details"]["size"])}</td>')
    else:
        totals_cells.append('<td title="Details Page">—</td>')

    # Text Edit
    if totals['text_edit']['size'] > 0:
        totals_cells.append(f'<td title="Text (Edit)">{format_file_size(totals["text_edit"]["size"])}</td>')
    else:
        totals_cells.append('<td title="Text (Edit)">—</td>')

    # Text Orig
    if totals['text_orig']['size'] > 0:
        totals_cells.append(f'<td title="Text (Orig)">{format_file_size(totals["text_orig"]["size"])}</td>')
    else:
        totals_cells.append('<td title="Text (Orig)">—</td>')

    # TEI XML
    if totals['tei_xml']['size'] > 0:
        totals_cells.append(f'<td title="TEI XML Source">{format_file_size(totals["tei_xml"]["size"])}</td>')
    else:
        totals_cells.append('<td title="TEI XML Source">—</td>')

    # PDF
    if totals['pdf']['size'] > 0:
        totals_cells.append(f'<td title="PDF">{format_file_size(totals["pdf"]["size"])}</td>')
    else:
        totals_cells.append('<td title="PDF">—</td>')

    # Snippets
    if totals['snippets']['count'] > 0:
        parts = [f"{totals['snippets']['files']:,} files"]
        if totals['snippets']['size'] > 0:
            parts.append(format_file_size(totals['snippets']['size']))
        totals_cells.append(f'<td title="Search Snippets">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="Search Snippets">—</td>')

    # CSV
    if totals['csv']['count'] > 0:
        parts = [f"{totals['csv']['rows']:,} rows"]
        if totals['csv']['size'] > 0:
            parts.append(format_file_size(totals['csv']['size']))
        totals_cells.append(f'<td title="CSV Export">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="CSV Export">—</td>')

    # Routes
    if totals['routes']['count'] > 0:
        parts = [f"{totals['routes']['routes']:,} routes"]
        if totals['routes']['size'] > 0:
            parts.append(format_file_size(totals['routes']['size']))
        totals_cells.append(f'<td title="Routes">{", ".join(parts)}</td>')
    else:
        totals_cells.append('<td title="Routes">—</td>')

    # Stats
    stats_class = ' class="unmonitored-column"' if 'stats' in UNMONITORED_FILE_TYPES else ''
    if totals['stats']['size'] > 0:
        totals_cells.append(f'<td{stats_class} title="Statistics">{format_file_size(totals["stats"]["size"])}</td>')
    else:
        totals_cells.append(f'<td{stats_class} title="Statistics">—</td>')

    # RDF
    rdf_class = ' class="unmonitored-column"' if 'rdf' in UNMONITORED_FILE_TYPES else ''
    if totals['rdf']['size'] > 0:
        totals_cells.append(f'<td{rdf_class} title="RDF Export">{format_file_size(totals["rdf"]["size"])}</td>')
    else:
        totals_cells.append(f'<td{rdf_class} title="RDF Export">—</td>')

    totals_row = '\n                        '.join(totals_cells)

    # Column labels for tooltips
    column_labels = {
        'manifest': 'IIIF Manifest',
        'node_index': 'Node Index',
        'html_fragments': 'HTML Fragments',
        'pages': 'Pages Navigation',
        'toc': 'TOC Navigation',
        'details': 'Details Page',
        'text_edit': 'Text (Edit)',
        'text_orig': 'Text (Orig)',
        'tei_xml': 'TEI XML Source',
        'pdf': 'PDF',
        'snippets': 'Search Snippets',
        'csv': 'CSV Export',
        'routes': 'Routes',
        'stats': 'Statistics',
        'rdf': 'RDF Export'
    }

    # Generate table rows
    rows = []
    for analysis in analyses:
        work_id = analysis['work_id']

        # Build type indicator
        type_parts = []
        if analysis['is_dummy']:
            type_parts.append("Metadata Only")
        else:
            type_parts.append("Full")

        if analysis.get('is_multivolume', False):
            type_parts.append('<span class="volume-indicator">(Multi-volume)</span>')

        work_type = '<br>'.join(type_parts)

        # Format each cell with tooltip and link
        row = f"""                <tr>
                    <td class="work-id">{work_id}</td>
                    <td class="dummy-indicator">{work_type}</td>
                    {format_cell(analysis['manifest'], work_id, 'manifest', column_labels['manifest'])}
                    {format_cell(analysis['node_index'], work_id, 'node_index', column_labels['node_index'])}
                    {format_cell(analysis['html_fragments'], work_id, 'html_fragments', column_labels['html_fragments'])}
                    {format_cell(analysis['pages'], work_id, 'pages', column_labels['pages'])}
                    {format_cell(analysis['toc'], work_id, 'toc', column_labels['toc'])}
                    {format_cell(analysis['details'], work_id, 'details', column_labels['details'])}
                    {format_cell(analysis['text_edit'], work_id, 'text_edit', column_labels['text_edit'])}
                    {format_cell(analysis['text_orig'], work_id, 'text_orig', column_labels['text_orig'])}
                    {format_cell(analysis['tei_xml'], work_id, 'tei_xml', column_labels['tei_xml'])}
                    {format_cell(analysis['pdf'], work_id, 'pdf', column_labels['pdf'])}
                    {format_cell(analysis['snippets'], work_id, 'snippets', column_labels['snippets'])}
                    {format_cell(analysis['csv'], work_id, 'csv', column_labels['csv'])}
                    {format_cell(analysis['routes'], work_id, 'routes', column_labels['routes'])}
                    {format_cell(analysis['stats'], work_id, 'stats', column_labels['stats'])}
                    {format_cell(analysis['rdf'], work_id, 'rdf', column_labels['rdf'])}
                </tr>"""
        rows.append(row)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total_size_str = format_file_size(total_size)

    # Map unmonitored file types to readable column names
    column_name_map = {
        'stats': 'Stats',
        'rdf': 'RDF'
    }
    unmonitored_columns = ', '.join(column_name_map.get(ft, ft) for ft in sorted(UNMONITORED_FILE_TYPES))

    # Determine header classes for stats and rdf columns based on monitoring status
    stats_header_class = ' class="unmonitored-header"' if 'stats' in UNMONITORED_FILE_TYPES else ''
    rdf_header_class = ' class="unmonitored-header"' if 'rdf' in UNMONITORED_FILE_TYPES else ''

    return HTML_TEMPLATE.format(
        timestamp=timestamp,
        total_works=total_works,
        full_works=full_works,
        dummy_works=dummy_works,
        multivolume_works=multivolume_works,
        issues_count=works_with_issues,
        total_files=total_files,
        total_size_str=total_size_str,
        unmonitored_columns=unmonitored_columns,
        fragment_threshold=FRAGMENT_AGE_THRESHOLD_HOURS,
        stats_header_class=stats_header_class,
        rdf_header_class=rdf_header_class,
        table_rows='\n'.join(rows),
        totals_row=totals_row
    )

##############################################################################
# Main Execution
##############################################################################

def main():
    """Main execution function"""

    # Validate data directory
    data_dir = Path(PROJECT_DATA_DIR)
    if not data_dir.exists():
        log(f"Error: PROJECT_DATA_DIR '{data_dir}' does not exist")
        sys.exit(1)

    log(f"TEI Monitor - Analyzing derivatives from {data_dir}")
    log(f"Fragment age threshold: {FRAGMENT_AGE_THRESHOLD_HOURS}h")
    log(f"Manifest age threshold: {MANIFEST_AGE_THRESHOLD_HOURS}h")
    if LOG_FILE:
        log(f"Logging to: {LOG_FILE}", to_stderr=False)

    # Find all work directories matching W[0-9]{4}
    work_dirs = [d for d in data_dir.iterdir()
                 if d.is_dir() and WORK_ID_PATTERN.match(d.name)]

    if not work_dirs:
        log("Warning: No work directories matching W[0-9]{4} found")

    log(f"Found {len(work_dirs)} works to analyze")

    # Analyze each work
    analyses = []
    for i, work_dir in enumerate(sorted(work_dirs), 1):
        try:
            # Progress indicator to stderr (overwrites previous line) - unless in quiet mode
            if not QUIET_MODE:
                print(f"\rProcessing {i}/{len(work_dirs)}: {work_dir.name}...",
                      end='', flush=True, file=sys.stderr)
            # Log to file only (without overwriting)
            if LOG_FILE:
                log(f"Processing {i}/{len(work_dirs)}: {work_dir.name}", to_stderr=False)

            work = WorkAnalysis(work_dir)
            analysis = work.analyze()
            analyses.append(analysis)
        except Exception as e:
            # Clear the progress line before error message (if not in quiet mode)
            if not QUIET_MODE:
                print('\r' + ' ' * 80 + '\r', end='', file=sys.stderr)
            log(f"Error analyzing {work_dir.name}: {e}")
            import traceback
            log(traceback.format_exc())

    # Clear the progress line after completion (if not in quiet mode)
    if not QUIET_MODE:
        print('\r' + ' ' * 80 + '\r', end='', file=sys.stderr)

    # Generate HTML to stdout
    html = generate_html(analyses)
    print(html)

    log(f"Dashboard generated successfully! Total works analyzed: {len(analyses)}")

    # Close log file if open
    close_log()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        log("\nInterrupted by user")
        close_log()
        sys.exit(1)
    except Exception as e:
        log(f"Fatal error: {e}")
        import traceback
        log(traceback.format_exc())
        close_log()
        sys.exit(1)
