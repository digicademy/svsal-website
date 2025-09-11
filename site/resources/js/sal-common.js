/* eslint-env browser */

const validParams = ['mode', 'q', 'format', 'viewer', 'beta']
const params = (new URL(window.location.href)).searchParams
const beta = Boolean(params.get('beta'))

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

function getUrlParams (prop) {
  var params = {}
  var search = decodeURIComponent(window.location.href.slice(window.location.href.indexOf('?') + 1))
  var definitions = search.split('&')

  definitions.forEach(function (val, key) {
    var parts = val.split('=', 2)
    params[ parts[ 0 ] ] = parts[ 1 ]
  })

  return (prop && prop in params) ? params[ prop ] : params
}

function getLang () {
  if (getUrlParams('lang').length > 0 &&
          ['de', 'en', 'es'].indexOf(getUrlParams('lang').substring(0, 2)) >= 0) {
    return getUrlParams('lang').substring(0, 2)
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

// ==== Various Configuration things ===

// Navbar height
$('.navbar-collapse').css({
  maxHeight: $(window).height() - $('.navbar-header').height() + 'px'
})

// interval is in milliseconds. 1000 = 1 second - so 1000 * 10 = 10 seconds
$('.carousel').carousel({
  interval: 1500 * 10
})

// popover for citation proposal (this is a works function and should be called in sal-work.js, perhaps in sal-lemma.js, too?)
// $('[data-toggle="popover"]').popover()

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
