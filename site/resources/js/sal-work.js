/* eslint-env browser */

const validParams = ['mode', 'q', 'format', 'viewer']
const params = (new URL(window.location.href)).searchParams

// ===== Diplomatic/Constituted mode viewing =====

// This toggles diplomatic/constituted mode
// It is being called from the HTML element's onclick event
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
    let nextParams = (new URL(obj.href)).searchParams
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

// This replaces innerHTML of a target element
// with a highlighted version of the original HTML
async function highlightReplace (origHTML, searchTerm, targetElement) {
  // console.log('searchTerm: ' + searchTerm)

  // check if target element exists
  if (targetElement === null) {
    return
  }

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
      // console.log('This is string: ' + str)
      if (errorNode) {
        throw new Error('Response could not be parsed as html')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Push highlighted HTML to target element
      const doc1 = data.getElementsByTagName('item')[0].getElementsByTagName('description')[0].innerHTML
      console.log('Replacing targetElement.innerHTML with highlighted HTML.')
      targetElement.innerHTML = doc1
    })
    .catch(error => {
      console.error('There has been a problem with the fetch operation in highlightSearch(): ', error)
    })
}

// This checks if a searchTerm URL query parameter is present (?q=XY)
// and, if so, replaces innerHTML of the InfiniteAjaxScroll container element
// with version of the original HTML that has the search term highlighted
function highlightSearchTerm () {
  const searchTerm = params.get('q') || ''
  // console.log(`searchTerm: ${searchTerm} (params: ${params})`)
  if (searchTerm.length > 0) {
    const targetElement = document.getElementById('iasContainer')
    const origHTML = targetElement.innerHTML.trim()
    highlightReplace(origHTML, searchTerm, targetElement)

    // also update the links to next/prev/top inside the iasContainer
    $('.next, .prev, .top').each(function (i, obj) {
      let nextParams = (new URL(obj.href)).searchParams
      nextParams.set('q', searchTerm)
      obj.href = obj.pathname + '?' + nextParams
    })

    // enable minimap for search results
    document.getElementById("minimap").style.visibility = "visible"
    /*
    pagemap(document.querySelector('#minimap'), {
      viewport: null,
      styles: {
        'header,footer,section,article': 'rgba(0,0,0,0.38)',
        'div': 'rgba(0,0,0,0.01)',
        'h1,a': 'rgba(0,0,100,0.30)',
        'h2,h3,h4': 'rgba(0,0,0,0.38)',
        'hi': 'rgba(253,185,36,0.90)'
      },
      back: 'rgba(0,0,0,0.02)',
      view: 'rgba(0,0,0,0.10)',
      drag: 'rgba(0,0,0,0.40)',
      interval: null
    });
    */
  } else {
    document.getElementById("minimap").style.visibility = "hidden"
  }
}

// ===== Entity highlighting =====

// This highlights spans of named entities (persons, books etc.)
// It is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function highlightSpanClassInText (htmlClass, invokingElement) {
  // make all htmlClass elements have the inverse highlighting of the invoking element
  if (document.getElementById(invokingElement).classList.contains('highlighted')) {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.remove('highlighted') })
  } else {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.add('highlighted') })
  }
  // then toggle the highlighting also for the invoking element
  document.getElementById(invokingElement).classList.toggle('highlighted')
}

function toolboxHighlight (elem, mode) {
  const target = elem.parentElement.nextElementSibling
  if (target !== undefined && mode === 'on') {
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.visibility = 'visible'
    }
    elem.style.setProperty('color', '#102873', 'important')
    if (target !== null) {
      target.style.backgroundColor = '#F0F0F0'
    }
  } else if (target !== undefined && mode === 'off') {
    elem.style.removeProperty('color')
    if (target !== null) {
      target.style.backgroundColor = ''
    }
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.removeProperty('visibility')
    }
  }
}

// Add entity highlighting as needed
$('#hiliteBox a.highlighted').each(function () {
  $(this).click() // this disables highlighting
  $(this).click() // this re-enables it
})

// ===== Passage context/hand menu: Cite, Copy link, Export =====

// Initialize paragraph popups with link, refresh and print icons
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
})

