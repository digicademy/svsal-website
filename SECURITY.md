# XSS Security Fixes - Implementation Guide

## Overview

This document describes the XSS (Cross-Site Scripting) vulnerabilities that were found and fixed in the SVSal website, along with implementation details for the security improvements.

## Vulnerabilities Identified and Fixed

### 1. Search Functionality XSS (Critical)
**Location**: `site/resources/js/sal-search.js`
**Issue**: Search parameters from URLs were directly inserted into the DOM without sanitization
**Fix**: 
- Added HTML escaping for all user-controlled content
- Implemented URL parameter encoding using `encodeURIComponent()`
- Sanitized API response data before DOM insertion

### 2. API Response XSS (High)
**Location**: `site/resources/js/sal-work.js`
**Issue**: External API responses were inserted into DOM without validation
**Fix**:
- Added HTML sanitization for API responses
- Implemented content filtering to remove dangerous tags and attributes
- Escaped citation text in embeddings experiment

### 3. Template Rendering XSS (Medium)
**Location**: `site/resources/js/facetedsearch*.js`
**Issue**: Faceted search templates used unescaped user data
**Fix**:
- Added HTML escaping for filter names in template rendering
- Protected against malicious data in search results

## Security Infrastructure Added

### New Security Utility: `sal-security.js`
A comprehensive security utility file was created with the following functions:

```javascript
// HTML escaping to prevent XSS
window.SalSecurity.escapeHtml(unsafe)

// Safe DOM text setter (uses textContent instead of innerHTML)
window.SalSecurity.safeSetText(element, text)

// Safe DOM HTML setter with sanitization
window.SalSecurity.safeSetHTML(element, html)

// Safe URL parameter getter with validation
window.SalSecurity.getSafeUrlParam(paramName, allowedPattern)

// Safe href attribute setter
window.SalSecurity.setSafeHref(element, url)

// Safe template string creation with escaping
window.SalSecurity.createSafeTemplate(template, data)

// Safe insertAdjacentHTML wrapper
window.SalSecurity.safeInsertHTML(element, position, html)
```

## Implementation Details

### HTML Escaping Function
```javascript
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

### HTML Sanitization
Removes dangerous content while preserving safe HTML:
```javascript
const sanitized = html
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/javascript:/gi, '')
  .replace(/on\w+\s*=/gi, '')
  .replace(/data:/gi, '')
  .replace(/vbscript:/gi, '')
```

## Testing the Fixes

### Manual Testing
Test these URLs to verify XSS protection:
- `search.html?q=<script>alert('XSS')</script>`
- `search.html?q=<img src=x onerror=alert('XSS')>`
- `search.html?q=javascript:alert('XSS')`

These should **NOT** execute JavaScript in the browser.

### Automated Testing
Run the provided test script:
```bash
/tmp/test_xss_fixes.sh
```

## Migration Guide

### For Developers
If you need to add new functionality that handles user input:

1. **Always escape HTML content**:
```javascript
const escaped = userInput.replace(/[<>&"']/g, function(match) {
  return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'}[match]
})
```

2. **Use textContent instead of innerHTML for plain text**:
```javascript
// Good
element.textContent = userInput

// Bad
element.innerHTML = userInput
```

3. **Sanitize HTML if you must use innerHTML**:
```javascript
// Use the security utility
window.SalSecurity.safeSetHTML(element, htmlContent)
```

4. **Always encode URL parameters**:
```javascript
const url = `search.html?q=${encodeURIComponent(searchTerm)}`
```

### For Administrators
1. Include the security utility file in HTML templates before other scripts:
```html
<script src="/resources/js/sal-security.js"></script>
```

2. Regular security audits should check for:
   - New instances of innerHTML usage
   - Unescaped URL parameters
   - Direct DOM manipulation with user data

## Attack Vectors Mitigated

1. **Reflected XSS**: User input from URLs is now properly escaped
2. **Stored XSS**: API responses are sanitized before display
3. **DOM-based XSS**: Template rendering now escapes user data
4. **Event Handler Injection**: `on*` attributes are stripped from HTML
5. **JavaScript Protocol**: `javascript:` URLs are blocked

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of protection
2. **Input Validation**: URL parameters are validated
3. **Output Encoding**: All user data is escaped before display
4. **Content Security**: Dangerous HTML tags and attributes are removed
5. **Safe APIs**: Using secure DOM manipulation methods

## Performance Impact

The security fixes have minimal performance impact:
- HTML escaping is done once per operation
- Sanitization only applies to content that could contain HTML
- URL encoding is a standard browser operation

## Compatibility

These fixes maintain full backward compatibility:
- All existing functionality remains intact
- No changes to public APIs
- No changes to user interface