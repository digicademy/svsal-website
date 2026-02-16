/* global SPHINX_SERVER, sanitizeText */
/* eslint-env browser */

/*
 * Search Results 3D Visualization Integration
 * This script adds a 3D visualization capability to the search page
 * that shows search results in their embedding space.
 */

// import { SPHINX_SERVER, sanitizeText } from './sal-common.js'
// import { mainSearch } from './sal-search.js'

(function () {
  // Global variables within this scope
  let coordinatesData = null
  let searchResultIds = []
  let searchTermCurrent = ''
  let popupWindow = null
  // let coordinatesFile = '/resources/files/data_passages_with_umap_3d.json'
  // let coordinatesFile = '/resources/files/passages_with_umap_3d_google_gemini-embedding-001_SEMANTIC_SIMILARITY.json'
  let coordinatesFile = '/resources/files/passages_with_umap_3d_cohere_embed-v4.0_clustering.json'
  // let coordinatesFile = '/resources/files/passages_with_umap_3d_openai_text-embedding-3-small.json'

  // Only initialize if the beta parameter is present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnBeta)
  } else {
    initOnBeta()
  }

  function initOnBeta () {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('beta')) {
      initVisualizationFeature()
    }
  }

  function parseJSONLFromText(text) {
    const lines = text.split('\n');
    const results = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            try {
                const data = JSON.parse(line);
                results.push(data);
            } catch (error) {
                console.error(`Error parsing line ${i + 1}:`, error.message);
            }
        }
    }
    return results;
  }

  /**
   * Initialize the visualization feature by adding UI elements and event handlers
   */
  function initVisualizationFeature () {
    // Add visualization button to the search interface
    const searchSummary = document.getElementById('searchSummary')
    if (searchSummary) {
      const vizButton = document.createElement('button')
      vizButton.id = 'showVisualization'
      vizButton.className = 'btn btn-primary btn-sm'
      vizButton.innerHTML = '<i class="fa fa-cube"></i> 3D View (Beta)'
      vizButton.style.marginLeft = '10px'
      vizButton.style.display = 'none' // Initially hidden until search results load
      vizButton.onclick = showVisualizationPopup
      searchSummary.appendChild(vizButton)

      // Prefetch coordinates data
      fetchCoordinatesData()
    }

    // Extend the main search function to capture current search parameters
    const originalMainSearch = window.mainSearch
    window.mainSearch = function (field, st, targetListId, page, limit) {
      // Store current search parameters for later use in visualization
      searchTermCurrent = st

      // Show the visualization button when a search is performed
      const vizButton = document.getElementById('showVisualization')
      if (vizButton && st && st.length > 0) {
        vizButton.style.display = 'inline-block'
      }

      // Call the original search function if it exists
      if (typeof originalMainSearch === 'function') {
        return originalMainSearch(field, st, targetListId, page, limit)
      } else {
        console.warn('originalMainSearch not available; mainSearch was called but no original function to delegate to.')
        return Promise.resolve()
      }
    }
  }

  /**
   * Fetches the coordinates data JSON file
   */
  function fetchCoordinatesData () {
    fetch(coordinatesFile)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not OK')
        }
        return response.text()
      })
      .then(function (data) {
        coordinatesData = parseJSONLFromText(data)
        console.log(`Coordinates data loaded successfully: ${coordinatesData.length} objects`)
      })
      .catch(function (error) {
        console.error('Error loading coordinates data:', error)
      })
  }

  /**
   * Performs a direct search to get all matching document IDs without grouping or paging
   */
  async function performVisualizationSearch () {
    if (!searchTermCurrent) {
      console.error('No search term available')
      return []
    }

    // Show loading state in the button
    const vizButton = document.getElementById('showVisualization')
    const originalButtonText = vizButton.innerHTML
    vizButton.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...'

    // Build the search request without grouping and with a high limit
    const u = new URL(SPHINX_SERVER + '/search')
    const docFilter = '@sphinx_work ^W0*'
    const fields = '@(sphinx_author,sphinx_description_edit,sphinx_description_orig)'
    u.searchParams.set('q', `${docFilter} ${fields} ${searchTermCurrent}`)
    // u.searchParams.set('groupby', 'sphinx_work')
    u.searchParams.set('groupsort', 'sphinx_author asc')
    u.searchParams.set('groupfunc', '4') // groupfunc 4: by attribute
    u.searchParams.set('sort', '4')
    u.searchParams.set('sortby', 'sphinx_year asc')
    u.searchParams.set('ranker', '2') // ranker 2: no ranking
    u.searchParams.set('offset', 0)
    u.searchParams.set('limit', 100000)
    const url = u.href

    // For debugging purposes
    console.log('Visualization search URL:', url)

    try {
      // Send request
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Network response was not OK')
      }

      const text = await response.text()

      // Parse OpenSearch XML document
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) {
        throw new Error('Response could not be parsed as XML')
      }

      const channel = doc.getElementsByTagName('channel')[0]
      const items = channel.getElementsByTagName('item')
      const ids = []

      // Extract IDs from each result
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        // Assuming there's an element with the ID
        const hitId = item.getElementsByTagName('hit_id')[0] ? item.getElementsByTagName('hit_id')[0].textContent : null
        if (hitId) {
          ids.push(hitId)
        } else {
          // As a fallback, try to get ID from fragment path
          const fragPath = item.getElementsByTagName('fragment_path')[0] ? item.getElementsByTagName('fragment_path')[0].textContent : null
          if (fragPath) {
            const match = fragPath.match(/xmlid=([^&]+)/)
            if (match && match[1]) {
              ids.push(match[1])
            }
          }
        }
      }

      console.log('Found ' + ids.length + ' result IDs for visualization')
      return ids
    } catch (error) {
      console.error('Error performing visualization search:', error)
      return []
    } finally {
      // Restore button text
      vizButton.innerHTML = originalButtonText
    }
  }

  /**
   * Shows the visualization popup window
   */
  async function showVisualizationPopup () {
    if (!coordinatesData) {
      alert('Coordinates data is not loaded yet. Please try again in a moment.')
      return
    }

    // Run a direct search to get all matching IDs
    searchResultIds = await performVisualizationSearch()

    if (searchResultIds.length === 0) {
      alert('No matching results found for visualization.')
      return
    }

    // Filter coordinates to only include search results
    const filteredCoordinates = filterCoordinatesBySearchResults()

    // Create and open a popup window
    const width = 1000
    const height = 800
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    popupWindow = window.open('', 'visualization',
      'width=' + width +
      ',height=' + height +
      ',left=' + left +
      ',top=' + top +
      ',resizable=yes,scrollbars=yes')

    // Create HTML content for the popup
    const popupContent =
      '<!DOCTYPE html>\n' +
      '<html lang="en">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <title>3D Visualization of Search Results</title>\n' +
      '  <script src="https://cdn.plot.ly/plotly-3.3.0.min.js" charset="utf-8"></script>\n' +
      '  <style>\n' +
      '    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;}\n' +
      '    #visualization {\n' +
      '      width: 100%;\n' +
      '      height: calc(100% - 20px);\n' +
      '      position: absolute;\n' +
      '      top: 10px;\n' +
      '      left: 0;\n' +
      '    }\n' +
      '    .control-panel {\n' +
      '      position: absolute;\n' +
      '      top: 80px;\n' +
      '      right: 10px;\n' +
      '      background: rgba(255,255,255,0.8);\n' +
      '      padding: 10px;\n' +
      '      border-radius: 5px;\n' +
      '      z-index: 1000;\n' +
      '    }\n' +
      '    .info-panel {\n' +
      '      position: absolute;\n' +
      '      top: 80px;\n' +
      '      left: 10px;\n' +
      '      background: rgba(255,255,255,0.8);\n' +
      '      padding: 10px;\n' +
      '      border-radius: 5px;\n' +
      '      z-index: 1000;\n' +
      '      max-width: 300px;\n' +
      '    }\n' +
      '    .loading {\n' +
      '      position: absolute;\n' +
      '      top: 50%;\n' +
      '      left: 50%;\n' +
      '      transform: translate(-50%, -50%);\n' +
      '      font-size: 24px;\n' +
      '      background: rgba(255,255,255,0.8);\n' +
      '      padding: 20px;\n' +
      '      border-radius: 10px;\n' +
      '      z-index: 2000;\n' +
      '    }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <h2>3D Visualization of Search Results in Semantic Space</h2>\n' +
      '  <div id="visualization"></div>\n' +
      '  <div class="info-panel">\n' +
      '    <h3>Search: "' + sanitizeText(searchTermCurrent) + '"</h3>\n' +
      '    <p><strong>' + searchResultIds.length + '</strong> matching results</p>\n' +
      '    <p><strong>' + filteredCoordinates.contextPoints.length + '</strong> context points</p>\n' +
      '  </div>\n' +
      '  <div class="control-panel">\n' +
      '    <label>\n' +
      '      <input type="checkbox" id="showContextPoints">\n' +
      '      Show context points\n' +
      '    </label>\n' +
      '    <br><br>\n' +
      '    <button id="closeButton">Close</button>\n' +
      '  </div>\n' +
      '  <script>\n' +
      '    // Data will be injected here\n' +
      '    const searchResultData = ' + JSON.stringify(filteredCoordinates.resultPoints.slice(0,10000)).replace(/<\/script/gi, '<\\/script') + ';\n' +
      '    const contextData = ' + JSON.stringify(filteredCoordinates.contextPoints.slice(0,120000)).replace(/<\/script/gi, '<\\/script') + ';\n' +
      '    const parentSearchTerm = ' + JSON.stringify(searchTermCurrent).replace(/<\/script/gi, '<\\/script') + ';\n' +
      '    \n' +
      '    // Create visualization\n' +
      '    function initVisualization() {\n' +
      '      const resultTrace = {\n' +
      '        x: searchResultData.map(function(p) { return p.umap_x; }),\n' +
      '        y: searchResultData.map(function(p) { return p.umap_y; }),\n' +
      '        z: searchResultData.map(function(p) { return p.umap_z; }),\n' +
      '        mode: \'markers\',\n' +
      '        type: \'scatter3d\',\n' +
      '        showticklabels: false,\n' +
      '        marker: {\n' +
      '          size: 4,\n' +
      '          color: \'red\',\n' +
      '          opacity: 0.6\n' +
      '        },\n' +
      '        text: searchResultData.map(function(p) { return p[\'author-name\'] + \' \' + p.title + \' (\' + p.year + \', <i>\' + p.lang + \'</i>)\'; }),\n' +
      '        hoverinfo: \'text\',\n' +
      '        name: \'Search Results\'\n' +
      '      };\n' +
      '      \n' +
      '      const contextTrace = {\n' +
      '        x: contextData.map(function(p) { return p.umap_x; }),\n' +
      '        y: contextData.map(function(p) { return p.umap_y; }),\n' +
      '        z: contextData.map(function(p) { return p.umap_z; }),\n' +
      '        mode: \'markers\',\n' +
      '        type: \'scatter3d\',\n' +
      '        marker: {\n' +
      '          size: 2,\n' +
      '          color: \'grey\',\n' +
      '          opacity: 0.3\n' +
      '        },\n' +
      '        text: contextData.map(function(p) { return p.xmlid + \' (\' + p[\'author-name\'] + \', \' + p.year + \')\'; }),\n' +
      '        hoverinfo: \'text\',\n' +
      '        name: \'Context Points\'\n' +
      '      };\n' +
      '      \n' +
      '      const layout = {\n' +
      '        title: \'\',\n' +
      '        margin: { l: 10, r: 10, b: 10, t: 80 },\n' +
      '        autosize: true,\n' +
      '        scene: {\n' +
      '          xaxis: {\n' +
      '            range: [Math.min(...resultTrace.x, ...contextTrace.x) - 1,\n' +
      '            Math.max(...resultTrace.x, ...contextTrace.x) + 1],\n' +
      '            title: \'\'\n' +
      '          },\n' +
      '          yaxis: {\n' +
      '            range: [Math.min(...resultTrace.y, ...contextTrace.y) - 1,\n' +
      '            Math.max(...resultTrace.y, ...contextTrace.y) + 1],\n' +
      '            title: \'\'\n' +
      '          },\n' +
      '          zaxis: {\n' +
      '            range: [Math.min(...resultTrace.z, ...contextTrace.z) - 1,\n' +
      '            Math.max(...resultTrace.z, ...contextTrace.z) + 1],\n' +
      '            title: \'\'\n' +
      '          }\n' +
      '        }\n' +
      '      };\n' +
      '      \n' +
      '      Plotly.newPlot(\'visualization\', [resultTrace], layout);\n' +
      '      \n' +
      '      // Add control for context points visibility\n' +
      '      document.getElementById(\'showContextPoints\').addEventListener(\'change\', function(e) {\n' +
      '        // Get current camera view before updating\n' +
      '        var currentLayout = document.getElementById(\'visualization\').layout;\n' +
      '        \n' +
      '        if (this.checked) {\n' +
      '          Plotly.addTraces(\'visualization\', contextTrace);\n' +
      '        } else {\n' +
      '          Plotly.deleteTraces(\'visualization\', 1);\n' +
      '        }\n' +
      '        \n' +
      '        // Preserve the camera position and zoom\n' +
      '        Plotly.relayout(\'visualization\', {\n' +
      '          \'scene.camera\': currentLayout.scene.camera\n' +
      '        });\n' +
      '      });\n' +
      '      \n' +
      '      // Close button handler\n' +
      '      document.getElementById(\'closeButton\').addEventListener(\'click\', function() {\n' +
      '        window.close();\n' +
      '      });\n' +
      '      \n' +
      '      // Add click handler to open document when a point is clicked\n' +
      '      var vizElement = document.getElementById(\'visualization\');\n' +
      '      vizElement.on(\'plotly_click\', function(data) {\n' +
      '        if (data.points && data.points.length > 0) {\n' +
      '          var pointIndex = data.points[0].pointIndex;\n' +
      '          var isSearchResult = data.points[0].data.name === \'Search Results\';\n' +
      '          var dataset = isSearchResult ? searchResultData : contextData;\n' +
      '          var xmlId = dataset[pointIndex].xmlid;\n' +
      '          \n' +
      '          // Construct URL to the document\n' +
      '          var baseUrl = \'https://id.salamanca.school/works/\';\n' +
      '          var url = baseUrl + xmlId + \'?q=\' + encodeURIComponent(parentSearchTerm);\n' +
      '          window.open(url, \'_blank\');\n' +
      '        }\n' +
      '      });\n' +
      '    }\n' +
      '    \n' +
      '    // Initialize when the document is ready\n' +
      '    document.addEventListener(\'DOMContentLoaded\', initVisualization);\n' +
      '  </script>\n' +
      '</body>\n' +
      '</html>'

    // Write the content to the popup window
    popupWindow.document.write(popupContent)
    popupWindow.document.close()
  }

  /**
   * Filters coordinates data to return search result points and context points
   */
  function filterCoordinatesBySearchResults () {
    if (!coordinatesData) {
      return { resultPoints: [], contextPoints: [] }
    }

    // Filter points that match search result IDs
    const resultPoints = coordinatesData.filter(function (p) {
      return searchResultIds.includes(p.xmlid)
    })

    // Find bounding box of result points
    const bounds = getBoundingBox(resultPoints)

    // Get context points (points in the bounding box that aren't search results)
    const contextPoints = coordinatesData.filter(function (p) {
      return !searchResultIds.includes(p.xmlid) &&
             isPointInExpandedBoundingBox(p, bounds, 0.05) // 5% expansion of the bounding box
    })

    return {
      resultPoints: resultPoints,
      contextPoints: contextPoints
    }
  }

  /**
   * Calculates the bounding box of a set of points
   */
  function getBoundingBox (points) {
    if (!points || points.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }
    }

    var minX = Infinity
    var maxX = -Infinity
    var minY = Infinity
    var maxY = -Infinity
    var minZ = Infinity
    var maxZ = -Infinity

    for (var i = 0; i < points.length; i++) {
      var p = points[i]
      minX = Math.min(minX, p.umap_x)
      maxX = Math.max(maxX, p.umap_x)
      minY = Math.min(minY, p.umap_y)
      maxY = Math.max(maxY, p.umap_y)
      minZ = Math.min(minZ, p.umap_z)
      maxZ = Math.max(maxZ, p.umap_z)
    }

    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ }
  }

  /**
   * Checks if a point is within an expanded bounding box
   */
  function isPointInExpandedBoundingBox (point, box, expansionFactor) {
    // Calculate expanded dimensions
    var xRange = box.maxX - box.minX
    var yRange = box.maxY - box.minY
    var zRange = box.maxZ - box.minZ

    var expandedMinX = box.minX - xRange * expansionFactor
    var expandedMaxX = box.maxX + xRange * expansionFactor
    var expandedMinY = box.minY - yRange * expansionFactor
    var expandedMaxY = box.maxY + yRange * expansionFactor
    var expandedMinZ = box.minZ - zRange * expansionFactor
    var expandedMaxZ = box.maxZ + zRange * expansionFactor

    // Check if point is within expanded box
    return (
      point.umap_x >= expandedMinX && point.umap_x <= expandedMaxX &&
      point.umap_y >= expandedMinY && point.umap_y <= expandedMaxY &&
      point.umap_z >= expandedMinZ && point.umap_z <= expandedMaxZ
    )
  }
})()
