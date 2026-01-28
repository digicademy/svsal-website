/* eslint-env browser */

// ===== Search term highlighting =====

// This checks if a searchTerm URL query parameter is present (?q=XY)
// and, if so, replaces innerHTML of the InfiniteAjaxScroll container element
// with version of the original HTML that has the search term highlighted
function highlightSearchTerm () {
  const searchTerm = params.get('q') || ''
  // console.log(`searchTerm: ${searchTerm} (params: ${params})`)
  if (searchTerm.length > 0) {
    const targetElement = document.getElementById('wrapperWork')
    const origHTML = targetElement.innerHTML.trim()
    highlightReplace(origHTML, searchTerm, targetElement)

    // also update the links to next/prev/top inside the iasContainer
    $('.next, .prev, .top').each(function (i, obj) {
      obj.href = obj.pathname + '?' + params
    })

  // enable minimap for search results
  // document.getElementById("minimap").style.visibility = "visible"
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
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      // console.log('This is string: ' + str)
      if (errorNode) {
        throw new Error('Response could not be parsed as xml')
      }
      return doc.getElementsByTagName('channel')[0]
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
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.remove('highlighted') })
  } else {
    [].forEach.call(document.getElementsByClassName(htmlClass), function (el) { el.classList.add('highlighted') })
  }
  // then toggle the highlighting also for the invoking element
  document.getElementById(invokingElement).classList.toggle('highlighted')
}

function toolboxHighlight (elem, mode) {
  const target = elem.className === 'sal-toolbox' ? elem : elem.parentElement.nextElementSibling
  if (target !== undefined && mode === 'on') {
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.visibility = 'visible'
    }
    elem.style.setProperty('color', '#102873', 'important')
    if (target !== null) {
      target.style.backgroundColor = '#F0F0F0'
    }
  } else if (target !== undefined && mode === 'off') {
    console.log(elem)
    // elem.closest('.sal-toolbox').children('span').style.removeProperty('color')
    // elem.closest('span').parentElement.style.removeProperty('color')
    // elem.closest('span').parentElement.style.removeProperty('background-color')
    console.log(elem.className)
    console.log(elem.style)
    if (target !== null) {
      target.style.backgroundColor = ''
    }
    if (elem.closest('.sal-toolbox-marginal')) {
      elem.style.visibility = 'hidden'
    }
  }
}

// Add entity highlighting as needed
$('#hiliteBox a.highlighted').each(function () {
  $(this).click() // this disables highlighting
  $(this).click() // this re-enables it
})

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
  // console.log('$lang=' + language)
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

// ===== Binding and Initialization =====

// Bind all click events
document.body.addEventListener('click', async function (e) {
  const t = e.target
  // $('.collapse .navbar-collapse').collapse('hide') // Hide collapsible menu after clicking anywhere
  // console.log('element collapsed')
  // Click outside of popover: close popover and no longer highlight text section
  // (and continue checking against all the other event listeners)
  if (!t.closest('[data-rel="popover"]')) {
    let salToolbox = t
    console.log(t.parents('div.sal-toolbox-body').siblings('a'))
    $('[data-rel="popover"]').popover('hide')
    toolboxHighlight(salToolbox, 'off')
  }
  $('.collapse .navbar-collapse').collapse('hide') // Hide collapsible menu after clicking anywhere
  console.log('element collapsed')
  // Problem here: the glyphicon-resize-small in useless, as only the cross can close the ToC.
  if (t.matches('#toggleButton')) { // toggle ToC tree: expand/collapse
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
  } else if (t.matches('.dropdown-menu.export-options.dropdown.dropdown-toggle')) { // export options: do not close menu on click
    console.log(`Stop event propagation for ${e}, possibly dropdown toolbox...`)
    e.stopPropagation()
  } else if (t.closest('[data-rel="popover"]')) { // toolbox/hand icon: show popover and highlight section, but don't jump to the anchor
    console.log(`Not performing default action for ${e} ...`)
    e.preventDefault()
    console.log(`Stop event propagation for ${e} ...`)
    e.stopPropagation()
    $(t.closest('[data-rel="popover"]')).popover('show')
    console.log('inside addEventListener, toolboxhighlight')
    toolboxHighlight(t, 'on')
  }
})

// document.ready-like functions collecting init for all of the above...
// - document.DOMContentLoaded triggers when DOM has been completely parsed
//   Synchronous scripts have been executed (no images, styles loaded and no async scripts executed),
// - window.load event, by contrast, triggers when *everything* has been loaded (i.e. later)
document.addEventListener('DOMContentLoaded', function (event) {
  // console.log('DomContentLoaded')
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

  // apply search term highlighting
  highlightSearchTerm()
})

window.addEventListener('load', async function (e) {
  // initialize context menu and highlighting (so late because it may need
  // to apply to asynchronously loaded data)
  initializePopupsAndHighlighting()
})
