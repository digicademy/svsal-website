// ===== Embeddings Experiment =====

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
async function showEmbeddingsExperiment (elem) {
  // Our target ID is (only) in the cite link
  const targetID = elem.parentElement.parentElement.getElementsByClassName('cite-link')[0].textContent
  const citRec = elem.parentElement.parentElement.getElementsByClassName('sal-cite-rec')[0].textContent.replace(/\s+/g, ' ').trim()
  const citation = sanitizeText(citRec.substring(0, citRec.indexOf(', in: ')))

  document.getElementById('embeddings_experiment_title').textContent = `${citation}:`
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
    document.getElementById('embeddings_experiment_title').textContent = `${citation}:`
    document.getElementById('embeddings_experiment_text').innerHTML = 'API key required to retrieve similar texts.'
    hideSpinnerMedium()
    return
  }

  const targetIDEncoded = encodeURIComponent(targetID)
  const authorEncoded = encodeURIComponent(document.querySelector('meta[name="author"]').content)
  const queryURL = EMBEDDINGS_SERVER + '/similars/' + EMBEDDINGS_PROJECT + '/'
                      + targetIDEncoded
                      + '?threshold=' + EMBEDDINGS_THRESHOLD
                      + '&limit=' + EMBEDDINGS_LIMIT
                      + '&metadata_path=author&metadata_value=' + authorEncoded
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

    if (!ids || ids.map(id => decodeURIComponent(id)).length === 0) {
      document.getElementById('embeddings_experiment_title').textContent = `${citation}:`
      document.getElementById('embeddings_experiment_text').innerHTML = sanitizeHTML(`
        <div class="no-results-message">
          <p>No similar texts were found in the database with the current threshold (${EMBEDDINGS_THRESHOLD}).</p>
          <p>This may be because:</p>
          <ul>
            <li>This text is unique in its content and approach</li>
            <li>Similar texts exist but are not yet in our database</li>
            <li>The similarity threshold (${EMBEDDINGS_THRESHOLD}) may be too high</li>
          </ul>
        </div>
        <style>
          .no-results-message {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 20px;
            margin-top: 20px;
          }
        </style>
      `)
      hideSpinnerMedium()
      return
    }

    const urls = ids.map(id => decodeURIComponent(id))

    // Add the original text to the list
    urls.unshift(targetID)
    count = urls.length - 1 // do not count the original text

    document.getElementById('embeddings_experiment_title').textContent = `${citation}`
    document.getElementById('embeddings_experiment_text').textContent = `${count} similar texts found. Analysing...`

    // Second request: fetch text and metadata for each URL
    const requestURLs = urls.map(url => EMBEDDINGS_SERVER + '/embeddings/' + EMBEDDINGS_PROJECT + '/' + encodeURIComponent(url))
    const records = await Promise.all(requestURLs.map(async (u) => {
      const response = await fetch(u, { method: 'GET', headers: getHeaders })
      if (!response.ok) {
        throw new Error(`Network response was not ok for URL: ${u}`)
      }
      return response.json()
    }))

    // Process the records
    const objects = records.map(r => ({
      'id': ensureUrlEncoded(r.text_id),
      'text': sanitizeText(r.text),
      'author': sanitizeText(r.metadata.author),
      'year': sanitizeText(r.metadata.year),
      'language': sanitizeText(r.metadata.lang),
      'url': ensureUrlEncoded(r.metadata.url),
      'wid': sanitizeText(r.metadata.wid),
      'xmlid': sanitizeText(r.metadata.xmlid)
    }))

    // Store texts in a global variable for later analysis
    window.embeddingTexts = objects

    // Display the texts without analysis
    const htmlContent = displayTextComparison(objects)

    document.getElementById('embeddings_experiment_title').textContent = `${citation}: (${count} similar texts)`
    document.getElementById('embeddings_experiment_text').innerHTML = htmlContent
  } catch (error) {
    console.error('There has been a problem with the fetch operation in showEmbeddingsExperiment():', error)
    document.getElementById('embeddings_experiment_text').textContent = `Error: ${error.message}`
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
            <h4>Text ${index + 1}${index === 0 ? ' (original text)' : ''}: ${sanitizeText(text.author)} (${sanitizeText(text.year)})</h4>
          </div>
          <div class="section-content" style="display: none;">
            <a href="${sanitizeText(text.url)}" target="_blank">Go to full text</a><br/>
            ${sanitizeText(text.text)}
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
  document.getElementById('analysis-content').innerHTML = sanitizeHTML(`
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
  `)

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
        content: `You are an expert historian text analyst.
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
          `Text ${index + 1} ${index === 0 ? '(original text)' : ''} from ${sanitizeText(text.year)} by ${sanitizeText(text.author)}:\n\n${sanitizeText(text.text)}`
        ).join('\n\n---\n\n')
      }
    ]

    // Send request to OpenAI API
    const response = await fetch(EMBEDDINGS_SUMMARY_SERVER, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: EMBEDDINGS_SUMMARY_MODEL,
        messages: messages,
        temperature: EMBEDDINGS_SUMMARY_TEMP,
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
    document.getElementById('analysis-content').innerHTML = sanitizeHTML(`<p>${comparisonText.replace(/\n/g, '<br>')}</p>`)
  } catch (error) {
    console.error('Error generating text analysis:', error)
    document.getElementById('analysis-content').innerHTML = `
      <p>Error generating analysis: ${sanitizeText(error.message)}</p>
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
