/* eslint-env browser */

const validParams = ['mode', 'q', 'format', 'viewer', 'beta']
const params = (new URL(window.location.href)).searchParams
const beta = Boolean(params.get('beta'))

// ==== Beta Feature Switch ====

function showBeta () {
  // show beta features if beta is activated via commandline switch
  if (beta) {
    document.querySelectorAll('.beta').forEach(function (el) {
      el.style.display = 'block'
    })
  }
}

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
  window.history.replaceState(
    null,
    '',
    window.location.pathname + '?' + params + window.location.hash
  )
  console.log(
    'applyOrigMode: ' +
      (null,
      '',
      window.location.pathname + '?' + params + window.location.hash)
  )
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
  window.history.replaceState(
    null,
    '',
    window.location.pathname + '?' + params + window.location.hash
  )
  console.log(
    'applyEditMode: ' +
      (null,
      '',
      window.location.pathname + '?' + params + window.location.hash)
  )
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
      const doc = parser.parseFromString(str, 'text/html')
      const errorNode = doc.querySelector('parsererror')
      // console.log('This is string: ' + str)
      if (errorNode) {
        throw new Error('Response could not be parsed as html')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then((data) => {
      // Push highlighted HTML to target element
      const doc1 = data
        .getElementsByTagName('item')[0]
        .getElementsByTagName('description')[0].innerHTML
      console.log('Replacing targetElement.innerHTML with highlighted HTML.')
      targetElement.innerHTML = doc1
    })
    .then((_) => {
      /*
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
      */
    })
    .catch((error) => {
      console.error(
        'There has been a problem with the fetch operation in highlightSearch(): ',
        error
      )
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
    // document.getElementById("minimap").style.visibility = "visible"
  } else {
    document.getElementById('minimap').style.visibility = 'hidden'
  }
}

// ===== Entity highlighting =====

// This highlights spans of named entities (persons, books etc.)
// It is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
function highlightSpanClassInText (htmlClass, invokingElement) {
  // make all htmlClass elements have the inverse highlighting of the invoking element
  if (
    document.getElementById(invokingElement).classList.contains('highlighted')
  ) {
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

// Add entity highlighting as needed
$('#hiliteBox a.highlighted').each(function () {
  $(this).click() // this disables highlighting
  $(this).click() // this re-enables it
  console.log('This is hilitebox initializer')
})

// ===== Passage context/hand menu: Cite, Copy link, Export =====

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

// ===== Embeddings Experiment =====

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
async function showEmbeddingsExperiment (elem) {
  // Our target ID is (only) in the cite link
  const targetID = elem.parentElement.parentElement.getElementsByClassName('cite-link')[0].textContent
  const citRec = elem.parentElement.parentElement.getElementsByClassName('sal-cite-rec')[0].textContent.replace(/\s+/g, ' ').trim()
  const citation = citRec.substring(0, citRec.indexOf(', in: '))

  document.getElementById('embeddings_experiment_title').innerHTML = `${citation}:`
  document.getElementById('embeddings_experiment_text').innerHTML = `Retrieve similar texts ...
      <div id="spinner-dialog" class="ispinner ispinner-medium">
          <div class="spinner-container">
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
              <div class="ispinner-blade"></div>
          </div>
      </div>`
  showSpinnerMedium()

  // Open the dialog window with jquery-ui Dialog method
  $('#embeddings_experiment').dialog('open')
  $('[data-rel="popover"]').popover('hide')

  // Prompt for VDB API key
  const VDB_API_KEY = await getVdbAPIKey()

  // If user cancelled or didn't provide a key, show message and exit
  if (!VDB_API_KEY) {
    document.getElementById('embeddings_experiment_title').innerHTML = `${citation}:`
    document.getElementById('embeddings_experiment_text').innerHTML = 'API key required to retrieve similar texts.'
    hideSpinnerMedium()
    return
  }

  const threshold = 0.7
  const limit = 5

  const targetIDEncoded = encodeURIComponent(targetID)
  const queryURL = 'https://c100-188.cloud.gwdg.de/vdb-api/v1/similars/sal/sal-openai-large/' + targetIDEncoded +
    '?threshold=' + threshold + '&limit=' + limit
  const getHeaders = { 'Authorization': `Bearer ${VDB_API_KEY}`, 'Content-Type': 'application/json' }
  var count = 0

  // Send async request and handle response
  try {
    // First request: get similar text IDs
    const response = await fetch(queryURL, {method: 'GET', headers: getHeaders})

    if (!response.ok) {
      throw new Error('Network response was not OK')
    }

    const str = await response.text()
    const data = JSON.parse(str)
    const ids = data.ids

    // When no or empty result set is returned, explain why this could be
    if (!ids || ids.length === 0) {
      document.getElementById('embeddings_experiment_title').innerHTML = `${citation}:`
      document.getElementById('embeddings_experiment_text').innerHTML = `
        <div class="no-results-message">
          <p>No similar texts were found in the database with the current threshold (${threshold}).</p>
          <p>This may be because:</p>
          <ul>
            <li>This text is unique in its content and approach</li>
            <li>Similar texts exist but are not yet in our database</li>
            <li>The similarity threshold (${threshold}) may be too high</li>
          </ul>
          <p>You can <button class="try-again-btn" onclick="showEmbeddingsExperiment(document.querySelector('[data-rel=\'popover\']'))">try again</button> with a different text passage.</p>
        </div>
        <style>
          .no-results-message {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 20px;
            margin-top: 20px;
          }
          .try-again-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 5px 10px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 14px;
            margin: 5px 0;
            cursor: pointer;
            border-radius: 4px;
          }
          .try-again-btn:hover {
            background-color: #45a049;
          }
        </style>
      `
      hideSpinnerMedium()
      return
    }

    const urls = ids.map(id => decodeURIComponent(id))

    // Add the original text to the list
    urls.unshift(targetID)
    count = urls.length

    if (count === 0) {
      document.getElementById('embeddings_experiment_title').innerHTML = `${citation}:`
      document.getElementById('embeddings_experiment_text').innerHTML = 'No similar texts found'
      hideSpinnerMedium()
      return
    }

    document.getElementById('embeddings_experiment_title').innerHTML = `${citation}`
    document.getElementById('embeddings_experiment_text').innerHTML = `${count} similar texts found. Analysing...`

    // Second request: fetch text and metadata for each URL
    const requestURLs = urls.map(url => 'https://c100-188.cloud.gwdg.de/vdb-api/v1/embeddings/sal/sal-openai-large/' + encodeURIComponent(url))
    const records = await Promise.all(requestURLs.map(async (u) => {
      const response = await fetch(u, { method: 'GET', headers: getHeaders })

      if (!response.ok) {
        throw new Error(`Network response was not ok for URL: ${u}`)
      }

      return response.json()
    }))

    // Process the records
    const objects = records.map(r => ({
      'id': r.text_id,
      'text': r.text,
      'author': r.metadata.author,
      'year': r.metadata.year,
      'language': r.metadata.lang,
      'url': r.metadata.url,
      'wid': r.metadata.wid,
      'xmlid': r.metadata.xmlid
    }))

    // Store texts in a global variable for later analysis
    window.embeddingTexts = objects

    // Display the texts without analysis
    const htmlContent = displayTextComparison(objects)

    document.getElementById('embeddings_experiment_title').innerHTML = `${citation}: (${count} similar texts)`
    document.getElementById('embeddings_experiment_text').innerHTML = htmlContent
  } catch (error) {
    console.error('There has been a problem with the fetch operation in showEmbeddingsExperiment():', error)
    document.getElementById('embeddings_experiment_text').innerHTML = `Error: ${error.message}`
  } finally {
    if (document.getElementsByClassName('ispinner-medium').length > 0) {
      hideSpinnerMedium()
    }
  }
}

// Function to display texts without LLM analysis
function displayTextComparison (texts) {
  // Generate HTML with expandable sections, but without LLM analysis
  const htmlContent = `
    <div class="text-comparison-container">
      ${texts.map((text, index) => `
        <div class="expandable-section">
          <div class="section-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
            <h4>Text ${index + 1}${index === 0 ? ' (original text)' : ''}: ${text.author} (${text.year})</h4>
          </div>
          <div class="section-content" style="display: none;">
            <a href="${text.url}" target="_blank">Go to full text</a><br/>
            ${text.text}
          </div>
        </div>
      `).join('')}
      <div class="analysis-section">
        <button id="generate-analysis-btn" class="generate-analysis-btn" onclick="generateTextAnalysis()">
          Generate AI Analysis
        </button>
        <div id="analysis-content" class="comparison-explanation">
          <p>Click the button above to generate an AI analysis comparing these texts.</p>
        </div>
      </div>
    </div>
    
    <style>
      .text-comparison-container {
        font-family: Arial, sans-serif;
        max-width: 1200px;
        margin: 0 auto;
      }
      .comparison-explanation {
        background-color: #fbfbfb;
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 5px;
      }
      .expandable-section {
        border: 1px solid #ddd;
        margin-bottom: 10px;
        border-radius: 5px;
      }
      .section-header {
        background-color: #f9f9f9;
        padding: 10px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .section-header h3 {
        margin: 0;
      }
      .metadata {
        color: #666;
        font-size: 0.8em;
      }
      .section-content {
        padding: 10px;
        background-color: #ffffff;
      }
      .generate-analysis-btn {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 10px 15px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 10px 0;
        cursor: pointer;
        border-radius: 4px;
      }
      .generate-analysis-btn:hover {
        background-color: #45a049;
      }
      .analysis-section {
        margin-top: 20px;
        border-top: 1px solid #ddd;
        padding-top: 15px;
      }
    </style>
  `

  return htmlContent
}

// Function to generate "AI Analysis"
// eslint-disable-next-line no-unused-vars
async function generateTextAnalysis () {
  // Show a loading indicator
  document.getElementById('analysis-content').innerHTML = `
    <div class="analysis-loading">
      <div class="spinner-container">
        <div class="ispinner ispinner-small">
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
          <div class="ispinner-blade"></div>
        </div>
      </div>
      <p>Generating analysis...</p>
    </div>
  `

  try {
    // Get the OpenAI API key (either from storage or by prompting the user)
    const apiKey = await getOpenAIAPIKey()

    if (!apiKey) {
      document.getElementById('analysis-content').innerHTML = `
        <p>Analysis canceled. No API key provided.</p>
        <button id="generate-analysis-btn" class="generate-analysis-btn" onclick="generateTextAnalysis()">
          Try Again
        </button>
      `
      return
    }

    // Get the collected texts from the global variable
    const texts = window.embeddingTexts

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: `You are an expert text analyst.
                  Compare the following text passages that are presumably about the same or very similar topics.
                  The texts are excerpts in Latin, Spanish, or both, of larger, early modern works about legal, ethical, social or administrative issues.
                  Determine whether the passages really are about the same subject and analyze their similarities and differences.
                  If there are many texts and groups of them agree on certain things, group them in your analysis, too. Explain your reasoning.
                  Also indicate when a text seemst to be about a different subject altogether.
                  The first of the texts is our focus text, and the others are similar texts that we want to compare to it.
                  Give your analysis in clear and precise English, detailing points of agreement and disagreement between the authors.
                  Prioritize thoroughness and accuracy in your interpretations, drawing on linguistic cues and on your interpretation of what
                  general convictions and ideas the authors might have, but explain them only to the extent that they are relevant for their
                  agreement or disagreement. Also, if you rely on such interpretations, make sure to explain on what textual clues you base
                  your assumptions about those more general ideas and convictions of the authors.
                  Explain the steps of your reasoning carefully.
                  With regard to formatting, give your output in HTML, not in markdown (in particular, use "<b>bold text</b>" and do NOT,
                  I repeat, DO NOT, use markdown's asterisks (**bold text**) for displaying bold text).
                  Do not wrap it in triple backticks either, I want to process it directly as I get it from you.`
      },
      {
        role: 'user',
        content: texts.map((text, index) =>
          `Text ${index + 1} ${index === 0 ? '(original text)' : ''} from ${text.year} by ${text.author}:\n\n${text.text}`
        ).join('\n\n---\n\n')
      }
    ]

    // Send request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.4,
        max_tokens: 1500
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API response error: ${response.status} - ${errorData.error ? errorData.error.message : undefined || response.statusText}`)
    }

    const data = await response.json()
    const comparisonText = data.choices[0].message.content

    // Update the analysis content
    document.getElementById('analysis-content').innerHTML = `<p>${comparisonText.replace(/\n/g, '<br>')}</p>`
  } catch (error) {
    console.error('Error generating text analysis:', error)
    document.getElementById('analysis-content').innerHTML = `
      <p>Error generating analysis: ${error.message}</p>
      <button id="generate-analysis-btn" class="generate-analysis-btn" onclick="generateTextAnalysis()">
        Try Again
      </button>
    `
  }
}

// Function to securely store API keys
function storeEncryptedAPIKey (keyName, apiKey, expirationDays = 30) {
  try {
    // Simple encryption (not truly secure, but better than plaintext)
    // In production, use a more robust encryption method
    const encryptedKey = btoa(apiKey.split('').reverse().join(''))

    const expiration = new Date()
    expiration.setDate(expiration.getDate() + expirationDays)

    const data = {
      key: encryptedKey,
      expires: expiration.getTime()
    }

    localStorage.setItem(keyName, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Error storing ${keyName}:`, error)
    return false
  }
}
// Function to retrieve and decrypt API keys
function getStoredAPIKey (keyName) {
  try {
    const data = localStorage.getItem(keyName)
    if (!data) return null

    const parsed = JSON.parse(data)

    // Check if expired
    if (parsed.expires && new Date().getTime() > parsed.expires) {
      localStorage.removeItem(keyName)
      return null
    }

    // Decrypt
    const decryptedKey = atob(parsed.key).split('').reverse().join('')
    return decryptedKey
  } catch (error) {
    console.error(`Error retrieving ${keyName}:`, error)
    return null
  }
}
// Function to delete stored API keys
function deleteStoredAPIKey (keyName) {
  localStorage.removeItem(keyName)
}
// Add a button to reset API keys in the dialog
function addResetAPIKeyButtons () {
  // Check if the buttons already exist
  if (document.getElementById('reset-api-keys-btn')) return

  const dialog = document.getElementById('embeddings_experiment')
  const titleBar = dialog ? dialog.querySelector('.ui-dialog-titlebar') : undefined

  if (titleBar) {
    // Add a dropdown menu for API key management
    const settingsButton = document.createElement('button')
    settingsButton.id = 'api-keys-settings-btn'
    settingsButton.className = 'api-keys-settings-btn ui-dialog-titlebar-close'
    settingsButton.title = 'API Key Settings'
    settingsButton.innerHTML = '⚙️'
    settingsButton.style.right = '40px'
    settingsButton.style.fontSize = '16px'
    settingsButton.onclick = function () {
      // Create and show dropdown menu
      const menu = document.createElement('div')
      menu.id = 'api-keys-menu'
      menu.className = 'api-keys-menu'
      menu.style.position = 'absolute'
      menu.style.top = '30px'
      menu.style.right = '40px'
      menu.style.backgroundColor = 'white'
      menu.style.border = '1px solid #ccc'
      menu.style.borderRadius = '4px'
      menu.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)'
      menu.style.zIndex = '10000'
      menu.style.width = '200px'

      menu.innerHTML = `
        <div style="padding: 10px; border-bottom: 1px solid #eee;">
          <button id="reset-vdb-key-btn" style="width: 100%; padding: 5px; margin-bottom: 5px; cursor: pointer;">
            Reset VDB API Key
          </button>
          <button id="reset-openai-key-btn" style="width: 100%; padding: 5px; cursor: pointer;">
            Reset OpenAI API Key
          </button>
        </div>
      `

      // Add the menu to the dialog
      titleBar.appendChild(menu)

      // Add event listeners for the reset buttons
      document.getElementById('reset-vdb-key-btn').onclick = function (e) {
        e.stopPropagation()
        if (confirm('Are you sure you want to reset your VDB API key?')) {
          deleteStoredAPIKey('vdb_api_key')
          alert('VDB API key has been reset.')
        }
        titleBar.removeChild(menu)
      }

      document.getElementById('reset-openai-key-btn').onclick = function (e) {
        e.stopPropagation()
        if (confirm('Are you sure you want to reset your OpenAI API key?')) {
          deleteStoredAPIKey('openai_api_key')
          alert('OpenAI API key has been reset.')
        }
        titleBar.removeChild(menu)
      }

      // Close the menu when clicking outside
      document.addEventListener('click', function closeMenu (e) {
        if (!menu.contains(e.target) && e.target !== settingsButton) {
          if (menu.parentNode) {
            titleBar.removeChild(menu)
          }
          document.removeEventListener('click', closeMenu)
        }
      })
    }

    titleBar.appendChild(settingsButton)
  }
}
// Function to prompt user for API key with a modal
function promptForAPIKey (keyType) {
  return new Promise((resolve) => {
    const title = keyType === 'vdb' ? 'VDB API Key Required' : 'OpenAI API Key Required'
    const description = keyType === 'vdb'
      ? 'To retrieve similar texts, please enter your VDB API key.'
      : 'To generate an AI analysis of the similar texts, please enter your OpenAI API key.'

    const modalHTML = `
      <div id="api-key-modal" class="api-key-modal">
        <div class="api-key-modal-content">
          <span class="api-key-close">&times;</span>
          <h3>${title}</h3>
          <p>${description}</p>
          <p>Your key will be securely stored in your browser and never sent to our servers.</p>
          <input type="text" id="api-key-input" placeholder="Enter your ${keyType === 'vdb' ? 'VDB' : 'OpenAI'} API key" 
                 style="width: 100%; padding: 8px; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-top: 15px;">
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="remember-api-key" checked>
              <span style="margin-left: 5px;">Remember for 30 days</span>
            </label>
            <div>
              <button id="api-key-cancel" style="margin-right: 10px; padding: 8px 15px;">Cancel</button>
              <button id="api-key-submit" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none;">Submit</button>
            </div>
          </div>
        </div>
      </div>
      <style>
        .api-key-modal {
          position: fixed;
          z-index: 10000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .api-key-modal-content {
          background-color: #fefefe;
          padding: 20px;
          border-radius: 5px;
          width: 500px;
          max-width: 80%;
        }
        .api-key-close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
        }
        .api-key-close:hover {
          color: black;
        }
      </style>
    `

    // Add modal to body
    const modalContainer = document.createElement('div')
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer)

    // Get references to elements
    const modal = document.getElementById('api-key-modal')
    const closeBtn = modal.querySelector('.api-key-close')
    const submitBtn = document.getElementById('api-key-submit')
    const cancelBtn = document.getElementById('api-key-cancel')
    const input = document.getElementById('api-key-input')
    const rememberCheckbox = document.getElementById('remember-api-key')

    // Handle submit
    submitBtn.addEventListener('click', () => {
      const apiKey = input.value.trim()
      if (apiKey) {
        if (rememberCheckbox.checked) {
          const keyName = keyType === 'vdb' ? 'vdb_api_key' : 'openai_api_key'
          storeEncryptedAPIKey(keyName, apiKey)
        }
        document.body.removeChild(modalContainer)
        resolve(apiKey)
      } else {
        input.style.border = '2px solid red'
      }
    })

    // Handle cancel and close
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer)
      resolve(null)
    })

    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer)
      resolve(null)
    })

    // Handle enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitBtn.click()
      }
    })

    // Focus the input
    setTimeout(() => input.focus(), 100)
  })
}
// Function to get the VDB API key (from storage or prompt user)
async function getVdbAPIKey () {
  // First check if we have a stored key
  const storedKey = getStoredAPIKey('vdb_api_key')

  if (storedKey) {
    return storedKey
  }

  // If no stored key, prompt the user
  return promptForAPIKey('vdb')
}
// Function to get the OpenAI API key (from storage or prompt user)
async function getOpenAIAPIKey () {
  // First check if we have a stored key
  const storedKey = getStoredAPIKey('openai_api_key')

  if (storedKey) {
    return storedKey
  }

  // If no stored key, prompt the user
  return promptForAPIKey('openai')
}

