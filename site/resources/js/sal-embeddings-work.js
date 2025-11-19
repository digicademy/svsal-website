/* global EMBEDDINGS_SERVER, EMBEDDINGS_PROJECT, EMBEDDINGS_THRESHOLD, EMBEDDINGS_LIMIT, EMBEDDINGS_SUMMARY_SERVER, EMBEDDINGS_SUMMARY_MODEL, EMBEDDINGS_SUMMARY_TEMP */
/* eslint-env browser */

// ===== Embeddings Experiment =====

/*
import {
  EMBEDDINGS_SERVER,
  EMBEDDINGS_PROJECT,
  EMBEDDINGS_THRESHOLD,
  EMBEDDINGS_LIMIT,
  EMBEDDINGS_SUMMARY_SERVER,
  EMBEDDINGS_SUMMARY_MODEL,
  EMBEDDINGS_SUMMARY_TEMP,
  sanitizeText
} from './sal-common.js'
*/

// This is being called from the HTML element's onclick event
// eslint-disable-next-line no-unused-vars
async function showEmbeddingsExperiment (elem) {
  // Our target ID is (only) in the cite link
  const targetID = elem.parentElement.parentElement.getElementsByClassName('cite-link')[0].textContent
  const citRec = elem.parentElement.parentElement.getElementsByClassName('sal-cite-rec')[0].textContent.replace(/\s+/g, ' ').trim()
  const citation = citRec.substring(0, citRec.indexOf(', in: '))

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
  // DISABLED: VDB API key is no longer required for accessing the vector database
  // const VDB_API_KEY = await getVdbAPIKey()

  // If user cancelled or didn't provide a key, show message and exit
  // DISABLED: VDB API key is no longer required
  // if (!VDB_API_KEY) {
  //   document.getElementById('embeddings_experiment_title').textContent = `${citation}:`
  //   document.getElementById('embeddings_experiment_text').textContent = 'API key required to retrieve similar texts.'
  //   hideSpinnerMedium()
  //   return
  // }
  const VDB_API_KEY = null // Not used anymore

  const targetIDEncoded = encodeURIComponent(targetID)
  const authorEncoded = encodeURIComponent(document.querySelector('meta[name="author"]').content)
  const queryURL = EMBEDDINGS_SERVER + '/similars/' + EMBEDDINGS_PROJECT + '/' + targetIDEncoded +
                      '?threshold=' + EMBEDDINGS_THRESHOLD +
                      '&limit=' + EMBEDDINGS_LIMIT +
                      '&metadata_path=author&metadata_value=' + authorEncoded
  // DISABLED: VDB API key is no longer required, but keeping code structure for potential future use
  // const getHeaders = { 'Authorization': `Bearer ${VDB_API_KEY}`, 'Content-Type': 'application/json' }
  const getHeaders = { 'Content-Type': 'application/json' }
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
      document.getElementById('embeddings_experiment_text').textContent = `
          No similar texts were found in the database with the current threshold (${EMBEDDINGS_THRESHOLD}).
          This may be because:
            - This text is unique in its content and approach
            - Similar texts exist but are not yet in our database
            - The similarity threshold (${EMBEDDINGS_THRESHOLD}) may be too high`
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

    document.getElementById('embeddings_experiment_title').textContent = `${citation}: (${count} similar texts)`
    const container = document.getElementById('embeddings_experiment_text')
    container.innerHTML = ''
    container.appendChild(htmlContent)
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
  let htmlContent = document.createElement('div')
  htmlContent.className = 'text-comparison-container'
  if (!texts || texts.length === 0) {
    htmlContent.innerHTML = '<p>No texts to display.</p>'
    return htmlContent
  }
  if (texts.length === 1) {
    htmlContent.innerHTML = '<p>No similar texts found.</p>'
    return htmlContent
  }

  // Add each text as an expandable section
  texts.forEach((text, index) => {
    const section = document.createElement('div')
    section.className = 'expandable-section'
    const header = document.createElement('div')
    header.className = 'section-header'
    header.onclick = function () {
      const next = this.nextElementSibling
      next.style.display = (next.style.display === 'none' || next.style.display === '') ? 'block' : 'none'
    }
    const h4 = document.createElement('h4')
    h4.textContent = `Text ${index + 1}${index === 0 ? ' (original text)' : ''}: ${text.author} (${text.year})`
    header.appendChild(h4)
    section.appendChild(header)

    const content = document.createElement('div')
    content.className = 'section-content'
    content.style.display = 'none'
    const link = document.createElement('a')
    try {
      link.href = text.url
      link.target = '_blank'
      link.textContent = 'Go to full text'
    } catch (e) {
      link.href = '#'
    }
    content.appendChild(link)
    content.appendChild(document.createElement('br'))
    const para = document.createElement('p')
    para.textContent = text.text
    content.appendChild(para)

    section.appendChild(content)
    htmlContent.appendChild(section)
  })

  // Add section for analysis button and content
  const analysisSection = document.createElement('div')
  analysisSection.className = 'analysis-section'
  analysisSection.innerHTML = `
    <button id="generate-analysis-btn" class="generate-analysis-btn" onclick="generateTextAnalysis()">
      Generate AI Analysis
    </button>
    <div id="analysis-content" class="comparison-explanation">
      <p>Click the button above to generate an AI analysis comparing these texts.</p>
    </div>
  `
  htmlContent.appendChild(analysisSection)

  // attach handler to the button
  analysisSection.querySelector('#generate-analysis-btn').addEventListener('click', generateTextAnalysis)

  // Add CSS styles
  const styleSection = document.createElement('style')
  styleSection.innerHTML = `
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
  `
  htmlContent.appendChild(styleSection)

  return htmlContent

  /* This was the original version generating HTML as a string
    const htmlContent = `
      <div class="text-comparison-container">
        ${texts.map((text, index) => `
          <div class="expandable-section">
            <div class="section-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">
              <h4>Text ${index + 1}${index === 0 ? ' (original text)' : ''}: ${sanitizeText(text.author)} (${sanitizeText(text.year)})</h4>
            </div>
            <div class="section-content" style="display: none;">
              <a href="${ensureUrlEncoded(text.url)}" target="_blank">Go to full text</a><br/>
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
  */
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
                  With regard to formatting, give your output in plain text, not in HTML or markdown.
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
    comparisonText.split('\n').forEach(p => {
      if (p.trim() !== '') {
        let para = document.createElement('p')
        para.textContent = p
        document.getElementById('analysis-content').appendChild(para)
      } else {
        let br = document.createElement('br')
        document.getElementById('analysis-content').appendChild(br)
      }
    })
    // document.getElementById('analysis-content').innerHTML = sanitizeHTML(`<p>${comparisonText.replace(/\n/g, '<br>')}</p>`)
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
  if (document.getElementById('api-keys-settings-btn')) return

  let titleBar
  try {
    if (typeof $ !== 'undefined' && $('#embeddings_experiment').length > 0) {
      const widget = $('#embeddings_experiment').dialog('widget')[0]
      if (widget) titleBar = widget.querySelector('.ui-dialog-titlebar')
    }
  } catch (e) {}
  if (!titleBar) {
    const dialogEl = document.getElementById('embeddings_experiment')
    if (dialogEl && dialogEl.closest) {
      const wrapper = dialogEl.closest('.ui-dialog')
      if (wrapper) titleBar = wrapper.querySelector('.ui-dialog-titlebar')
    }
  }
  if (!titleBar) return

  const settingsButton = document.createElement('button')
  settingsButton.id = 'api-keys-settings-btn'
  settingsButton.className = 'api-keys-settings-btn ui-dialog-titlebar-close'
  settingsButton.title = 'API Key Settings'
  settingsButton.innerHTML = '⚙️'
  settingsButton.style.position = 'absolute'
  settingsButton.style.right = '40px'
  settingsButton.style.top = '16px'
  settingsButton.style.fontSize = '16px'
  settingsButton.style.padding = '0 6px'
  settingsButton.style.background = 'transparent'
  settingsButton.style.border = 'none'
  settingsButton.style.cursor = 'pointer'

  settingsButton.onclick = function (e) {
    e.stopPropagation()
    const existing = document.getElementById('api-keys-menu')
    if (existing) { existing.parentNode && existing.parentNode.removeChild(existing); return }

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
    menu.style.width = '260px'
    menu.style.padding = '8px'

    const vdbStored = !!getStoredAPIKey('vdb_api_key')
    const openaiStored = !!getStoredAPIKey('openai_api_key')

    // DISABLED: VDB API Key section removed from menu as it's no longer required
    menu.innerHTML = `
      <div style="padding: 6px 8px; border-bottom: 1px solid #eee; font-weight: bold;">API Key Management</div>
      <!--
      <div style="padding: 8px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f5f5f5;">
        <div>
          <div style="font-size:0.95em;">VDB API Key</div>
          <div style="font-size:0.8em; color:#666;">${vdbStored ? 'Stored' : 'Not set'}</div>
        </div>
        <div>
          <button type="button" id="forget-vdb-key-btn" style="padding:6px 8px; margin-left:8px;">${vdbStored ? 'Forget' : 'Set'}</button>
        </div>
      </div>
      -->
      <div style="padding: 8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:0.95em;">OpenAI API Key</div>
          <div style="font-size:0.8em; color:#666;">${openaiStored ? 'Stored' : 'Not set'}</div>
        </div>
        <div>
          <button type="button" id="forget-openai-key-btn" style="padding:6px 8px; margin-left:8px;">${openaiStored ? 'Forget' : 'Set'}</button>
        </div>
      </div>
    `
    titleBar.appendChild(menu)

    // VDB handler: remove menu first, then act (await prompt safely)
    // DISABLED: VDB API key is no longer required
    // const vdbBtn = menu.querySelector('#forget-vdb-key-btn')
    // if (vdbBtn) {
    //   vdbBtn.addEventListener('click', async (ev) => {
    //     ev.stopPropagation()
    //     const btn = ev.currentTarget
    //     btn.disabled = true
    //     // remove menu to avoid UI overlap with prompt
    //     menu.parentNode && menu.parentNode.removeChild(menu)
    //
    //     const currentlyStored = !!getStoredAPIKey('vdb_api_key')
    //     if (currentlyStored) {
    //       if (confirm('Are you sure you want to forget your VDB API key?')) {
    //         deleteStoredAPIKey('vdb_api_key')
    //       }
    //       btn.disabled = false
    //       return
    //     }
    //
    //     try {
    //       const key = await promptForAPIKey('vdb')
    //       if (key) {
    //         storeEncryptedAPIKey('vdb_api_key', key)
    //       }
    //     } catch (err) {
    //       console.error('Error setting VDB key from menu:', err)
    //     } finally {
    //       btn.disabled = false
    //     }
    //   })
    // }

    // OpenAI handler: same pattern
    menu.querySelector('#forget-openai-key-btn').addEventListener('click', async (ev) => {
      ev.stopPropagation()
      const btn = ev.currentTarget
      btn.disabled = true
      menu.parentNode && menu.parentNode.removeChild(menu)

      const currentlyStored = !!getStoredAPIKey('openai_api_key')
      if (currentlyStored) {
        if (confirm('Are you sure you want to forget your OpenAI API key?')) {
          deleteStoredAPIKey('openai_api_key')
        }
        btn.disabled = false
        return
      }

      try {
        const key = await promptForAPIKey('openai')
        if (key) {
          storeEncryptedAPIKey('openai_api_key', key)
        }
      } catch (err) {
        console.error('Error setting OpenAI key from menu:', err)
      } finally {
        btn.disabled = false
      }
    })

    // close menu on outside click
    function closeMenuHandler (ev) {
      if (!menu.contains(ev.target) && ev.target !== settingsButton) {
        menu.parentNode && menu.parentNode.removeChild(menu)
        document.removeEventListener('click', closeMenuHandler)
      }
    }
    setTimeout(() => document.addEventListener('click', closeMenuHandler), 0)
  }

  titleBar.appendChild(settingsButton)
}
// Function to prompt user for API key with a modal
function promptForAPIKey (keyType) {
  return new Promise((resolve) => {
    const baseSuffix = String(keyType).replace(/[^a-z0-9_-]/gi, '').toLowerCase()
    const instanceId = `${baseSuffix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`

    const title = keyType === 'vdb' ? 'VDB API Key Required' : 'OpenAI API Key Required'
    const description = keyType === 'vdb'
      ? 'To retrieve similar texts, please enter your VDB API key.'
      : 'To generate an AI analysis of the similar texts, please enter your OpenAI API key.'

    const modalHTML = `
      <div id="api-key-modal-${instanceId}" class="api-key-modal" role="dialog" aria-modal="true">
        <div class="api-key-modal-content">
          <button type="button" class="api-key-close" data-close aria-label="Close">&times;</button>
          <h3>${title}</h3>
          <p>${description}</p>
          <p>Your key will be securely stored in your browser and never sent to our servers.</p>
          <input type="text" id="api-key-input-${instanceId}" class="api-key-input" placeholder="Enter your ${keyType === 'vdb' ? 'VDB' : 'OpenAI'} API key" 
                 style="width: 100%; padding: 8px; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between; margin-top: 15px;">
            <label style="display: flex; align-items: center;">
              <input type="checkbox" id="remember-api-key-${instanceId}" checked>
              <span style="margin-left: 5px;">Remember for 30 days</span>
            </label>
            <div>
              <button type="button" id="api-key-cancel-${instanceId}" style="margin-right: 10px; padding: 8px 15px;">Cancel</button>
              <button type="button" id="api-key-submit-${instanceId}" style="padding: 8px 15px; background-color: #4CAF50; color: white; border: none;">Submit</button>
            </div>
          </div>
        </div>
      </div>
      <style>
        .api-key-modal { position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
        .api-key-modal-content { background-color: #fefefe; padding: 20px; border-radius: 5px; width: 500px; max-width: 80%; position: relative; }
        .api-key-close { color: #aaa; font-size: 28px; font-weight: bold; cursor: pointer; background: transparent; border: none; position: absolute; right: 12px; top: 8px; }
        .api-key-close:hover { color: black; }
      </style>
    `

    const modalContainer = document.createElement('div')
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer)

    const modal = modalContainer.querySelector(`#api-key-modal-${instanceId}`)
    const closeBtn = modalContainer.querySelector('[data-close]')
    const submitBtn = modalContainer.querySelector(`#api-key-submit-${instanceId}`)
    const cancelBtn = modalContainer.querySelector(`#api-key-cancel-${instanceId}`)
    const input = modalContainer.querySelector(`#api-key-input-${instanceId}`)
    const rememberCheckbox = modalContainer.querySelector(`#remember-api-key-${instanceId}`)

    if (!modal || !submitBtn || !cancelBtn || !closeBtn || !input) {
      console.error('[promptForAPIKey] missing DOM elements, aborting', instanceId)
      try { modalContainer.remove() } catch (e) {}
      resolve(null)
      return
    }

    // guard against double-removal
    let closed = false
    function cleanup () {
      if (closed) return
      closed = true

      try {
        if (modalContainer && modalContainer.parentNode) {
          modalContainer.parentNode.removeChild(modalContainer)
        }
      } catch (e) {
        try { modalContainer.remove() } catch (err) { /* ignore */ }
      }

      // remove any leftover modals to be safe
      try {
        const leftovers = Array.from(document.querySelectorAll('[id^="api-key-modal-"], .api-key-modal'))
        leftovers.forEach(el => {
          try { el.parentNode && el.parentNode.removeChild(el) } catch (e) { try { el.remove() } catch (err) {} }
        })
      } catch (e) {
        console.error('[promptForAPIKey] error removing leftovers', e)
      }

      try { document.activeElement && document.activeElement.blur && document.activeElement.blur() } catch (e) {}
    }

    function resolveAndCleanup (value) {
      try { cleanup() } catch (e) { console.error(e) }
      resolve(value)
    }

    submitBtn.addEventListener('click', (ev) => {
      ev.stopImmediatePropagation()
      ev.preventDefault()
      submitBtn.disabled = true
      cancelBtn.disabled = true
      closeBtn.disabled = true

      const apiKey = input.value.trim()
      if (apiKey) {
        try {
          if (rememberCheckbox && rememberCheckbox.checked) {
            const keyName = keyType === 'vdb' ? 'vdb_api_key' : 'openai_api_key'
            storeEncryptedAPIKey(keyName, apiKey)
          }
        } catch (err) {
          console.error('[promptForAPIKey] storing key failed', err)
        }
        resolveAndCleanup(apiKey)
      } else {
        input.style.border = '2px solid red'
        input.focus()
        submitBtn.disabled = false
        cancelBtn.disabled = false
        closeBtn.disabled = false
      }
    }, { passive: false })

    cancelBtn.addEventListener('click', (ev) => {
      ev.stopImmediatePropagation()
      ev.preventDefault()
      cancelBtn.disabled = true
      submitBtn.disabled = true
      resolveAndCleanup(null)
    }, { passive: false })

    closeBtn.addEventListener('click', (ev) => {
      ev.stopImmediatePropagation()
      ev.preventDefault()
      resolveAndCleanup(null)
    }, { passive: false })

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        e.stopImmediatePropagation()
        resolveAndCleanup(null)
      }
    })

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        submitBtn.click()
      }
    })

    setTimeout(() => {
      try { input.focus() } catch (e) {}
    }, 50)
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

// Functions to show/hide medium spinner
function showSpinnerMedium () {
  const spinner = document.getElementsByClassName('ispinner-medium')[0]
  if (spinner) { spinner.classList.add('show') }
};
function hideSpinnerMedium () {
  const spinner = document.getElementsByClassName('ispinner-medium')[0]
  if (spinner) { spinner.classList.remove('show') }
};

document.addEventListener('DOMContentLoaded', function (event) {
  console.log('sal-embeddings-work.js: DomContentLoaded')

  // initialize (jquery) dialog window for embeddings experiment
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
      // console.log(`Stop event propagation for ${event} ...`)
      event.stopImmediatePropagation()
      // console.log(`Not performing default action for ${event} ...`)
      event.preventDefault()
      return false
    }
  })
})
