/* eslint-env browser */
/* global SPHINX_SERVER, BETA, params, showBeta, sanitizeParams */

// import { SPHINX_SERVER, BETA, params, showBeta, sanitizeParams } from './sal-common.js'

// ===== Diplomatic/Constituted mode viewing =====

// This toggles diplomatic/constituted mode
// It is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function toggleOrigEditMode (invokingElement) {
  [].forEach.call(document.getElementsByClassName('edited'), function (el) {
    el.classList.toggle('unsichtbar')
  });
  [].forEach.call(document.getElementsByClassName('original'), function (el) {
    el.classList.toggle('unsichtbar')
  })
}
function applyOrigMode () {
  [].forEach.call(document.getElementsByClassName('edited'), function (el) {
    el.classList.add('unsichtbar')
  });
  [].forEach.call(document.getElementsByClassName('original'), function (el) {
    el.classList.remove('unsichtbar')
  })
  params.set('mode', 'orig')
  window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash)
  $('.next, .prev, .top').each(function (i, obj) {
    let nextParams = (new URL(obj.href)).searchParams
    nextParams.set('mode', 'orig')
    obj.href = obj.pathname + '?' + nextParams
  })
}
function applyEditMode () {
  [].forEach.call(document.getElementsByClassName('original'), function (el) {
    el.classList.add('unsichtbar')
  });
  [].forEach.call(document.getElementsByClassName('edited'), function (el) {
    el.classList.remove('unsichtbar')
  })
  params.set('mode', 'edit')
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
  $('.next, .prev, .top').each(function (i, obj) {
    let nextParams = (new URL(obj.href)).searchParams
    nextParams.set('mode', 'edit')
    obj.href = obj.pathname + '?' + nextParams
  })
}
function applyMode () {
  const mode = params.get('mode')
  if (mode === 'orig') {
    applyOrigMode()
  } else {
    applyEditMode()
  }
}

// ===== Search term highlighting =====

// This checks if a searchTerm URL query parameter is present (?q=XY)
// and, if so, calls highlightReplace to replace the innerHTML of the
// InfiniteAjaxScroll container element with a version of the original
// HTML that has the search term highlighted
function highlightSearchTerm () {
  const searchTerm = params.get('q') || ''
  if (searchTerm.length > 0) {
    const targetElement = document.getElementById('iasContainer')
    const origHTML = targetElement.innerHTML.trim()
    highlightReplace(origHTML, searchTerm, targetElement)

    // also update the links to next/prev/top inside the iasContainer
    $('.next, .prev, .top').each(function (i, obj) {
      obj.href = obj.pathname + '?' + params
    })
  } else {
    document.getElementById('minimap').style.visibility = 'hidden'
  }
}

// This replaces innerHTML of a target element
// with a highlighted version of the original HTML
async function highlightReplace (origHTML, searchTerm, targetElement) {
  // check if target element exists
  if (targetElement === null) {
    return
  }

  console.log(`Requesting highlighting of html with searchTerm ${searchTerm} ...`)

  // construct POST request
  const endpoint = SPHINX_SERVER + '/excerpts'
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
  window
    .fetch(endpoint, myOptions)
    .then((response) => {
      // Check network status and return response's text content
      if (!response.ok) {
        console.log(myOptions)
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then((str) => {
      // Parse OpenSearch xml document and return rss/channel
      const xmlParser = new DOMParser()
      const xmlDoc = xmlParser.parseFromString(str, 'text/xml')
      const errorNode = xmlDoc.querySelector('parsererror')

      if (!errorNode) {
        // XML Parsing succeeded
        return xmlDoc.getElementsByTagName('channel')[0]
      }

      // Fallback: Try HTML parsing
      console.warn('XML parsing failed, trying HTML parser as fallback')
      const htmlParser = new DOMParser()
      const htmlDoc = htmlParser.parseFromString(str, 'text/html')
      const channel = htmlDoc.querySelector('channel')

      if (!channel) {
        throw new Error('Could not parse response as XML or HTML')
      }
      return channel
    })
    .then((data) => {
      // Push highlighted HTML to target element
      // This can be unsanitized because we control the data source
      const doc1 = data
        .getElementsByTagName('item')[0]
        .getElementsByTagName('description')[0].innerHTML
      console.log('Replacing targetElement.innerHTML with highlighted HTML.')
      targetElement.innerHTML = doc1
    })
    .then((_) => {
      // also update the links to next/prev/top inside the iasContainer
      $('.next, .prev, .top').each(function (i, obj) {
        obj.href = obj.pathname + '?' + params
      })
    })
    .then((_) => {
      // Re-initialize popups and highlighting after innerHTML replacement
      // This fixes the race condition where context menus don't work with search terms
      console.log('Re-initializing popups and highlighting after search term highlighting.')
      initializePopupsAndHighlighting()
    })
    /*
    .then((_) => {
        // Update minimap
        pagemap(document.getElementById('minimap'), {
          viewport: null,
          styles: {
            'header,footer,section,article': 'rgba(0,0,0,0.38)',
            'div': 'rgba(0,0,0,0.01)',
            'h1,a': 'rgba(0,0,100,0.30)',
            'h2,h3,h4': 'rgba(0,0,0,0.38)',
            'span.hi': 'rgba(253,185,36,0.90)'
          },
          back: 'rgba(0,0,0,0.02)',
          view: 'rgba(0,0,0,0.10)',
          drag: 'rgba(0,0,0,0.40)',
          interval: null
        })
    })
    */
    .catch((error) => {
      console.error('There has been a problem with the fetch operation in highlightSearch(): ', error)
    })
}

// ===== Entity highlighting =====

// This highlights spans of named entities (persons, books etc.)
// It is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function highlightSpanClassInText (htmlClass, invokingElement) {
  // make all htmlClass elements have the inverse highlighting of the invoking element
  if (document.getElementById(invokingElement).classList.contains('highlighted')) {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) {
      el.classList.remove('highlighted')
    })
  } else {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) {
      el.classList.add('highlighted')
    })
  }
  // then toggle the highlighting also for the invoking element
  document.getElementById(invokingElement).classList.toggle('highlighted')
}