function showSpinnerMedium () {
  document.getElementsByClassName('ispinner-medium')[0].classList.add('show')
};
function hideSpinnerMedium () {
  document.getElementsByClassName('ispinner-medium')[0].classList.remove('show')
};

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
  window.history.replaceState(
    null,
    '',
    window.location.pathname + '?' + params + window.location.hash
  )
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
    window.history.replaceState(
      null,
      '',
      window.location.pathname + '?' + params + window.location.hash
    )
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
  $('html, body').animate({'scrollTop': goHere}, 800, 'swing', function () {
    showTextWithDelay(500)
    document
      .getElementById(targetId)
      .effect('highlight', {'color': 'LightSkyBlue'}, 1200)
  })
  $('html, body').bind('scroll', function () {
    if (
      $(this).scrollTop() + $(this).innerHeight() >=
      $(this)[0].scrollHeight
    ) {
      alert('end reached')
    }
  })
  showTextWithDelay(500)
  document
    .getElementById(targetId)
    .effect('highlight', {color: 'LightSkyBlue'}, 1200)
}

// Mobil-View: scroll to last collapsed navbar item on mobile when there are many items
// $('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })

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

// Darken body (when scrolling) in order not to confuse readers by ias's jumping around
function hideText () {
  document.getElementById('body').classList.add('darkenBody')
}
/* function showText () {
   document.getElementById('body').classList.remove('darkenBody')
}; */
async function showTextWithDelay (delay) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Delayed showText now showing text.')
      document.getElementById('body').classList.remove('darkenBody')
      window.dispatchEvent(new Event('resize')) // trigger resize event to provoke prefilling
      resolve()
    }, delay)
  })
}

