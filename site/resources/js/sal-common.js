/* eslint-env browser */

function highlightSpanClassInText (htmlClass, invokingElement) {
  // make all htmlClass elements have the inverse highlighting of the invoking element ...
  if (document.getElementById(invokingElement).classList.contains('highlighted')) {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.remove('highlighted') })
  } else {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.add('highlighted') })
  }
  // ... then toggle the highlighting also for the invoking element
  document.getElementById(invokingElement).classList.toggle('highlighted')
/* $(invokingElement).children('span').toggleClass('glyphicon-check glyphicon-unchecked'); */
};

function toggleOrigEditMode (invokingElement) {
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.toggle('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.toggle('unsichtbar') })
};

function applyOrigMode () {
  // console.log('Setting viewing mode to orig.');
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.add('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.remove('unsichtbar') })
  var params = new URLSearchParams(window.location.search)
  params.set('mode', 'orig')
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  $('.next, .prev, .top').each(function (i, obj) {
    var nextParams = new URLSearchParams(obj.href.search)
    nextParams.set('mode', 'orig')
    obj.href = obj.pathname + '?' + nextParams
  })
};

function applyEditMode () {
  // console.log('Setting viewing mode to edit.');
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.add('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.remove('unsichtbar') })
  var params = new URLSearchParams(window.location.search)
  params.set('mode', 'edit')
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  $('.next, .prev, .top').each(function (i, obj) {
    var nextParams = new URLSearchParams(obj.href.search)
    nextParams.set('mode', 'edit')
    obj.href = obj.pathname + '?' + nextParams
  })
};

function applyMode () {
  let queryParams = new URLSearchParams(window.location.search)
  let mode = queryParams.get('mode')
  if (mode === 'orig') {
    applyOrigMode()
  } else {
    applyEditMode()
  }
};

jQuery('body').bind('click', function(e) {                                              // hide navbar when clicking anywhere
  if(jQuery(e.target).closest('.navbar-collapse').length == 0) {
      // click happened outside of .navbar, so hide
      var opened = jQuery('.navbar-collapse').hasClass('in');
      if ( opened === true ) {
          jQuery('.navbar-collapse').collapse('hide');
      }
  }
});

$(".navbar-collapse").css({ maxHeight: $(window).height() - $(".navbar-header").height() + "px" });  // set navbar height

// interval is in milliseconds. 1000 = 1 second - so 1000 * 10 = 10 seconds
  $('.carousel').carousel({
    interval: 1500 * 10
});

$(document).ready(function () {
  $("#content").css('padding-top', parseInt($('.alert').css("height")) + 2);
  $('#backTop').backTop({                                                                 // Position Back-to-top arrow
      'position' : 100,
      'speed' : 200,
      'color' : 'white',
  });
});