// Add tooltip
$('.messengers').tooltipster({'multiple': true})

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
  if (typeof myViewer !== 'undefined') { // unproblematic path (returns from setTifyPage function)...
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
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
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
    window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
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
viewerObserver.observe(document.getElementById('Viewer'), observerOptions)

// ===== Scrolling =====

// Scroll an anchor into view if we have one
function myScrollIntoView (targetId) {
  const offset = document.getElementById(targetId).offset().top
  console.log(`myScrollIntoView(${targetId}) running...`)
  console.log(`document.getElementById('${targetId}').offset().top = ${offset}.`)
  const goHere = offset - parseInt($('div.navbar-white').css('height')) - 15
  console.log(`Go to ${goHere}.`)
  $('html, body').animate({scrollTop: goHere}, 800, 'swing', function () {
    showTextWithDelay(500)
    document.getElementById(targetId).effect('highlight', {color: 'LightSkyBlue'}, 1200)
  })
  $('html, body').bind('scroll', function()
  {
    if($(this).scrollTop() + $(this).innerHeight()>=$(this)[0].scrollHeight)
    {
      alert('end reached');
    }
  })
  showTextWithDelay(500)
  document.getElementById(targetId).effect('highlight', {color: 'LightSkyBlue'}, 1200)
}



// Mobil-View: scroll to last collapsed navbar item on mobile when there are many items
// $('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })

// ===== InfiniteAjaxScroll =====

// Initialize ias (this is defined in the JS file loaded from the HTML file)
// eslint-disable-next-line no-undef
const ias = new InfiniteAjaxScroll('#iasContainer', {
  item: '.iasItem',
  next: '.next',
  prev: '.prev',
  pagination: '.iasPagination',
  spinner: '.iasSpinner',
  prefill: false,
  logger: true // don't clobber the console
  //negativeMargin: 100          // when to start loading new items (before reaching the very bottom),
})

// Darken body (when scrolling) in order not to confuse readers by ias's jumping around
function hideText () {
  document.getElementById('body').classList.add('darkenBody')
};
/*function showText () {
  document.getElementById('body').classList.remove('darkenBody')
}; */
async function showTextWithDelay(delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Delayed showText now showing text.')
      document.getElementById('body').classList.remove('darkenBody')
      resolve()
    }, delay)
  })
};

// Hide text during loading
hideText()
// and also hide during loading of new ias items (only when scrolling up/backwards)
ias.on('top', (event) => { // when user scrolls to the top
  hideText()
})

ias.on('page', (event) => { // when user scrolls to a new segment: update address bar
  const target = new URL(event.url, location.protocol + '//' + location.hostname + '/') // event.url is a string, but we want to use URL methods (second parameter is basename)
  console.log('This is target :' + target)
  params.forEach(function (value, key) { // sanitize query parameters
    if (validParams.indexOf(key) === -1) { params.delete(key) };
    console.log('Here are all the query parameters: ' + params)
  })
  const newUrl = target.pathname.substr(target.pathname.lastIndexOf('/') + 1) + '?' + params
  history.replaceState(history.state, '', newUrl)
  //showTextWithDelay(0)
})
ias.on('nexted', (e) => { // re-apply original/edited mode after adding new elements at the end
  applyMode()
  showTextWithDelay(0) // should not be necessary but cannot hurt
})
ias.on('preved', (e) => { // re-apply original/edited mode after adding new elements at the top
  console.log('preved event')
  applyMode()
  showTextWithDelay(0)
  // setTimeout(showText(), 2500)
})

ias.on('append', function (event) { // when items are appended: add searchTerm highlighting as needed
  const searchTerm = params.get('q') || ''
  if (searchTerm.length > 0) {
    for (let i of [...event.items]) {
      let origHTML = i.innerHTML.trim()
      console.log(`calling asynchronous highlighting with searchTerm ${searchTerm} ...`)
      highlightReplace(origHTML, searchTerm, i)
    }
  }
})
ias.on('appended', function (e) { // after new ias items have been appended: add functionality to newly loaded elements
  // 1. Initialize Popover Boxes ...
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
  })
  // 2. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 3. Add entity highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
})
ias.on('prepend', async function (event) { // when items are prepended: add searchTerm highlighting as needed
  const searchTerm = params.get('q') || ''
  if (searchTerm.length > 0) {
    for (let i of [...event.items]) {
      let origHTML = i.innerHTML.trim()
      console.log(`calling asynchronous highlighting with searchTerm ${searchTerm} ...`)
      highlightReplace(origHTML, searchTerm, i)
    }
  }
})
ias.on('prepended', function (e) { // after new ias items have been prepended: add functionality to newly loaded elements
  console.log('prepended event')
  // 1. Initialize Popover Boxes ...
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
  })
  // 3. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 4. Add entity highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
  showTextWithDelay(0)
})

// ===== Binding and Initialization =====