function toolboxHighlight (elem, mode) {
  const target = elem.parentElement.nextElementSibling

  if (target === undefined || target === null) return 0

  if (mode === 'on') {
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.visibility = 'visible'
    }
    elem.style.setProperty('color', '#102873', 'important')
    if (target !== null) {
      elem.style.backgroundColor = '#F0F0F0'
    }
  } else {
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.removeProperty('visibility')
    }

    // Remove highlighting from all highlighted elements
    var allhighlightedelements = $('a, span').filter(function () {
      var fgcolor = $(this).css('color').toLowerCase()
      var bgcolor = $(this).css('background-color').toLowerCase()

      return (
        (bgcolor === '#f0f0f0' || bgcolor === 'rgb(240, 240, 240)') &&
        (fgcolor === '#102873' || fgcolor === 'rgb(16, 40, 115)')
      )
    })
    allhighlightedelements.css('color', 'inherit')
    allhighlightedelements.css('background-color', 'inherit')
  }
}

// ===== Passage context/hand menu: Cite, Copy link, Export =====

function initializePopupsAndHighlighting () {
  // Initialize paragraph popups with link, refresh and print icons
  $('[data-rel="popover"]').popover({
    trigger: 'click',
    animation: 'true',
    placement: 'bottom',
    container: 'body',
    template:
      '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
    html: true,
    title: function () {
      return $('#popover-head').html()
    },
    content: function () {
      var target = $(this)
      if (!target.data('popover-initialized')) {
        toolboxHighlight(this, 'on')
        target.data('popover-initialized', true)
        // Reset the flag when the popover is hidden
        target.on('hidden.bs.popover', function () {
          target.removeData('popover-initialized')
        })
      }
      return target.siblings('.sal-toolbox-body').html()
    }
  })

  // Add tooltip
  $('.messengers').tooltipster({'multiple': true})

  // Add entity highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
    console.log('This is hilitebox initializer')
  })

  // Show Beta features if applicable
  showBeta()

  // enable minimap for search results
  // document.getElementById("minimap").style.visibility = "visible"
}

