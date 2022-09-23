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