// Bind all click events
document.body.addEventListener('click', async function (e) {
  const t = e.target
  $('.collapse .navbar-collapse').collapse('hide') // Hide collapsible menu after clicking anywhere

  // Click outside of popover: close popover and no longer highlight text section
  // (and continue checking against all the other event listeners)
  if (!t.closest('[data-rel="popover"]')) {
    $('[data-rel="popover"]').popover('hide')
    toolboxHighlight(this, 'off')
  }

  if (t.matches('a[href*="#W"]')) { // a local link: scroll to anchor
    const z = t.attr('href').slice(t.attr('href').indexOf('#') + 1)
    if (z !== undefined && z.length !== 0) {
      myScrollIntoView(z)
      // don't use the browser's navigation to scoll to target, since we already should be there
      // console.log(`Not performing default action for ${JSON.stringify(e)} ...`)
      e.preventDefault()
    }
	   else  {
      console.log("No targetId or z found.");
    }
  } else if (t.matches('#dropdownMenu1')) { // load paginator
    const self = `<span data-template="dummyString"></span>`
    $('#loadMeLast').innerHtml = (self + '#later li')
  } else if (t.matches('#toggleButton')) { // toggle ToC tree: expand/collapse
    if (t.hasClass('expanded')) {
      $('#tableOfConts').jstree('close_all')
      t.removeClass('expanded').addClass('collapsed')
      $('span[class="glyphicon glyphicon-resize-small"]').removeClass('glyphicon glyphicon-resize-small').addClass('glyphicon glyphicon-fullscreen')
    } else if (t.hasClass('collapsed')) {
      $('#tableOfConts').jstree('open_all')
      t.removeClass('collapsed').addClass('expanded')
      $('span[class="glyphicon glyphicon-fullscreen"]').removeClass('glyphicon glyphicon-fullscreen').addClass('glyphicon glyphicon-resize-small')
    }
  } else if (t.matches('.hideMe')) { // anchors in ToC popup: close modal window
    $('#myModal').modal('hide') // 't' would reference the anchor that was clicked
  } else if (t.matches('.dropdown-menu.export-options')) { // export options: do not close menu on click
    // console.log(`Stop event propagation for ${e} ...`)
    e.stopPropagation()
  } else if (t.matches('.pageNo')) { // a page number: open viewer
    // console.log(`Not performing default action for ${e} ...`)
    e.preventDefault() // do not actually go to this url - or go there if javascript is disabled
    t.blur()
    showTify(t.getAttribute('data-canvas'))
  } else if (t.closest('[data-rel="popover"]')) { // toolbox/hand icon: show popover and highlight section, but don't jump to the anchor
    console.log(`Not performing default action for ${e} ...`)
    e.preventDefault()
    console.log(`Stop event propagation for ${e} ...`)
    e.stopPropagation()
    $(t.closest('[data-rel="popover"]')).popover('show')
    toolboxHighlight(this, 'on')
  }
})

// document.ready-like functions collecting init for all of the above...
// - document.DOMContentLoaded triggers when DOM has been completely parsed
//   Synchronous scripts have been executed (no images, styles loaded and no async scripts executed),
// - window.load event, by contrast, triggers when *everything* has been loaded (i.e. later)
document.addEventListener('DOMContentLoaded', function (event) {
 console.log("DomContentLoaded");
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
    .jstree({ 'core': { } })

  // initialize (jquery) dialogue window for Image viewer
  $('#parent').dialog({
    position: { my: 'left top', at: 'left+5 bottom+40', of: 'div.navbar' },
    autoOpen: false,
    width: Math.min($(window).width() * 0.4, 600), // startsize of the dialog
    height: Math.min($(window).height() * 0.8, 700),
    create: function (event, ui) {
      $(event.target).parent().css('position', 'fixed')
    },
    resizeStop: function (event, ui) {
      const position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
        (Math.floor(ui.position.top) - $(window).scrollTop())]
      $(event.target).parent().css('position', 'fixed')
      $('#parent').dialog('option', 'position', position)
    },
    close: function (event, ui) {
      params.delete('viewer')
      window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
      console.log('In orig/edit ' + window.location.hash)
      console.log(`Stop event propagation for ${event} ...`)
      event.stopImmediatePropagation()
      console.log(`Not performing default action for ${event} ...`)
      event.preventDefault()
      return false
    }
  })

  // show GUI-Nav when scolling upwards
  $('.navbar-white')
    .css('padding-top', parseInt($('#main-menu').css('height')) - 2)
    .autoHidingNavbar()
    .autoHidingNavbar('setShowOnBottom', false)
    .autoHidingNavbar('setAnimationDuration', 400)
})

window.addEventListener('load', async function (e) {
  // apply search term highlighting
  highlightSearchTerm()

  // apply constituted/diplomatic mode
  applyMode()

  // reveal darkened text after loading
  showTextWithDelay(1500)

  // if we have a 'viewer' URL parameter, open the viewer popup
  if (params.get('viewer') !== undefined && params.get('viewer') !== null && params.get('viewer').length > 0) {
    showTify(params.get('viewer'))
  }
})

