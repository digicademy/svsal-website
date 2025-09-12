/* eslint-env browser */

// ==== Config settings ====

const EMBEDDINGS_SERVER = 'https://c100-188.cloud.gwdg.de/vdb-api/v1'
const EMBEDDINGS_PROJECT = 'sal/sal-openai-large'
const EMBEDDINGS_THRESHOLD = 0.75
const EMBEDDINGS_LIMIT = 5
const EMBEDDINGS_SUMMARY_SERVER = 'https://api.openai.com/v1/chat/completions'
const EMBEDDINGS_SUMMARY_MODEL = 'gpt-5-nano'
const EMBEDDINGS_SUMMARY_TEMP = 0.4
const SPHINX_SERVER = 'https://search.salamanca.school/lemmatized'

// Navbar height
$('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })

// Carousel interval
$('.carousel').carousel({ interval: 1500 * 10 }) // interval is in milliseconds. 1000 = 1 second - so 1000 * 10 = 10 seconds

// ==== Sanitization functions ====

// Get and sanitize URL query parameters
const validParams = ['mode', 'format', 'viewer', 'beta', 'lang', 'q', 'field', 'offset', 'limit', 'wid', 'frag']
const params = (new URL(window.location.href)).searchParams
sanitizeParams()
const beta = Boolean(params.get('beta'))

// Sanitize URL query parameters
function sanitizeParams() {
  params.forEach(function (value, key) {
    if (!validParams.includes(key)) {
      params.delete(key)                                 // remove any invalid parameters
    } else {
      params.set(key, params.get(key).substring(0, 200)) // limit length of parameters to 200 chars
    }
  })
}

// Sanitize strings, used for user input
function sanitizeText(input) {
  const escapedInput = input
    .replace(/[<>&"']/g, function(match) {
        return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'}[match]
      })
  return escapedInput
}

// Sanitize html we are constructing ourselves
function sanitizeHTML(input) {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
}

// Ensure a string is properly URL-encoded
function ensureUrlEncoded (str) {
  try {
    const decoded = decodeURIComponent(str)
    const reencoded = encodeURIComponent(decoded)
    // if reencoded === original, it was already (properly) encoded,
    // otherwise return the normalized encoded form
    return reencoded === str ? str : reencoded
  } catch (e) {
    // malformed percent-escapes — just encode the original string
    return encodeURIComponent(str)
  }
}

// ==== Beta Feature Switch ====

function showBeta () {
  // show beta features if beta is activated via commandline switch
  if (beta) {
    document.querySelectorAll('.beta').forEach(function (el) {
      el.style.display = 'block'
    })
  }
}

// ==== Other helper functions ====

// This is being called from other JS scripts loaded from the HTML file
// eslint-disable-next-line no-unused-vars
function getI18nAccessString () {
  var accessed
  var date
  var lang = getLang()
  if (!['es', 'de', 'en'].includes(lang)) lang = 'en'
  var current = new Date()
  var options = { year: 'numeric', month: 'long', day: 'numeric' }
  if (lang === 'de') {
    accessed = 'Aufgerufen am'
    date = current.toLocaleDateString('de-DE', options)
  } else if (lang === 'es') {
    accessed = 'Consultado por última vez el'
    date = current.toLocaleDateString('es-ES', options)
  } else {
    accessed = 'Accessed'
    date = current.toLocaleDateString('en-GB', options)
  }
  return '(' + accessed + ' ' + date + ')'
}

function getLang () {
  if (params.get('lang').length > 0 &&
          ['de', 'en', 'es'].indexOf(params.get('lang').substring(0, 2)) >= 0) {
    return params.get('lang').substring(0, 2)
  } else if (window.location.href.indexOf('/de/') !== -1) return 'de'
  else if (window.location.href.indexOf('/es/') !== -1) return 'es'
  else return 'en'
}

// This is being called from other sal-search.js and sal-work.js scripts
// eslint-disable-next-line no-unused-vars
function updateURLParameter (url, param, paramVal) {
  let newUrl = new URL(url);
  if (newUrl.searchParams.get(param) === paramVal) {
    return url;
  }
  newUrl.searchParams.set(param, paramVal);
  return newUrl.href;
};

// ==== Binding events ====

// hide navbar when clicking anywhere
jQuery('body').bind('click', function (e) {
  if (jQuery(e.target).closest('.navbar-collapse').length === 0) { // close collapsible navbar (small views)
    var opened = jQuery('.navbar-collapse').hasClass('in')
    if (opened === true) {
      jQuery('.navbar-collapse').collapse('hide')
    }
  }
  if ($(e.target).data('toggle') !== 'popover' && $(e.target).parents('.popover.in').length === 0) { // close popover boxes
    $('[data-toggle="popover"]').popover('hide')
  }
})

// ==== Do things when everything is ready ====

$(document).ready(function () {
  $('#content').css('padding-top', parseInt($('.alert').css('height')) + 2)
  $('#backTop').backTop({ // put Back-to-top arrow in good position
    'position': 100,
    'speed': 200,
    'color': 'white'
  })
  if (typeof SyntaxHighlighter !== 'undefined') { // enable syntax highlighting if loaded
    // This is being called only when some external script has defined it
    // eslint-disable-next-line no-undef
    SyntaxHighlighter.all()
  }
})
