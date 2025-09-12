#!/bin/bash
file="wordforms-united.txt"
backup_file="wordforms-united-backup-$(date +%Y%m%d).txt"

# Create backup
cp "$file" "$backup_file"
echo "Backup created: $backup_file"

echo "Detecting and resolving charset_table conflicts..."

awk -F' > ' '
{
    original = $1
    target = $2
    normalized = original
    
    # Apply the same normalization as charset_table
    gsub(/j/, "i", normalized)
    gsub(/u/, "v", normalized)
    
    # Track all entries by their normalized form
    if (normalized in entries) {
        # Conflict detected
        if (entries[normalized] != target) {
            # Different targets - this is a real conflict
            print "CONFLICT: " original " > " target " vs " existing_original[normalized] " > " entries[normalized] > "/dev/stderr"
            print "KEEPING: " existing_original[normalized] " > " entries[normalized] > "/dev/stderr"
            print "REMOVING: " original " > " target > "/dev/stderr"
            conflicts++
        } else {
            # Same target - just duplicate mappings, remove the non-normalized version
            if (original != normalized) {
                print "DUPLICATE: " original " > " target " (keeping normalized form)" > "/dev/stderr"
                duplicates++
            }
        }
    } else {
        # First time seeing this normalized form
        entries[normalized] = target
        existing_original[normalized] = original
        keep[original] = original " > " target
    }
}
END {
    print "Found " conflicts " conflicts and " duplicates " duplicates" > "/dev/stderr"
    for (entry in keep) {
        print keep[entry]
    }
}' "$file" > wordforms-united-cleaned.txt

# Report changes
original_count=$(wc -l < "$file")
cleaned_count=$(wc -l < "wordforms-united-cleaned.txt")
removed_count=$((original_count - cleaned_count))

echo "=== CLEANUP SUMMARY ==="
echo "Original entries: $original_count"
echo "Cleaned entries: $cleaned_count" 
echo "Removed entries: $removed_count"
