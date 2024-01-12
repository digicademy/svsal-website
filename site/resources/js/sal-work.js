/* eslint-env browser */

var params = (new URL(window.location.href)).searchParams

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
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
}

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function toggleOrigEditMode (invokingElement) {
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.toggle('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.toggle('unsichtbar') })
}
function applyOrigMode () {
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.add('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.remove('unsichtbar') })
  params.set('mode', 'orig')
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  console.log('applyOrigMode: ' + (null, '', window.location.pathname + '?' + params + window.location.hash))
  $('.next, .prev, .top').each(function (i, obj) {
    var nextParams = (new URL(obj.href)).searchParams
    nextParams.set('mode', 'orig')
    obj.href = obj.pathname + '?' + nextParams
  })
}
function applyEditMode () {
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.add('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('edited'), function (el) { el.classList.remove('unsichtbar') })
  params.set('mode', 'edit')
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  console.log('applyEditMode: ' + (null, '', window.location.pathname + '?' + params + window.location.hash))
  $('.next, .prev, .top').each(function (i, obj) {
    var nextParams = (new URL(obj.href)).searchParams
    nextParams.set('mode', 'edit')
    obj.href = obj.pathname + '?' + nextParams
  })
}
function applyMode () {
  let mode = params.get('mode')
  if (mode === 'orig') {
    applyOrigMode()
  } else {
    applyEditMode()
  }
}

// This takes a html string and returns a version with highlighted searchterms
async function highlightTransform (origHTML, searchTerm) {
  console.log('searchTerm: ' + searchTerm)
  const endpoint = 'https://search.salamanca.school/lemmatized/excerpts'
  const myFormData = new FormData()
  myFormData.append('opts[limit]', '0')
  myFormData.append('opts[html_strip_mode]', 'retain')
  myFormData.append('opts[query_mode]', 'true')
  myFormData.append('words', searchTerm)
  myFormData.append('docs[0]', origHTML)

  const myOptions = {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    body: myFormData // body data type must match "Content-Type" header
  }

  // Send request and handle response
  window.fetch(endpoint, myOptions)
    .then(response => { // Check network status and return response's text content
      if (!response.ok) {
        console.log(myOptions)
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then(str => { // Parse OpenSearch xml document and return rss/channel
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/html')
      const errorNode = doc.querySelector('parsererror')
      console.log('This is string' + str)
      if (errorNode) {
        throw new Error('Response could not be parsed as html')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Push highlighted HTML to target element
      var doc1 = data.getElementsByTagName('item')[0].getElementsByTagName('description')[0].outerHTML
      console.log('This is doc1: ' + doc1)
      return doc1
    })
    .catch(error => {
      console.error('There has been a problem with the fetch operation in highlightSearch(): ', error)
      return origHTML
    })
}

// This replaces innerHTML of the element with id 'targetElementId'
// with a highlighted version of the original HTML
async function highlightReplace (origHTML, searchTerm, targetElementId) {
  console.log('searchTerm: ' + searchTerm)
  const endpoint = 'https://search.salamanca.school/lemmatized/excerpts'
  const myFormData = new FormData()
  myFormData.append('opts[limit]', '0')
  myFormData.append('opts[html_strip_mode]', 'retain')
  myFormData.append('opts[query_mode]', 'true')
  myFormData.append('words', searchTerm)
  myFormData.append('docs[0]', origHTML)

  const myOptions = {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    body: myFormData // body data type must match "Content-Type" header
  }

  // Send request and handle response
  window.fetch(endpoint, myOptions)
    .then(response => { // Check network status and return response's text content
      if (!response.ok) {
        console.log('Network response was not OK')
        console.log(myOptions)
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then(str => { // Parse OpenSearch xml document and return rss/channel
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/html')
      const errorNode = doc.querySelector('parsererror')
      // console.log('This is string' + str)
      if (errorNode) {
        throw new Error('Response could not be parsed as html')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Push highlighted HTML to target element
      var doc1 = data.getElementsByTagName('item')[0].getElementsByTagName('description')[0].outerHTML
      // console.log('This is doc1: ' + doc1)
      if (document.getElementById(targetElementId).innerHTML !== null) { // document.getElementById(fragId).parentElement.nextElementSibling.innerHTML != null)
        document.getElementById(targetElementId).innerHTML = doc1
      }
    })
    .catch(error => {
      console.error('There has been a problem with the fetch operation in highlightSearch(): ', error)
      if (document.getElementById(targetElementId).innerHTML !== null) { // document.getElementById(fragId).parentElement.nextElementSibling.innerHTML != null)
        document.getElementById(targetElementId).innerHTML = origHTML
      }
    })
}

// This checks if a searchTerm URL query parameter is present (?q=XY)
// and, if so, replaces innerHTML of the InfiniteAjaxScroll #iasContainer element
// with version of the original HTML that has the search term highlighted
function highlightSearchTerm () {
  let searchTerm = params.has('q') ? params.get('q') : ''
  if (searchTerm.length > 0) {
    const targetElementId = 'iasContainer'
    const origHTML = document.getElementById(targetElementId).innerHTML.trim()
    highlightReplace(origHTML, searchTerm, targetElementId)
    $('.next, .prev, .top').each(function (i, obj) {
      var nextParams = (new URL(obj.href)).searchParams
      nextParams.set('q', 'searchTerm')
      obj.href = obj.pathname + '?' + nextParams
    })
  }
}

// Scroll an anchor into view if we have one
function myScrollIntoView (targetId) {
  const offset = document.getElementById(targetId).offset().top
  console.log(`document.getElementById('${targetId}').offset().top = ${offset}.`)
  const goHere = offset - parseInt($('div.navbar-white').css('height')) - 15
  console.log(`Go to ${goHere}.`)
  $('html, body').animate({scrollTop: goHere}, 800, 'swing', function () {
    document.getElementById(targetId).effect('highlight', {color: 'LightSkyBlue'}, 1200)
  })
  document.getElementById(targetId).effect('highlight', {color: 'LightSkyBlue'}, 1200)
}

$('a[href*="#"]').click(function (event) {
  const z = $(this).attr('href').slice($(this).attr('href').indexOf('#') + 1)
  if ($(z).length !== 0) {
    console.log(`Going locally to ${z} ...`)
    myScrollIntoView(z)
    event.preventDefault()
  }
})

// Load Paginator content when clicking on dropdown-menu
function loadPaginatorContent () {
  var $self = `<span data-template="app:loadWRKpagination"></span>`
  $('#loadMeLast').innerHtml = ($self + '#later li')
}

// TOC tree
$('#tableOfConts')
  .bind('loaded.jstree', function (e, data) {
    $('#tableOfConts')
      .jstree(true)
      .open_node($('#tableOfConts').find('li').first())
  })
  .bind('select_node.jstree', function (e, data) {
    var href = data.node.a_attr.href
    document.location.href = href
  })
  .jstree({ 'core': { } })

// toggle TOC tree
$(function () {
  $('#toggleButton').click(function () {
    if ($('button[id="toggleButton"]').hasClass('expanded')) {
      $('#tableOfConts').jstree('close_all')
      $('button[id="toggleButton"]').removeClass('expanded').addClass('collapsed')
      $('span[class="glyphicon glyphicon-resize-small"]').removeClass('glyphicon glyphicon-resize-small').addClass('glyphicon glyphicon-fullscreen')
    } else if ($('button[id="toggleButton"]').hasClass('collapsed')) {
      $('#tableOfConts').jstree('open_all')
      $('button[id="toggleButton"]').removeClass('collapsed').addClass('expanded')
      $('span[class="glyphicon glyphicon-fullscreen"]').removeClass('glyphicon glyphicon-fullscreen').addClass('glyphicon glyphicon-resize-small')
    }
  })
})

// Close Modal on Clicking a TOC link
$('.hideMe').click(function () {
  // 'this' would reference the anchor that was clicked
  $('#myModal').modal('hide')
})

// Do not close export menu on click
$(document).on('click', '.dropdown-menu.export-options', function (e) {
  e.stopPropagation()
})

// Paragraph popup with link, refresh and print icons
$('[data-rel="popover"]').popover({
  trigger: 'click',
  animation: 'true',
  placement: 'bottom',
  container: 'body',
  template: '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
  html: true,
  title: function () { return $('#popover-head').html() },
  content: function () {
    toolboxHighlight(this, 'on')
    return $(this).siblings('.sal-toolbox-body').html()
  }
  // close popup by clicking outside
}).click(function (event) { event.preventDefault() }) // don't jump around to the anchor associated with the span
$('body').on('click', function (event) {
  $('[data-rel="popover"]').each(function () {
    event.preventDefault()
    if (!$(this).is(event.target) &&
            $(this).has(event.target).length === 0 &&
            $('.popover').has(event.target).length === 0) {
      toolboxHighlight(this, 'off')
      $(this).popover('hide')
    }
  })
})
function toolboxHighlight (elem, mode) {
  var target = elem.parentElement.nextElementSibling
  if (mode === 'on') {
    if (elem.parentElement.className === 'sal-toolbox-marginal') {
      elem.style.visibility = 'visible'
    }
    elem.style.setProperty('color', '#102873', 'important')
    target.style.backgroundColor = '#F0F0F0'
  } else if (mode === 'off') {
    elem.style.removeProperty('color')
    target.style.backgroundColor = ''
    if (elem.parentElement.className === 'sal-toolbox-marginal') {
      elem.style.removeProperty('visibility')
    }
  }
}

// Toolboxes: highlighting and copy functions
// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function copyLink (elem) {
  var target = elem.parentElement.getElementsByClassName('cite-link')[0]
  var input = document.createElement('textarea')
  input.setAttribute('style', 'width:0;height:0;opacity:0;') // hidden
  input.textContent = target.textContent
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  copyNotify(elem)
  document.body.removeChild(input)
}
// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function copyCitRef (elem) {
  var target = elem.parentElement.getElementsByClassName('sal-cite-rec')[0]
  var input = document.createElement('textarea')
  input.setAttribute('style', 'display:block; width:0; height:0; opacity: 0;')
  // construct string to be copied: get pre-rendered work/passage citation strings and insert the current date
  var v1 = target.getElementsByClassName('cite-rec-body')[0].textContent
  // This is defined in the sal-common.js file loaded from the HTML file
  // eslint-disable-next-line no-undef
  var v2 = getI18nAccessString()
  input.textContent = v1 + ' ' + v2
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  copyNotify(elem)
  document.body.removeChild(input)
}
function copyNotify (elem) {
  var del = elem.parentElement.getElementsByClassName('.copy-alert')[0]
  if (typeof del !== 'undefined' && del !== null) {
    elem.parentElement.removeChild(del)
  }
  // This is defined in the sal-common.js file loaded from the HTML file
  // eslint-disable-next-line no-undef
  var language = getLang()
  console.log('$lang=' + language)
  var msg
  if (language === 'de') {
    msg = 'In die Zwischenablage kopiert'
  } else if (language === 'es') {
    msg = 'Copiado al portapapeles'
  } else {
    msg = 'Copied to clipboard'
  }
  var popup = document.createElement('span')
  popup.setAttribute('class', 'copy-alert')
  popup.textContent = msg
  elem.parentElement.appendChild(popup)
  setTimeout(function () {
    $('.copy-alert').fadeOut(1000)
  }, 1500)
}

// Image Viewer
var myViewer
async function loadTify (manifest) {
  let tifyOptions = {
    container: '#Viewer',
    // This is defined in the sal-common.js file loaded from the HTML file
    // eslint-disable-next-line no-undef
    language: getLang(),
    manifestUrl: manifest, // https://example.com/iiif/manifest.json',
    pageLabelFormat: 'P', // P: physical page number, L: logical page number
    zoom: null
  }
  // This is defined in the JS file loaded from the HTML file
  // eslint-disable-next-line no-undef
  myViewer = new Tify(tifyOptions)
}

/*
  let domain = document.getElementById('Viewer').dataset.domain
  let wid = document.getElementById('Viewer').dataset.wid
  let tifyOptions = {
      container: '#Viewer',
      // filters: { brightness: 0.5, contrast: 0.5, saturation: 2.3 },
      language: getLang(),
      manifestUrl: 'https://facs.' + domain + '/iiif/presentation/' + wid,       // https://example.com/iiif/manifest.json',
      pageLabelFormat: 'P', // P: physical page number, L: logical page number
      // pages: [0, 3], // default: null. The page(s) to display initially. If null, the initial page is determined by the manifest’s startCanvas
      // pan: { x: .45, y: .6 }, // Initial pan. By default, the image is centered
      // urlQueryKey: 'salView1', // Specify instance to manipulate via query parameters
      // urlQueryParams: [], // Which settings can be manipulated via query parameters? Default: ['filters', 'pages', 'pan', 'rotation', 'view', 'zoom']
      // view: '', // Default: ''. The initially displayed view (panel); scan, fulltext, thumbnails, toc, info, help, or empty (same as scan).
      // viewer: {}, // An object with options for OpenSeadragon
      zoom: null,
  }
  let myViewer = new Tify (tifyOptions)
*/

async function setTifyPage (canvasId, title) {
  let requestedManifest = canvasId.split('/canvas/')[0]
  if (typeof myViewer !== 'undefined') {
    let currentManifest = myViewer.options.manifestUrl
    if (requestedManifest === currentManifest) {
      let canvases = myViewer.app.canvases
      // console.log(canvases);
      // console.log(`search canvases for @id === ${canvasId} ...`);
      let targetCanvas = canvases.find((x) => x['@id'] === canvasId)
      // console.log(`found canvas:`);
      // console.log(targetCanvas);
      if (typeof targetCanvas !== 'undefined') {
        let targetPage = targetCanvas.page
        // console.log(`found page number ${targetPage}.`);
        myViewer.ready.then(() => {
          myViewer.setPage([targetPage])
        })
        // Update some values of the dialog popup window
        $('#parent small').text(title) // update Viewer Heading
        $('#parent div').attr('title', title) // update Viewer Title
        // // $('#Viewer')[0].contentDocument.getElementById('downloadImages').href = 'http://facs.salamanca.school/{{$id}}/{{$id}}.zip';  // update Download button
        // $('#Viewer')[0].contentDocument.getElementById('downloadImages').setAttribute('download', '{{$id}}.zip');  // update Download button
      }
      return
    }
  }
  console.log(`loading of new manifest is necessary: ${requestedManifest} ...`)
  await loadTify(requestedManifest)
  myViewer.ready.then(() => {
    console.log(myViewer)
    let canvases = myViewer.app.canvases
    console.log(`canvases:`)
    console.log(canvases)
    console.log(`...`)
    console.log(`search canvases for @id === ${canvasId} ...`)
    let targetCanvas = canvases.find((x) => x['@id'] === canvasId)
    console.log(targetCanvas)
    if (typeof targetCanvas !== 'undefined') {
      let targetPage = targetCanvas.page
      console.log(`found page number ${targetPage}.`)
      myViewer.ready.then(() => {
        myViewer.setPage([targetPage])
      })
      $('#parent small').text(title) // update Viewer Heading
      $('#parent div').attr('title', title) // update Viewer Title
    }
  })
}

async function showTify (targetCanvasID) {
  await setTifyPage(targetCanvasID, targetCanvasID)

  // Open the dialog window with jquery-ui Dialog method
  $('#parent').dialog('open')

  // Reflect viewer status in url
  params.set('viewer', targetCanvasID)
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  console.log('In canvas ' + window.location.hash)
}

// Upon click on .pageNo element, open the viewer popup
$(document).on('click', '.pageNo', async function (event) {
  event.preventDefault() // do not actually go to this url - or go there if javascript is disabled
  $(this).blur()

  var targetCanvasID = $(this).attr('data-canvas')
  await showTify(targetCanvasID)
})

// Upon loading, if we have a 'viewer' URL parameter, open the viewer popup
window.addEventListener('load', async function (event) {
  if (window.location.search.indexOf('viewer=') !== -1) {
    var targetCanvasID = params.get('viewer')
    await showTify(targetCanvasID)
  }
})

// Update url when paging in viewer (a bit clumsy but it's working)
function viewObsCallback (mutations) {
  mutations.forEach(function (mutation) {
    let number = parseInt(mutation.target.data.split(':')[0].trim(), 10)
    let canvas = myViewer.app.canvases[number - 1]
    let id = canvas['@id']
    console.log(`Open viewer on canvas ${id} / image ${number}.`)
    params.set('viewer', id)
    window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
    console.log('In viewObsCallBack ' + window.location.hash)
  })
}
var viewerObserver = new MutationObserver(viewObsCallback)
var observerOptions = {
  childList: false,
  attributes: false,
  characterData: true,
  subtree: true
}
viewerObserver.observe(document.getElementById('Viewer'), observerOptions)

// Mobil-View: Hide opened collapsed menu after clicking elsewhere on page
$(document).on('click', function () {
  $('.collapse .navbar-collapse').collapse('hide')
})
// Mobil-View: scroll to last collapsed navbar item on mobile when there are many items
$('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })

// One document.ready function collecting init for all of the above...
// document.DOMContentLoaded triggers when DOM has been completely parsed
// (no images, styles and async scripts),
// window.load event triggers when *everything* has been loaded.
document.addEventListener('DOMContentLoaded', function (event) {
  // Init backTop
  $('#backTop').backTop({ position: 100, speed: 200, color: 'white' })

  // apply constituted/diplomatic mode
  applyMode()

  // Show GUI-Nav when scolling to top
  $('.navbar-white')
    .css('padding-top', parseInt($('#main-menu').css('height')) - 2)
    .autoHidingNavbar()
    .autoHidingNavbar('setShowOnBottom', false)
    .autoHidingNavbar('setAnimationDuration', 400)

  // Load Paginator
  $('#dropdownMenu1').click(loadPaginatorContent)

  // Initialize (jquery) dialogue window for Image viewer
  $('#parent').dialog({
    position: { my: 'left top', at: 'left+5 bottom+40', of: 'div.navbar' },
    autoOpen: false,
    width: Math.min($(window).width() * 0.4, 600), // startsize of the dialog
    height: Math.min($(window).height() * 0.8, 700),
    create: function (event, ui) {
      $(event.target).parent().css('position', 'fixed')
    },
    resizeStop: function (event, ui) {
      var position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
        (Math.floor(ui.position.top) - $(window).scrollTop())]
      $(event.target).parent().css('position', 'fixed')
      $('#parent').dialog('option', 'position', position)
    },
    close: function (event, ui) {
      params.delete('viewer')
      window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
      console.log('In orig/edit ' + window.location.hash)
      event.stopImmediatePropagation()
      event.preventDefault()
      return false
    }
  })

  // Apply search term highlighting
  highlightSearchTerm()

  // Disable darkening dimming down, i.e. show text normally
  showText()
})

// Darken body when scrolling
function hideText () {
  document.getElementById('body').classList.add('darkenBody')
};
function showText () {
  document.getElementById('body').classList.remove('darkenBody')
};
document.addEventListener('scroll mousedown wheel DOMMouseScroll mousewheel keyup', (event) => {
  if (event.type === 'scroll') {
    setTimeout(() => { hideText() }, 0)
  }
})
document.addEventListener('scrollend', (event) => {
  setTimeout(() => { showText() }, 3000)
})

// InfiniteAjaxScroll stuff
let validParams = ['mode', 'q', 'format', 'viewer']

// This is defined in the JS file loaded from the HTML file
// eslint-disable-next-line no-undef
let ias = new InfiniteAjaxScroll('#iasContainer', {
  item: '.iasItem',
  next: '.next',
  prev: '.prev',
  pagination: '.iasPagination',
  spinner: '.iasSpinner',
  prefill: false,
  logger: true // don't clobber the console
  // negativeMargin: 400          // when to start loading new items (before reaching the very bottom),
})

ias.on('page', (event) => { // when user scrolls to a new segment: update the address bar to reflect the new page
  let target = new URL(event.url, location.protocol + '//' + location.hostname + '/') // event.url is a string, but we want to use URL methods (second parameter is basename)
  console.log('This is target :' + target)
  params.forEach(function (value, key) { // sanitize query parameters
    if (validParams.indexOf(key) === -1) { params.delete(key) };
    console.log('Here are all the query parameters: ' + params)
  })
  let newUrl = target.pathname.substr(target.pathname.lastIndexOf('/') + 1) + '?' + params
  history.replaceState(history.state, '', newUrl)
})

ias.on('nexted', (event) => { // apply original/edited mode to newly added elements
  applyMode()
})
ias.on('preved', (event) => { // apply original/edited mode to newly added elements
  applyMode()
})

ias.on('append', async function (event) {
  const searchTerm = params.has('q') ? params.get('q') : ''
  if (searchTerm.length > 0) {
    var newItems = []
    let parser = new DOMParser()
    for (let i of [...event.items]) {
      const origHTML = i.innerHTML.trim()
      try {
        const newHTML = await highlightTransform(origHTML, searchTerm)
        if (newHTML.length > 0) {
          let doc = parser.parseFromString(newHTML, 'text/html')
          let node = doc.body.firstChild
          newItems.push(node)
        } else {
          newItems.push(i)
        }
      } catch (e) {
        newItems.push(i)
      }
    }
    event.items = newItems
  }
})
ias.on('prepend', async function (event) {
  const searchTerm = params.has('q') ? params.get('q') : ''
  if (searchTerm.length > 0) {
    var newItems = []
    let parser = new DOMParser()
    for (let i of [...event.items]) {
      const origHTML = i.innerHTML.trim()
      try {
        const newHTML = await highlightTransform(origHTML, searchTerm)
        if (newHTML.length > 0) {
          let doc = parser.parseFromString(newHTML, 'text/html')
          let node = doc.body.firstChild
          newItems.push(node)
        } else {
          newItems.push(i)
        }
      } catch (e) {
        newItems.push(i)
      }
    }
    event.items = newItems
  }
})

ias.on('appended', function (event) { // after new ias items have been appended: add functionality to newly loaded elements
  // 1. Refresh Popover Boxes to have a function on click ...
  $('[data-rel="popover"]').popover({
    trigger: 'click',
    animation: 'true',
    placement: 'bottom',
    container: 'body',
    template: '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
    html: true,
    title: function () { return $('#popover-head').html() },
    content: function () {
      toolboxHighlight(this, 'on')
      return $(this).siblings('.sal-toolbox-body').html()
    }
    // close popup by clicking outside
  }).click(function (event) { event.preventDefault() })
  // 2. Refresh ImageViewer Stuff...
  $('.pageNo').click(function (event) {
    event.preventDefault() // do not actually go to this url
    $('#parent').dialog('open') // show Viewer with jquery-ui Dialog method
    $('#parent small').text($(this).attr('href')) // update Viewer Heading
    $('#parent div').attr('title', $(this).attr('href')) // update Viewer Title
  })
  // 3. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 4. Add highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
})
ias.on('prepended', function (event) { // after new ias items have been prepended: add functionality to newly loaded elements
  // 1. Refresh Popover Boxes to have a function on click ...
  $('[data-rel="popover"]').popover({
    trigger: 'click',
    animation: 'true',
    placement: 'bottom',
    container: 'body',
    template: '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
    html: true,
    title: function () { return $('#popover-head').html() },
    content: function () {
      toolboxHighlight(this, 'on')
      return $(this).siblings('.sal-toolbox-body').html()
    }
    // close popup by clicking outside
  }).click(function (event) { event.preventDefault() })
  // 2. Refresh ImageViewer Stuff...
  $('.pageNo').click(function (event) {
    event.preventDefault() // do not actually go to this url
    $('#parent').dialog('open') // show Viewer with jquery-ui Dialog method
    $('#parent small').text($(this).attr('href')) // update Viewer Heading
    $('#parent div').attr('title', $(this).attr('href')) // update Viewer Title
  })
  // 3. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 4. Add highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
})