// Hide text during loading
hideText()

// and also hide during loading of new ias items (only when scrolling up/backwards)
// ias.on('top', (event) => { // when user scrolls to the top
//   hideText()
// })

ias.on('page', (event) => {
  // when user scrolls to a new segment: update address bar
  const target = new URL(event.url, location.protocol + '//' + location.hostname + '/') // event.url is a string, but we want to use URL methods (second parameter is basename)
  // console.log('This is target :' + target)
  params.forEach(function (value, key) {
    // sanitize query parameters
    if (validParams.indexOf(key) === -1) {
      params.delete(key)
    }
    // console.log('Here are all the query parameters: ' + params)
  })
  const newUrl = target.pathname.substr(target.pathname.lastIndexOf('/') + 1) + '?' + params
  history.replaceState(history.state, '', newUrl)
  // showTextWithDelay(0)
})

/*
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
*/

ias.on('append', function (event) {
  // when items are appended: add searchTerm highlighting as needed
  const searchTerm = params.get('q') || ''
  if (searchTerm.length > 0) {
    for (let i of [...event.items]) {
      let origHTML = i.innerHTML.trim()
      console.log(
        `calling asynchronous highlighting with searchTerm ${searchTerm} ...`
      )
      highlightReplace(origHTML, searchTerm, i)
    }
  }
})
ias.on('appended', function (e) {
  // after new ias items have been appended: add functionality to newly loaded elements
  // 1. Initialize Popover Boxes ...
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
      toolboxHighlight(this, 'on')
      return $(this).siblings('.sal-toolbox-body').html()
    }
    // close popup by clicking outside (handled in click-binding below)
  })
  // 2. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 3. Add entity highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
  // 4. Show Beta features if applicable
  showBeta()
})
ias.on('prepend', async function (event) {
  // when items are prepended: add searchTerm highlighting as needed
  const searchTerm = params.get('q') || ''
  if (searchTerm.length > 0) {
    for (let i of [...event.items]) {
      let origHTML = i.innerHTML.trim()
      console.log(
        `calling asynchronous highlighting with searchTerm ${searchTerm} ...`
      )
      highlightReplace(origHTML, searchTerm, i)
    }
  }
})
ias.on('prepended', function (e) {
  // after new ias items have been prepended: add functionality to newly loaded elements
  console.log('prepended event')
  // 1. Initialize Popover Boxes ...
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
      toolboxHighlight(this, 'on')
      return $(this).siblings('.sal-toolbox-body').html()
    }
    // close popup by clicking outside (handled in click-binding below)
  })
  // 2. Add tooltip
  $('.messengers').tooltipster({'multiple': true})
  // 3. Add entity highlighting as needed
  $('#hiliteBox a.highlighted').each(function () {
    $(this).click() // this disables highlighting
    $(this).click() // this re-enables it
  })
  // 4. Show Beta features if applicable
  showBeta()

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
    const z = t.attr('href').slice(t.attr('href').indexOf('#') + 1)
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
    if (t.hasClass('expanded')) {
      $('#tableOfConts').jstree('close_all')
      t.removeClass('expanded').addClass('collapsed')
      $('span[class="glyphicon glyphicon-resize-small"]')
        .removeClass('glyphicon glyphicon-resize-small')
        .addClass('glyphicon glyphicon-fullscreen')
    } else if (t.hasClass('collapsed')) {
      $('#tableOfConts').jstree('open_all')
      t.removeClass('collapsed').addClass('expanded')
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
  console.log('DomContentLoaded')
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

  // initialize (jquery) dialogue window for Image viewer
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
      window.history.replaceState(
        null,
        '',
        window.location.pathname + '?' + params + window.location.hash
      )
      console.log('In orig/edit ' + window.location.hash)
      console.log(`Stop event propagation for ${event} ...`)
      event.stopImmediatePropagation()
      console.log(`Not performing default action for ${event} ...`)
      event.preventDefault()
      return false
    }
  })

  // initialize (jquery) dialogue window for embeddings experiment
  $('#embeddings_experiment').dialog({
    position: { my: 'left top', at: 'left+155 bottom+40', of: 'div.navbar' },
    // inset: 55px auto auto 137px;
    autoOpen: false,
    width: Math.min($(window).width() * 0.8, 1200), // startsize of the dialog
    height: Math.min($(window).height() * 0.8, 700),
    create: function (event, ui) {
      $(event.target).parent().css('position', 'fixed')
    },
    // Add to the create or open event
    open: function (event, ui) {
      // Add reset API key buttons to dialog title bar
      addResetAPIKeyButtons()
    },
    resizeStop: function (event, ui) {
      const position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
        (Math.floor(ui.position.top) - $(window).scrollTop())]
      $(event.target).parent().css('position', 'fixed')
      $('#embeddings_experiment').dialog('option', 'position', position)
    },
    close: function (event, ui) {
      console.log(`Stop event propagation for ${event} ...`)
      event.stopImmediatePropagation()
      console.log(`Not performing default action for ${event} ...`)
      event.preventDefault()
      return false
    }
  })

  // show GUI-Nav when scolling upwards
  $('.navbar-white').css(
    'padding-top',
    parseInt($('#main-menu').css('height')) - 2
  )
  // .autoHidingNavbar()
  // .autoHidingNavbar('setShowOnBottom', false)
  // .autoHidingNavbar('setAnimationDuration', 400)
})

window.addEventListener('load', async function (e) {
  // apply search term highlighting
  highlightSearchTerm()

  // apply constituted/diplomatic mode
  applyMode()

  // reveal darkened text after loading
  showTextWithDelay(1500)

  showBeta()

  // if we have a 'viewer' URL parameter, open the viewer popup
  if (
    params.get('viewer') !== undefined &&
    params.get('viewer') !== null &&
    params.get('viewer').length > 0
  ) {
    showTify(params.get('viewer'))
  }
})
