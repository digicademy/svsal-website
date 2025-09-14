#!/bin/bash
LOGFILE="/var/log/sphinxsearch/indexer-cron.log"

# Source config
. /etc/default/sphinxsearch

# Check if enabled and executable
if [ "$START" != "yes" ] || [ ! -x /usr/bin/indexer ]; then
    exit 0
fi

output=$(/usr/bin/indexer --quiet --rotate --all 2>&1 | grep -v "duplicate")
exit_code=$?

if [ $exit_code -eq 0 ]; then
    # Success: log, no cron e-Mail (no stdout/stderr output)
    echo "====================" >> "$LOGFILE"
    echo "$(date): Sphinx indexer completed successfully" >> "$LOGFILE"
    echo "$output" >> "$LOGFILE"
    exit $exit_code
else
    # Failure: log and send to stderr for cron e-Mail
    echo "====================" >> "$LOGFILE"
    echo "$(date): Sphinx indexer failed (exit code $exit_code)" >> "$LOGFILE"
    echo "$output" >> $LOGFILE
    echo "$output" >&2
    exit $exit_code
fi

