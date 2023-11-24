/* eslint-disable space-before-function-paren */
/* eslint-env browser */

// ==== Various Configuration things ===

// Navbar height
$('.navbar-collapse').css({
  maxHeight: $(window).height() - $('.navbar-header').height() + 'px'
})

// interval is in milliseconds. 1000 = 1 second - so 1000 * 10 = 10 seconds
$('.carousel').carousel({
  interval: 1500 * 10
})

// ppover for citation proposal
$('[data-toggle="popover"]').popover()

// ==== Binding events ====

// hide navbar when clicking anywhere
jQuery('body').bind('click', function (e) {
  if (jQuery(e.target).closest('.navbar-collapse').length === 0) { // close collapsible navbar (small views)
    var opened = jQuery('.navbar-collapse').hasClass('in')
    if (opened === true) {
      jQuery('.navbar-collapse').collapse('hide')
    }
  }
  if ($(e.target).data('toggle') !== 'popover' && $(e.target).parents('.popover.in').length === 0) {  // close popover boxes
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
    SyntaxHighlighter.all()
  }
})
