/* eslint-env browser */

/**
 * Security utilities for preventing XSS attacks
 * This module provides functions to safely handle user input and API responses
 */

// Simple HTML escaping function to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return unsafe
  }
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Safe DOM text setter - always use textContent instead of innerHTML for plain text
function safeSetText(element, text) {
  if (element && typeof text === 'string') {
    element.textContent = text
  }
}

// Safe DOM HTML setter with basic sanitization
function safeSetHTML(element, html) {
  if (!element) return
  
  if (typeof html !== 'string') {
    element.textContent = String(html)
    return
  }
  
  // Basic HTML sanitization - remove script tags and dangerous attributes
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
  
  element.innerHTML = sanitized
}

// Safe URL parameter getter with validation
function getSafeUrlParam(paramName, allowedPattern = null) {
  const params = new URLSearchParams(window.location.search)
  const value = params.get(paramName)
  
  if (!value) return ''
  
  // If a pattern is provided, validate against it
  if (allowedPattern && !allowedPattern.test(value)) {
    console.warn(`Invalid parameter value for ${paramName}: ${value}`)
    return ''
  }
  
  return value
}

// Safe href attribute setter
function setSafeHref(element, url) {
  if (!element || !url) return
  
  try {
    // Parse URL to validate it
    const parsedUrl = new URL(url, window.location.origin)
    
    // Only allow http, https, and relative URLs
    if (['http:', 'https:', ''].includes(parsedUrl.protocol)) {
      element.href = parsedUrl.href
    } else {
      console.warn(`Blocked potentially dangerous URL: ${url}`)
    }
  } catch (e) {
    console.warn(`Invalid URL: ${url}`)
  }
}

// Safe template string creation with HTML escaping
function createSafeTemplate(template, data) {
  let result = template
  
  for (const [key, value] of Object.entries(data)) {
    const escapedValue = escapeHtml(String(value))
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escapedValue)
  }
  
  return result
}

// Safe insertAdjacentHTML wrapper
function safeInsertHTML(element, position, html) {
  if (!element || !html) return
  
  // Sanitize the HTML before insertion
  const sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
  
  element.insertAdjacentHTML(position, sanitized)
}

// Export functions to global scope for use in other scripts
// This is being called from other JS scripts loaded from the HTML file
// eslint-disable-next-line no-unused-vars
window.SalSecurity = {
  escapeHtml,
  safeSetText,
  safeSetHTML,
  getSafeUrlParam,
  setSafeHref,
  createSafeTemplate,
  safeInsertHTML
}