// Helper function
function copyNotify (elem) {
  const del = elem.parentElement.getElementsByClassName('.copy-alert')[0]
  if (typeof del !== 'undefined' && del !== null) {
    elem.parentElement.removeChild(del)
  }
  // This is defined in the sal-common.js file loaded from the HTML file
  // eslint-disable-next-line no-undef
  const language = getLang()
  console.log('$lang=' + language)
  let msg
  if (language === 'de') {
    msg = 'In die Zwischenablage kopiert'
  } else if (language === 'es') {
    msg = 'Copiado al portapapeles'
  } else {
    msg = 'Copied to clipboard'
  }
  let popup = document.createElement('span')
  popup.setAttribute('class', 'copy-alert')
  popup.textContent = msg
  elem.parentElement.appendChild(popup)
  setTimeout(function () {
    $('.copy-alert').fadeOut(1000)
  }, 1500)
}

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function copyLink (elem) {
  const target = elem.parentElement.getElementsByClassName('cite-link')[0]
  let input = document.createElement('textarea')
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
  const target = elem.parentElement.getElementsByClassName('sal-cite-rec')[0]
  let input = document.createElement('textarea')
  input.setAttribute('style', 'display:block; width:0; height:0; opacity: 0;')
  // construct string to be copied: get pre-rendered work/passage citation strings and insert the current date
  const v1 = target.getElementsByClassName('cite-rec-body')[0].textContent
  // This is defined in the sal-common.js file loaded from the HTML file
  // eslint-disable-next-line no-undef
  const v2 = getI18nAccessString()
  input.textContent = v1 + ' ' + v2
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  copyNotify(elem)
  document.body.removeChild(input)
}

// ===== Image Viewer =====

var myViewer

/*
  const domain = document.getElementById('Viewer').dataset.domain
  const wid = document.getElementById('Viewer').dataset.wid
  const tifyOptions = {
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
  const myViewer = new Tify (tifyOptions)
*/

async function loadTifyManifest (manifest) {
  const tifyOptions = {
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

async function setTifyPage (canvasId, title) {
  const requestedManifest = canvasId.split('/canvas/')[0]
  if (typeof myViewer !== 'undefined') {
    // unproblematic path (returns from setTifyPage function)...
    const currentManifest = myViewer.options.manifestUrl
    if (requestedManifest === currentManifest) {
      const canvases = myViewer.app.canvases
      // console.log(canvases);
      // console.log(`search canvases for @id === ${canvasId} ...`);
      const targetCanvas = canvases.find((x) => x['@id'] === canvasId)
      // console.log(`found canvas:`);
      // console.log(targetCanvas);
      if (typeof targetCanvas !== 'undefined') {
        const targetPage = targetCanvas.page
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
  // ... problematic path (with more logging)
  console.log(`loading of new manifest is necessary: ${requestedManifest} ...`)
  await loadTifyManifest(requestedManifest)
  myViewer.ready.then(() => {
    console.log(myViewer)
    const canvases = myViewer.app.canvases
    console.log(`canvases: ${JSON.stringify(canvases)}`)
    console.log(`... search canvases for @id === ${canvasId} ...`)
    const targetCanvas = canvases.find((x) => x['@id'] === canvasId)
    console.log(`found ${targetCanvas}`)
    if (typeof targetCanvas !== 'undefined') {
      const targetPage = targetCanvas.page
      console.log(`(page number ${targetPage})`)
      myViewer.ready.then(() => {
        myViewer.setPage([targetPage])
      })
      $('#parent small').text(title) // update Viewer Heading
      $('#parent div').attr('title', title) // update Viewer Title
    }
  })
}

async function showTify (targetCanvasID) {
  // Set tify to the correct page
  await setTifyPage(targetCanvasID, targetCanvasID)

  // Open the dialog window with jquery-ui Dialog method
  $('#parent').dialog('open')

  // Reflect viewer status in url
  params.set('viewer', targetCanvasID)
  window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash)
  console.log('In canvas ' + window.location.hash)
}

// Update url when paging in viewer (a bit clumsy but it's working)
function viewObsCallback (mutations) {
  mutations.forEach(function (mutation) {
    const number = parseInt(mutation.target.data.split(':')[0].trim(), 10)
    const canvas = myViewer.app.canvases[number - 1]
    const id = canvas['@id']
    console.log(`Open viewer on canvas ${id} / image ${number}.`)
    params.set('viewer', id)
    window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash)
    console.log('In viewObsCallBack ' + window.location.hash)
  })
}

const viewerObserver = new MutationObserver(viewObsCallback)
const observerOptions = {
  childList: false,
  attributes: false,
  characterData: true,
  subtree: true
}
const viewerElement = document.getElementById('Viewer')
if (viewerElement) {
  viewerObserver.observe(viewerElement, observerOptions)
}

// ===== Scrolling =====

// Scroll an anchor into view if we have one
function myScrollIntoView (targetId) {
  try {
    let targetEl = document.getElementById(targetId)
    let scrollMarginTop = parseInt($('div.navbar-white').css('height')) + 15
    targetEl.style.scrollMarginTop = `${scrollMarginTop}px`
    console.log(`Scrolling element ${targetId} into view.`)
    targetEl.scrollIntoView()
    showTextWithDelay(1)
    // targetEl.effect('highlight', {color: 'LightSkyBlue'}, 1200)
    targetEl.animate(
      [ { backgroundColor: 'white' }, { backgroundColor: 'LightSkyBlue' } ], { duration: 600, iterations: 6, direction: 'alternate' }
    )
  } catch (error) {
    console.log(`Error scrolling to element ${targetId}: ${error}`)
    showTextWithDelay(1)
  }
}

// ===== InfiniteAjaxScroll =====

// Initialize ias (this is defined in the JS file loaded from the HTML file)
// eslint-disable-next-line no-undef
const ias = new InfiniteAjaxScroll('#iasContainer', {
  item: '.iasItem',
  next: '.next',
  // prev: '.prev',
  pagination: '.iasPagination',
  spinner: '.iasSpinner',
  prefill: true,
  logger: false, // don't clobber the console
  negativeMargin: 100 // when to start loading new items (before reaching the very bottom),
})

async function showTextWithDelay (delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Now showing text.')
      document.getElementById('body').classList.remove('darkenBody')
      window.dispatchEvent(new Event('resize')) // trigger resize event to provoke prefilling
      resolve()
    }, delay)
  })
}

