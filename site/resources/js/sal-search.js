/* eslint-env browser */

/*
 * mainSearch - performs a search for a searchterm
 *              It does not return a value but instead manipulates the dom tree to reflect its results.
 * Parameters:
 * - st (String) - the term to search for. This can be a sphinx search pattern
 * - targetListId (String) - the id of a list element that results can be appended to as <li> items
 * - page (Int) - page of the first item to retrieve
 * - limit (Int) - how many items to retrieve before paging
 * Return value: none
 */
async function mainSearch (field, st, targetListId, page, limit) {
  // Build request
  const endpoint = 'https://search.salamanca.school/lemmatized/search'
  const docFilter = '@sphinx_work ^W0*'
  const alsoAuthor = 'sphinx_author,'
  const fields = '@(' + alsoAuthor + 'sphinx_description_edit,sphinx_description_orig)'
  const searchterm = decodeURIComponent(st)
  const grouping = '&groupby=sphinx_work&groupfunc=4'
  const detailsPage = 0
  const detailsLimit = 5
  const paging = '&offset=' + page + '&limit=' + limit
  const url = endpoint + '?q=' + docFilter + ' ' + fields + ' ' + searchterm + grouping + paging

  showSpinnerTotal()

  // Send request and handle response
  window.fetch(url)
    .then(response => { // Check network status and return response's text content
      if (!response.ok) {
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then(str => { // Parse OpenSearch xml document and return rss/channel
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) {
        throw new Error('Response could not be parsed as XML')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Construct and display list of results
      var totalResults = parseInt(data.getElementsByTagName('opensearch:totalResults')[0].textContent)
      var itemsPerPage = parseInt(data.getElementsByTagName('opensearch:itemsPerPage')[0].textContent)
      var startIndex = Math.floor(parseInt(data.getElementsByTagName('opensearch:startIndex')[0].textContent) / itemsPerPage) + 1
      var terms = [...data.getElementsByTagName('terms')].map(i => i.getElementsByTagName('word')[0].textContent) // convert HTMLCollection to an array with spread operator
      var items = data.getElementsByTagName('item')

      console.log(`Search for "${st}" in "${field}" results in:`)
      console.log('Terms: ' + terms.join(', '))
      console.log('total Results: ' + totalResults)

      document.getElementById('searchInfo').style.visibility = 'visible'
      document.getElementById('searchSummary').style.visibility = 'visible'
      document.getElementById('searchterm').innerText = terms.join(', ')
      document.getElementById('resultDocs').innerText = totalResults
      document.getElementById('currentPaging').innerText = startIndex + '-' + (startIndex + items.length - 1)

      // Results paging
      let pagingHTML = [(startIndex > 1 ? `<a href="search.html?field=${field}&q=${st}&offset=${Math.max(Number(page) - Number(limit), 0)}&limit=${limit}">previous page</a> ` : ' '),
        (totalResults > startIndex + itemsPerPage - 1 ? `<a href="search.html?field=${field}&q=${st}&offset=${Number(page) + Number(limit)}&limit=${limit}">next page</a>` : '')
      ].join(' ')
      document.getElementById('docPagingTop').innerHTML = pagingHTML
      document.getElementById('docPagingBottom').innerHTML = pagingHTML

      // make sure the results list is empty before appending data into it
      document.getElementById(targetListId).innerHTML = ''

      for (let i of [...items]) {
        var _author = i.getElementsByTagName('author')[0].textContent
        var _title = i.getElementsByTagName('title')[0].textContent
        var _workID = i.getElementsByTagName('work')[0].textContent
        var _groupCount = i.getElementsByTagName('sphinx:groupcount')[0].textContent
        // var _targetUrl = updateURLParameter(i.getElementsByTagName('fragment_path')[0].textContent, 'q', st)
        var _targetUrl = i.getElementsByTagName('fragment_path')[0].textContent

        const itemString = `<li><a href="${_targetUrl}">${_author}: ${_title}</a><br>
                                <a class="toggle-details" href="#details_${_workID}" data-wid="${_workID}" "data-target="#details_${_workID}" data-toggle="collapse" aria-expanded="true">${_groupCount}&nbsp;Fundstellen&nbsp;<span class="fa fa-chevron-down" aria-hidden="true"></span></a>
                                <div id="details_${_workID}" class="resultsDetails collapse" aria-expanded="true" style="">
                                    <div class="detailsDiv">
                                        <h3 id="detailsPaging_${_workID}" class="text-center"></h3>
                                        <table class="detailsTable table table-hover borderless">
                                            <tbody id="detailsTableBody_${_workID}"></tbody>
                                        </table>
                                    </div>
                                </div>
                            </li>`
        // add content to the HTML
        document.getElementById(targetListId).insertAdjacentHTML('beforeend', itemString)
        // call (an async) function to populate excerps for this result
        detailsSearch(_workID, detailsPage, detailsLimit, searchterm)
      }
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error)
    })
    .finally(() => { hideSpinnerTotal() })
};

/*
 * detailsSearch - searches a searchterm in a single work and return multiple passages
 *                 It does not return a value but instead manipulates the dom tree to reflect its results.
 * Parameters:
 * - workId (String) - the work Id
 * - page (Int) - page of the first detail item to retrieve
 * - limit (Int) - how many detail items to retrieve before paging
 * - searchterm (String) - the term to search for. This can be a sphinx search pattern
 * Return value: none
 */
async function detailsSearch (workId, page, limit, searchterm) {
  // Build request
  const endpoint = 'https://search.salamanca.school/lemmatized/search?q='
  const alsoAuthor = 'sphinx_author,'
  const fields = '@(' + alsoAuthor + 'sphinx_description_edit,sphinx_description_orig)'
  const docFilter = '@sphinx_work ^' + workId
  const sorting = '&sort=2&sortby=sphinx_fragment_number&ranker=2'
  const paging = '&offset=' + page + '&limit=' + limit
  const url = endpoint + docFilter + ' ' + fields + ' ' + searchterm + sorting + paging

  // Send request and handle response
  window.fetch(url)
    .then(response => { // Check network status and return response's text content
      if (!response.ok) {
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then(str => { // Parse OpenSearch xml document and return rss/channel
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) {
        throw new Error('Response could not be parsed as XML')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Display details
      let totalResults = parseInt(data.getElementsByTagName('opensearch:totalResults')[0].textContent)
      let limit = parseInt(data.getElementsByTagName('opensearch:itemsPerPage')[0].textContent)
      let page = Math.floor(parseInt(data.getElementsByTagName('opensearch:startIndex')[0].textContent) / limit) + 1
      let items = data.getElementsByTagName('item')

      // Build paging section
      let pagingRange = `${page} - ${page + items.length - 1}`
      let pagingLinks = [ page > 1 ? `<a href="" class="paging-details backward" data-wid="${workId}" data-current-page="${page - 1}" data-limit="${limit}"><i class="fa fa-chevron-left"></i>&nbsp;&nbsp;previous page</a> ` : undefined,
        totalResults > page + limit - 1 ? `<a href="" class="paging-details forward" data-wid="${workId}" data-current-page="${page - 1}" data-limit="${limit}">next page&nbsp;&nbsp;<i class="fa fa-chevron-right"></i></a>` : undefined
      ].join(' | ')
      let pagingHTML = `<h3 id="detailsPaging_${workId}" class="text-center">${pagingRange}<br>${pagingLinks}</h3>`
      // Add paging section to HTML
      if (totalResults > limit) { document.getElementById('detailsPaging_' + workId).outerHTML = pagingHTML }

      // Make sure the details table is empty before appending data into it
      document.getElementById('detailsTableBody_' + workId).innerHTML = ''

      for (let [index, value] of Array.from(items).entries()) {
        var _label = value.getElementsByTagName('hit_label')[0].innerHTML
        // var _fragPath = updateURLParameter(value.getElementsByTagName('fragment_path')[0].innerHTML, 'q', searchterm)
        var _fragPath = value.getElementsByTagName('fragment_path')[0].innerHTML
        var _crumbtrail = decodeURIComponent(value.getElementsByTagName('hit_crumbtrail')[0].innerHTML.replace(/%26amp%3B/g, '%26'))
        var _docOrig = value.getElementsByTagName('description_orig')[0].innerHTML
        var _docEdit = value.getElementsByTagName('description_edit')[0].innerHTML

        var ct = document.createElement('div')
        ct.innerHTML = _crumbtrail
        var crumbFrag = document.createDocumentFragment()
        do {
          if (ct.firstChild.nodeType === 1 && ct.firstChild.tagName === 'A') {
            // ct.firstChild.setAttribute('href', updateURLParameter(ct.firstChild.getAttribute('href'), 'q', searchterm))  // add q parameter to all links in the crumbtrail
          }
          crumbFrag.appendChild(ct.firstChild) // This in fact removes the element from our nodelist
        } while (ct.childNodes.length > 0)

        const itemString = `<tr>
                              <td class="details_td" data-wid="${workId}" data-index="${index}">
                              <div id="spinner_details__${workId}_${index}" class="spinner-details ispinner">
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
                              </div>
                              <span class="lead" style="padding-bottom: 7px; font-family: 'Junicode', 'Cardo', 'Andron', 'Cabin', sans-serif;"><a href="${_fragPath}">${_label}</a></span>
                                  <div id="crumbtrail_${workId}_${index}" class="crumbtrail"></div>
                                  <div id="excerpt_${workId}_${index}" class="result__snippet no-excerpts" data-orig="${_docOrig}">${_docEdit}</div>
                              </td>
                            </tr>`

        // Add content to the HTML
        document.getElementById('detailsTableBody_' + workId).insertAdjacentHTML('beforeend', itemString)
        document.getElementById('crumbtrail_' + workId + '_' + index).appendChild(crumbFrag)

        // Should we rather defer calling this (async) function to populate excerpts?
        excerptsSearch(workId, index, searchterm, _docOrig, _docEdit)
      }
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error)
    })
};

/*
 * excerptsSearch - searches a searchterm in two strings
 *                  It does not return a value but instead manipulates the dom tree to reflect its results.
 * Parameters:
 * - workId (string) - the work Id, necessary to find the details div to which to append the excerpts...
 * - index (string) - the index of the current excerpt per work, also necessary to find the details div to which to append the excerpts...
 * - searchterm (String) - the term to search for. This can be a sphinx search pattern
 * - string1 (String) - the first string that the searchterm is searched in
 * - string2 (String) - the second string that the searchterm is searched in if not present in string1
 * Return value: none
 */
async function excerptsSearch (workId, index, searchterm, string1, string2) {
  // Build request
  const endpoint = 'https://search.salamanca.school/lemmatized/excerpts'
  const myFormData = new FormData()
  myFormData.append('opts[\'limit\']', '750')
  myFormData.append('opts[\'html_strip_mode\']', 'strip')
  myFormData.append('opts[\'query_mode\']', 'true')
  myFormData.append('opts[\'around\']', '10')
  myFormData.append('words', decodeURIComponent(searchterm))
  myFormData.append('docs[0]', string1)
  myFormData.append('docs[1]', string2)
  const myOptions = {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    body: myFormData // body data type must match "Content-Type" header
  }

  showSpinnerDetails(`spinner_details__${workId}_${index}`)

  // Send request and handle response
  window.fetch(endpoint, myOptions)
    .then(response => { // Check network status and return response's text content
      if (!response.ok) {
        throw new Error('Network response was not OK')
      }
      return response.text()
    })
    .then(str => { // Parse OpenSearch xml document and return rss/channel
      const parser = new DOMParser()
      const doc = parser.parseFromString(str, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) {
        throw new Error('Response could not be parsed as XML')
      }
      return doc.getElementsByTagName('channel')[0]
    })
    .then(data => { // Display excerpts
      var doc1 = data.getElementsByTagName('item')[0].getElementsByTagName('description')[0].outerHTML
      var doc2 = data.getElementsByTagName('item')[1].getElementsByTagName('description')[0].outerHTML

      // display doc1 unless this has no highlighted span whereas doc2 does have one.
      var html = ''
      if (doc1.includes('<span class="hi"')) {
        html = doc1
      } else if (doc2.includes('<span class="hi"')) {
        html = doc2
      } else {
        html = doc1
      }

      // replace excerpts and remove data-orig attribute (so the event listener can know whether we've already retrieved excerpts)
      document.getElementById(`excerpt_${workId}_${index}`).innerHTML = ''
      document.getElementById(`excerpt_${workId}_${index}`).insertAdjacentHTML('beforeend', html)
      document.getElementById(`excerpt_${workId}_${index}`).removeAttribute('data-orig')
      document.getElementById(`excerpt_${workId}_${index}`).classList.remove('no-excerpts')
      document.getElementById(`excerpt_${workId}_${index}`).classList.add('excerpts')
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error)
    })
    .finally(() => { hideSpinnerDetails(`spinner_details__${workId}_${index}`) })
};

function updateURLParameter (url, param, paramVal) { // from <https://stackoverflow.com/questions/1090948/change-url-parameters-and-specify-defaults-using-javascript#10997390>
  var TheAnchor = null
  var newAdditionalURL = ''
  var tempArray = url.split('?')
  var baseURL = tempArray[0]
  var additionalURL = tempArray[1]
  var tmpAnchor = ''
  var TheParams = ''
  var temp = ''
  if (additionalURL) {
    tmpAnchor = additionalURL.split('#')
    TheParams = tmpAnchor[0]
    TheAnchor = tmpAnchor[1]
    if (TheAnchor) {
      additionalURL = TheParams
    }
    tempArray = additionalURL.split('&')
    for (var i = 0; i < tempArray.length; i++) {
      if (tempArray[i].split('=')[0] !== param) {
        newAdditionalURL += temp + tempArray[i]
        temp = '&'
      }
    }
  } else {
    tmpAnchor = baseURL.split('#')
    TheParams = tmpAnchor[0]
    TheAnchor = tmpAnchor[1]
    if (TheParams) {
      baseURL = TheParams
    }
  }
  if (TheAnchor) {
    paramVal += '#' + TheAnchor
  }
  var rowsTxt = temp + '' + param + '=' + paramVal
  return baseURL + '?' + newAdditionalURL + rowsTxt
};

function updateAllURLParameters (nodelist, param, paramVal) {
  for (let i = 0; i < nodelist.length; i++) {
    if (nodelist[i].nodeType == 1 && nodelist[i].tagName == 'A') {
      nodelist[i].setAttribute('href', updateURLParameter(nodelist[i].getAttribute('href'), param, paramVal))
    }
    return nodelist[i]
  }
};

function showSpinnerTotal () {
  document.getElementById('spinner-total').classList.add('show');
};
function hideSpinnerTotal () {
  document.getElementById('spinner-total').classList.remove('show');
};
function showSpinnerDetails (id) {
  document.getElementById(id).classList.add('show');
};
function hideSpinnerDetails (id) {
  document.getElementById(id).classList.remove('show');
};

$("#doSearch").click(function (event) {                                             // Do the Search!
  let field = document.getElementById('field').value
  let searchterm = document.getElementById('q').value
  let params = (new URL(window.location.href)).searchParams
  let page = params.has('offset') ? params.get('offset') : 0
  let limit = params.has('limit') ? params.get('limit') : 10
  window.history.replaceState('', '', updateURLParameter(window.location.href, "q", searchterm))
  document.title = searchterm + ' - The School of Salamanca'
  mainSearch(field, searchterm, "resultsList", page, limit)
  event.stopImmediatePropagation()
  event.preventDefault()
});

document.querySelector("#resultsList").addEventListener('click', async function(e) {      // Call details handling
  // Since details are not available on document load, we have to listen to events on the ancestor
  // The clicked element then is in `e.target`.
  /* If querying excerpts right on loading the main query is too much overhead, we can re-enable this and defer excerpting to here...
      if (e.target.classList.contains('toggle-details')) {
          let workId = e.target.getAttribute('data-wid')
          let searchterm = document.getElementById('q').value
          for (let [pos, item] of Array.from(e.target.nextElementSibling.getElementsByClassName('details_td')).entries()) {
              if (item.getElementsByClassName('result__snippet')[0].hasAttribute('data-orig')) {
                  let index   = item.getAttribute('data-index')
                  let docOrig = item.getElementsByClassName('result__snippet')[0].getAttribute('data-orig')
                  let docEdit = item.getElementsByClassName('result__snippet')[0].innerHTML
                  excerptsSearch(workId, index, searchterm, docOrig, docEdit)
              }
          }
      }
  */
  if (e.target.classList.contains('paging-details')) {
      let workId = e.target.getAttribute('data-wid')
      let oldPage = parseInt(e.target.getAttribute('data-current-page'))
      let limit = parseInt(e.target.getAttribute('data-limit'))
      let newPage = e.target.classList.contains('forward') ? oldPage + limit : Math.max(oldPage - limit, 0)
      let searchterm = document.getElementById('q').value
      await detailsSearch (workId, newPage, 5, searchterm)
      for (let [pos, item] of Array.from(e.target.parentElement.nextElementSibling.getElementsByClassName('details_td')).entries()) {
          let index   = item.getAttribute('data-index')
          let docOrig = item.getElementsByClassName('result__snippet')[0].getAttribute('data-orig')
          let docEdit = item.getElementsByClassName('result__snippet')[0].innerHTML
          excerptsSearch(workId, index, searchterm, docOrig, docEdit)
      }

      event.stopImmediatePropagation()
      event.preventDefault()
  }
});

$(document).ready(function(){                                                       // Prepare page: fill fields, position backtotop, prevent defaultactions
  let params = (new URL(window.location.href)).searchParams
  let page = params.has('offset') ? params.get('offset') : 0
  let limit = params.has('limit') ? params.get('limit') : 0
  let field = params.has('field') ? params.get('field') : 'corpus'
  let searchterm = params.has('q') ? params.get('q') : ''

  document.getElementById('field').value = field                                          // Prepopulate fields based on url paramaters
  document.getElementById('q').value = searchterm
  if (searchterm.length > 0) {
      document.getElementById('q').value = searchterm
      mainSearch(field, searchterm, "resultsList", page, limit)                           // immediately call search function if "q" parameter given
  }

  $(".toggle-details").on('click', function (e) { e.preventDefault(); })                  // prevent default action on .toggle-details

  $('#backTop').backTop({                                                                 // Position Back-to-top arrow
      'position' : 100,
      'speed' : 200,
      'color' : 'white',
  });
});

$(document).ready(function(){
  $('#helpBox2').dialog({
              autoOpen:   false,
              //position:   {my: "left top", at: "right-10 bottom+10", of: "button.btn-default"},
              
              height:     $(window).height()* 0.6,
              maxHeight:  $(window).height()* 0.95,
              width:      $(window).width() * 0.45,
              create:     function(event, ui) {
                              $(event.target).parent().css('position', 'fixed');
                          },
              resizeStop: function(event, ui) {
                              var position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
                                               (Math.floor(ui.position.top) - $(window).scrollTop())];
                              $(event.target).parent().css('position', 'fixed');
                              $(dlg).dialog('option','position',position);
                          },
              beforeClose: function( event, ui ) {
                              $("#showHelp").show();
                           }
  });
});

$(document).on('click', '#toggleHelp',  function(event) {
  if ($('#helpBox2').dialog('isOpen')) { $('#helpBox2').dialog('close'); } else { $('#helpBox2').dialog('open'); }
  event.preventDefault();
});

$(document).on('click', 'a[href^="#option"]',  function(event) {
  $('option:selected', 'select[name="field"]').removeAttr('selected');
  var optionNumber = $(this).attr('href').substring(7);
  $('option[accesskey="' + optionNumber +'"]').prop('selected',true);
  event.preventDefault();
});

$(document).on('click', 'a[href^="#div_"]',  function(event) {
  var target = $(this).attr('href');
  $('#helpBox2').scrollTop($(target).position().top);
  event.preventDefault();
});