ias.on('page', (event) => {
  // when user scrolls to a new segment: update address bar
  const target = new URL(event.url, location.protocol + '//' + location.hostname + '/') // event.url is a string, but we want to use URL methods (second parameter is basename)
  // console.log('This is target :' + target)
  sanitizeParams()
  const newUrl = target.pathname.substr(target.pathname.lastIndexOf('/') + 1) + '?' + params + window.location.hash
  history.replaceState(history.state, '', newUrl)
  // showTextWithDelay(0)
})

ias.on('append', function (event) {
  // when items are appended: add searchTerm highlighting as needed
  highlightSearchTerm()
})
ias.on('appended', function (e) {
  // after new ias items have been appended: add functionality to newly loaded elements
  initializePopupsAndHighlighting()
})
ias.on('prepend', async function (event) {
  // when items are prepended: add searchTerm highlighting as needed
  highlightSearchTerm()
})
ias.on('prepended', function (e) {
  // after new ias items have been prepended: add functionality to newly loaded elements
  console.log('prepended event')
  // TODO: Go to the end of what has been prepended!
  initializePopupsAndHighlighting()
  showTextWithDelay(0)
})

// ===== Binding and Initialization =====

// Bind all click events
document.body.addEventListener('click', async function (e) {
  const t = e.target
  $('.collapse .navbar-collapse').collapse('hide') // Hide collapsible menu after clicking anywhere

  // Click outside of popover: close popover and no longer highlight text section
  // (and continue checking against all the other event listeners)
  // if (!t.closest('[data-rel="popover"]')) {
  if (
    !t.closest('.sal-toolbox') &&
    !t.closest('.sal-toolbox-body') &&
    !t.closest('.sal-toolbox-marginal') &&
    !t.closest('.sal-toolbox-title')
  ) {
    $('[data-rel="popover"]').popover('hide')
    toolboxHighlight(t, 'off')
    // console.log('Toolbox off !')
  }

  if (t.matches('a[href*="#W"]')) {
    // a local link: scroll to anchor
    const z = t.getAttribute('href').slice(t.getAttribute('href').indexOf('#') + 1)
    if (z !== undefined && z.length !== 0) {
      myScrollIntoView(z)
      // don't use the browser's navigation to scoll to target, since we already should be there
      // console.log(`Not performing default action for ${JSON.stringify(e)} ...`)
      e.preventDefault()
    } else {
      console.log('No targetId or z found.')
    }
  } else if (t.matches('#dropdownMenu1')) {
    // load paginator
    const self = `<span data-template="dummyString"></span>`
    $('#loadMeLast').innerHtml = (self + '#later li')
  } else if (t.matches('#toggleButton')) {
    // toggle ToC tree: expand/collapse
    if (t.classList.contains('expanded')) {
      $('#tableOfConts').jstree('close_all')
      t.classList.remove('expanded')
      t.classList.add('collapsed')
      $('span[class="glyphicon glyphicon-resize-small"]')
        .removeClass('glyphicon glyphicon-resize-small')
        .addClass('glyphicon glyphicon-fullscreen')
    } else if (t.classList.contains('collapsed')) {
      $('#tableOfConts').jstree('open_all')
      t.classList.remove('collapsed')
      t.classList.add('expanded')
      $('span[class="glyphicon glyphicon-fullscreen"]')
        .removeClass('glyphicon glyphicon-fullscreen')
        .addClass('glyphicon glyphicon-resize-small')
    }
  } else if (t.matches('.hideMe')) {
    // anchors in ToC popup: close modal window
    $('#myModal').modal('hide') // 't' would reference the anchor that was clicked
  } else if (t.matches('.dropdown-menu.export-options.dropdown-toggle.dropdown')) {
    // export options: do not close menu on click
    // console.log(`Stop event propagation for ${e} ...`)
    e.stopPropagation()
  } else if (t.matches('.pageNo')) {
    // a page number: open viewer
    // console.log(`Not performing default action for ${e} ...`)
    e.preventDefault() // do not actually go to this url - or go there if javascript is disabled
    t.blur()
    showTify(t.getAttribute('data-canvas'))
  } else if (t.closest('[data-rel="popover"]')) {
    // toolbox/hand icon: show popover and highlight section, but don't jump to the anchor
    // console.log(`Not performing default action for ${e} ...`)
    e.preventDefault()
    // console.log(`Stop event propagation for ${e} ...`)
    e.stopPropagation()
    $(t.closest('[data-rel="popover"]')).popover('show')
    toolboxHighlight(t, 'on')
  }
})

// document.ready-like functions collecting init for all of the above...
// - document.DOMContentLoaded triggers when DOM has been completely parsed
//   Synchronous scripts have been executed (no images, styles loaded and no async scripts executed),
// - window.load event, by contrast, triggers when *everything* has been loaded (i.e. later)
document.addEventListener('DOMContentLoaded', function (event) {
  console.log('sal-work.js: DomContentLoaded')

  // init backTop
  $('#backTop').backTop({ position: 100, speed: 200, color: 'white' })

  // initialize TOC tree
  $('#tableOfConts')
    .bind('loaded.jstree', function (e, d) {
      $('#tableOfConts')
        .jstree(true)
        .open_node($('#tableOfConts').find('li').first())
    })
    .bind('select_node.jstree', function (e, data) {
      const href = data.node.a_attr.href
      document.location.href = href
    })
    .jstree({'core': { }})

  // initialize (jquery) dialog window for Image viewer
  $('#parent').dialog({
    position: { 'my': 'left top', 'at': 'left+5 bottom+40', 'of': 'div.navbar' },
    autoOpen: false,
    width: Math.min($(window).width() * 0.4, 600), // startsize of the dialog
    height: Math.min($(window).height() * 0.8, 700),
    create: function (event, ui) {
      $(event.target).parent().css('position', 'fixed')
    },
    resizeStop: function (event, ui) {
      const position = [
        (Math.floor(ui.position.left) - $(window).scrollLeft()),
        (Math.floor(ui.position.top) - $(window).scrollTop())
      ]
      $(event.target).parent().css('position', 'fixed')
      $('#parent').dialog('option', 'position', position)
    },
    close: function (event, ui) {
      params.delete('viewer')
      window.history.replaceState(null, '', window.location.pathname + '?' + params.toString() + window.location.hash)
      // console.log('In orig/edit ' + window.location.hash)
      // console.log(`Stop event propagation for ${event} ...`)
      event.stopImmediatePropagation()
      // console.log(`Not performing default action for ${event} ...`)
      event.preventDefault()
      return false
    }
  })

  // show GUI-Nav when scolling upwards
  $('.navbar-white').css('padding-top', parseInt($('#main-menu').css('height')) - 2)

  // apply search term highlighting
  highlightSearchTerm()
})

window.addEventListener('load', async function (e) {
  // apply constituted/diplomatic mode
  applyMode()

  // initialize context menu and highlighting (so late because it may need
  // to apply to asynchronously loaded data)
  initializePopupsAndHighlighting()

  // try and see if we should scroll a particular anchor into view
  if (window.location.hash) {
    const target = window.location.hash.substring(1)
    myScrollIntoView(target)
  } else {
    showTextWithDelay(0)
  }

  // enable beta features if requested
  if (BETA) showBeta()

  // if we have a 'viewer' URL parameter, open the viewer popup
  if (
    params.get('viewer') !== undefined &&
    params.get('viewer') !== null &&
    params.get('viewer').length > 0
  ) {
    showTify(params.get('viewer'))
  }
})
