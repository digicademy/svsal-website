
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

function toggleOrigEditMode (invokingElement) {
  [].forEach.call(document.getElementsByClassName('edited'),   function (el) { el.classList.toggle('unsichtbar') });
  [].forEach.call(document.getElementsByClassName('original'), function (el) { el.classList.toggle('unsichtbar') })
}

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
}

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
}

function applyMode () {
  let queryParams = new URLSearchParams(window.location.search)
  let mode = queryParams.get('mode')
  if (mode === 'orig') {
    applyOrigMode()
  } else {
    applyEditMode()
  }
}

// Scroll an anchor into view if we have one
function myScrollIntoView (targetId) {
  offset = $('#' + targetId).offset().top
  // console.log(`$('#${targetId}').offset().top = ${offset}.`)
  goHere = offset - parseInt($('div.navbar-white').css('height')) - 15
  // console.log(`Go to ${ goHere }.`)
  $('html, body').animate({scrollTop: goHere}, 800, 'swing', function () {
    $('#' + targetId).effect( 'highlight', {color:'LightSkyBlue'}, 1200 )
  })
}

$('a[href*="#"]').click(function (event) {
  z = $(this).attr('href').slice($(this).attr('href').indexOf('#') + 1)
  if ($(z).length != 0) {
    console.log(`Going locally to ${ z } ...`)
    myScrollIntoView(z)
    event.preventDefault()
  }
})

// Show GUI-Nav when scolling upwards
$(document).ready(function () {
  $('.navbar-white').css('padding-top', parseInt($('#main-menu').css('height'))-2);
  $('.navbar-white').autoHidingNavbar().autoHidingNavbar('setShowOnBottom', false).autoHidingNavbar('setAnimationDuration', 400)
})

// Load Paginator content when clicking on dropdown-menu
function loadPaginatorContent () {
  var $self = `<span data-template="app:loadWRKpagination"></span>`;
  $('#loadMeLast').innerHtml = ($self + '#later li'); 
}

// TOC tree
var tree = $('#tableOfConts')
tree.bind('loaded.jstree', function (event, data) {
  tree.jstree(true).open_node($('#tableOfConts').find('li').first());;
})
$('#tableOfConts').jstree({
  'core': { }
}).bind('select_node.jstree', function (e, data) {
  var href = data.node.a_attr.href;
  document.location.href = href;
})

// toggle TOC tree
$(function () {
  $('#toggleButton').click(function() {
      if ($('button[id="toggleButton"]').hasClass('expanded')) {
          $('#tableOfConts').jstree('close_all');
          $('button[id="toggleButton"]').removeClass('expanded').addClass('collapsed');
          $('span[class="glyphicon glyphicon-resize-small"]').removeClass('glyphicon glyphicon-resize-small').addClass('glyphicon glyphicon-fullscreen');
      }
      else if ($('button[id="toggleButton"]').hasClass('collapsed')) {
          $('#tableOfConts').jstree('open_all');
          $('button[id="toggleButton"]').removeClass('collapsed').addClass('expanded');
          $('span[class="glyphicon glyphicon-fullscreen"]').removeClass('glyphicon glyphicon-fullscreen').addClass('glyphicon glyphicon-resize-small');
      }
  });
})

// Close Modal on Clicking a TOC link
$('.hideMe').click(function () {
  // 'this' would reference the anchor that was clicked
  $('#myModal').modal('hide');
})

// Do not close export menu on click
$(document).on('click', '.dropdown-menu.export-options', function (e) {
  e.stopPropagation();
})

// Remember current position on Clicking a language link
function replaceQueryParam (param, newval, search) {
  var regex = new RegExp('([?;&])' + param + '[^&;]*[;&]?');
  var query = search.replace(regex, '$1').replace(/&$/, '');
  return (query.length > 2 ? query + '&' : '?') + (newval ? param + '=' + newval : '');
}
$('.lang-switch').click(function (event) {
  var str = window.location.search
  str = replaceQueryParam('lang', $(this).text(), str)
  window.location = window.location.pathname + str + window.location.hash
  // alert(window.location)
  event.preventDefault()
})

// Paragraph popup with link, refresh and print icons
$('[data-rel="popover"]').popover({
        trigger:    'click',
        animation: 'true',
        placement:  'bottom',
        container: 'body',
        template: '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
        html:       true,
        title:      function() {return $('#popover-head').html();},
        content: function(){
            toolboxHighlight(this,'on');
            return $(this).siblings('.sal-toolbox-body').html()
        }
        // close popup by clicking outside
}).click(function (event) { event.preventDefault() }) // don't jump around to the anchor associated with the span
$('body').on('click', function (event) {
    $('[data-rel="popover"]').each(function() {
        event.preventDefault;
        if (!$(this).is(event.target) 
            && $(this).has(event.target).length === 0 
            && $('.popover').has(event.target).length === 0) {
            toolboxHighlight(this,'off');
            $(this).popover('hide');
        }
    });
})
function toolboxHighlight (elem, mode) {
    var target = elem.parentElement.nextElementSibling;
    if (mode === 'on') {
        if (elem.parentElement.className === 'sal-toolbox-marginal') {
            elem.style.visibility = 'visible';
        }
        elem.style.setProperty('color', '#102873', 'important');
        target.style.backgroundColor = '#F0F0F0';
    } else if (mode === 'off') {
        elem.style.removeProperty('color');
        target.style.backgroundColor = '';
        if (elem.parentElement.className === 'sal-toolbox-marginal') {
            elem.style.removeProperty('visibility');
        }
    }
}

// Toolboxes: highlighting and copy functions
function copyLink (elem) {
    var target = elem.parentElement.getElementsByClassName('cite-link')[0];
    var input = document.createElement('textarea');
    input.setAttribute('style', 'width:0;height:0;opacity:0;'); // hidden
    input.textContent = target.textContent;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    copyNotify(elem);
    document.body.removeChild(input);
}
function copyCitRef (elem) {
    var target = elem.parentElement.getElementsByClassName('sal-cite-rec')[0];
    var input = document.createElement('textarea');
    input.setAttribute('style', 'display:block; width:0; height:0; opacity: 0;');
    // construct string to be copied: get pre-rendered work/passage citation strings and insert the current date
    var v1 = target.getElementsByClassName('cite-rec-body')[0].textContent;
    var v2 = getI18nAccessString();
    input.textContent = v1 + ' ' + v2;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    copyNotify(elem);
    document.body.removeChild(input);
}

// Image Viewer
function getI18nAccessString () {
    var accessed;
    var date;
    var lang = getLang();
    if (!['es', 'de', 'en'].includes(lang)) lang = 'en';
    var current = new Date();
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (lang === 'de'){
        accessed = 'Aufgerufen am';
        date = current.toLocaleDateString('de-DE', options);
    } else if (lang === 'es'){
        accessed = 'Consultado por última vez el';
        date = current.toLocaleDateString('es-ES', options);
    } else {
        accessed = 'Accessed';
        date = current.toLocaleDateString('en-GB', options);
    }
    return '(' + accessed + ' ' + date + ')';
}
function copyNotify (elem) {
    var del = elem.parentElement.getElementsByClassName('.copy-alert')[0];
    if (typeof variable !== 'undefined' && variable !== null) {
        elem.parentElement.removeChild(del);
    }
    var language = getLang();
    console.log('$lang=' + language);
    var msg;
    if (language === 'de') {
        msg = 'In die Zwischenablage kopiert'
    } else if (language === 'es') {
        msg = 'Copiado al portapapeles'
    } else {
        msg = 'Copied to clipboard'
    }
    var popup = document.createElement('span');
    popup.setAttribute('class', 'copy-alert');
    popup.textContent = msg;
    elem.parentElement.appendChild(popup);
    setTimeout(function() {
        $('.copy-alert').fadeOut(1000);
    }, 1500);
}

function getUrlParams (prop) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );

    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );

    return ( prop && prop in params ) ? params[ prop ] : params;
}

function getLang () {
    if (getUrlParams('lang').length > 0 
            && ['de','en','es'].indexOf(getUrlParams('lang').substring(0,2)) >= 0) {
        return getUrlParams('lang').substring(0,2);
    }
    else if (window.location.href.indexOf('/de/') != -1) return 'de';
    else if (window.location.href.indexOf('/es/') != -1) return 'es';
    else return 'en';
}

let domain = document.getElementById('Viewer').dataset.domain
let wid = document.getElementById('Viewer').dataset.wid

let tifyOptions = {
    container: '#Viewer',
    // filters: { brightness: 0.5, contrast: 0.5, saturation: 2.3 },
    language: getLang(),
    // manifestUrl: 'https://id.{{$domain}}/texts/{{$wid}}?format=iiif',       // https://example.com/iiif/manifest.json',
    // manifestUrl: 'https://www.salamanca.school/de/iiif-out.xql?wid={{$wid}}',  // https://example.com/iiif/manifest.json',
    manifestUrl: 'https://www.' + domain + '/data/' + wid + '/' + wid + '.json',       // https://example.com/iiif/manifest.json',
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
// myViewer.mount('#Viewer');

function setTifyPage (canvasId, title) {
  var targetPage = myViewer.app.canvases.find(x => x['@id'] == canvasId).page
  myViewer.ready.then(() => {
    myViewer.setPage([targetPage])
  })
  // Update some values of the dialog popup window
  $('#parent small').text(title)         // update Viewer Heading
  $('#parent div').attr('title', title)  // update Viewer Title
  // $('#Viewer')[0].contentDocument.getElementById('downloadImages').href = 'https://c104-131.cloud.gwdg.de/sal-facs/{{$id}}/{{$id}}.zip';  // update Download button
    // // $('#Viewer')[0].contentDocument.getElementById('downloadImages').href = 'http://facs.salamanca.school/{{$id}}/{{$id}}.zip';  // update Download button
    // $('#Viewer')[0].contentDocument.getElementById('downloadImages').setAttribute('download', '{{$id}}.zip');  // update Download button
};

// Bind click event for opening viewer popup
$(document).on('click', '.pageNo', function (event) {
  event.preventDefault() // do not actually go to this url - or go there if javascript is disabled
  $(this).blur()

  // Configure viewer to go to the correct canvas
  var targetCanvasID = $(this).attr('data-canvas')
  setTifyPage(targetCanvasID, targetCanvasID)

  // Open the dialog window with jquery-ui Dialog method
  $('#parent').dialog('open')

  // Reflect viewer status in url
  let params = new URLSearchParams(window.location.search)
  params.set('viewer', targetCanvasID)
  window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash)
})

// Update url when paging in viewer (a bit clumsy but it's working)
function viewObsCallback (mutations) {
    mutations.forEach(function(mutation) {
        number = parseInt(mutation.target.data.split(':')[0].trim(), 10);
        canvas = myViewer.app.canvases[number-1];
        id = canvas['@id'];
        console.log(`Open viewer on canvas ${ id } / image ${ number }.`);
        params = new URLSearchParams(window.location.search) ;
        params.set('viewer', id);
        window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash);
    });
}
var viewerObserver = new MutationObserver (viewObsCallback)
var observerOptions = {
    childList: false,
    attributes: false,
    characterData: true,
    subtree: true,
}
viewerObserver.observe(document.getElementById('Viewer'), observerOptions)

// Bind click event for syncing/scrolling text area
/* $('#Viewer').contents().find('#sync').on('click', function(){
    var m     = document.getElementById('Viewer').contentWindow.MyObjects.myMirador;
    $canvasId = m.viewer.workspace.windows[0].canvasID
    console.log(`Viewer's sync button has been clicked on canvasId ${ $canvasId }.`);
    var target = $(`a[data-canvas='${ $canvasId }']`);
    if (target.length) {
        console.log('Going to #' + target.attr('id'));
        myScrollIntoView('#'+ target.attr('id'));
        event.preventDefault();
    } else {
        console.log('Target element for canvasId ' + $canvasId + ' is not in DOM.');
        $.getJSON( 'iiif-in.xql?canvasId=' + $canvasId )
            .done(function( json ) {
                realTarget = json[$canvasId];
                console.log('Going to ' + realTarget + '?viewer=' + $canvasId + '.');
                window.location.href = realTarget + '?viewer=' + $canvasId;
            })
            .fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ', ' + error;
                console.log( 'JSON Request for page id Failed: ' + err );
            });
    }
});
*/

// Mobil-View: Hide opened collapsed menu after clicking elsewhere on page
$(document).on('click', function () {
  $('.collapse .navbar-collapse').collapse('hide');
})

// Mobil-View: scroll to last collapsed navbar item on mobile when there are many items
$('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })

// One document.ready function collecting init for all of the above...
// document.DOMContentLoaded triggers when DOM has been completely parsed (no images, styles and async scripts), window.load event triggers when *everything* has been loaded. -->
document.addEventListener('DOMContentLoaded', function (event) {
    // Init backTop
    $('#backTop').backTop({position: 100, speed: 200, color: 'white' });
    // apply constituted/diplomatic mode
    if (window.location.search.match(/mode=((orig)|(edit))/i)) {
        applyMode();
    }
    // Show GUI-Nav when scolling to top
    $('.navbar-white').autoHidingNavbar().autoHidingNavbar('setShowOnBottom', false).autoHidingNavbar('setAnimationDuration', 400);
    // Load Paginator
    $('#dropdownMenu1').click(loadPaginatorContent);

    // Initialize Image viewer dialogue window
    $('#parent').dialog({
        position:   {my: 'left top', at: 'left+5 bottom+40', of: 'div.navbar'},
        autoOpen:   false,
        width:      Math.min($(window).width()* 0.4, 600),   // startsize of the dialog
        height:     Math.min($(window).height()* 0.8, 700),
        create:     function(event, ui) {
                        $(event.target).parent().css('position', 'fixed');
                    },
        resizeStop: function(event, ui) {
                        var position = [(Math.floor(ui.position.left) - $(window).scrollLeft()),
                                        (Math.floor(ui.position.top)  - $(window).scrollTop())];
                        $(event.target).parent().css('position', 'fixed');
                        $('#parent').dialog('option','position', position);
                    },
        close:      function(event, ui) {
                        params = new URLSearchParams(window.location.search) ;
                        params.delete('viewer');
                        window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash);
                        params.set('viewer', null);
                        // document.getElementById('Mirador')
                        event.stopImmediatePropagation();
                        event.preventDefault();
                        return false;
                    }
    });
})
window.addEventListener('load', (event) => {
    // move to anchor if we have one in our url
    let searchId = window.location.hash.slice(1);
    if (searchId && document.getElementById(searchId) != null) {
        // console.log(`Scroll to element '${searchId}'.`)
        myScrollIntoView(searchId);
    }

    // If we have a 'viewer' URL parameter, do open it
    if (window.location.search.indexOf('viewer=') != -1) {
        // Configure viewer to go to the correct canvas
        var params = new URLSearchParams(window.location.search) ;
        var targetCanvasID = params.get('viewer');
        setTifyPage(targetCanvasID, targetCanvasID);

        // Open the dialog window with jquery-ui Dialog method
        $('#parent').dialog('open');

        // Reflect viewer status in url
        params = new URLSearchParams(window.location.search) ;
        params.set('viewer', targetCanvasID);
        window.history.replaceState(null, '', window.location.pathname + '?' + params + window.location.hash);
    }
})

// InfiniteAjaxScroll stuff
let validParams = ['mode', 'q', 'format', 'viewer']

let ias = new InfiniteAjaxScroll('#iasContainer', {
    item:       '.iasItem',
    next:       '.next',
    prev:       '.prev',
    pagination: '.iasPagination',
    spinner:    '.iasSpinner',
    logger:     false               // don't clobber the console
    // negativeMargin: 400          // when to start loading new items (before reaching the very bottom),
})
ias.on('page', (event) => {             // update the url to reflect the new page we've just scrolled to
    let target = new URL(event.url, location.protocol + '//' + location.hostname + '/'); // event.url is a string, but we want to use URL methods (second parameter is basename)
    let loadParams = new URLSearchParams(location.search);
    /* if ($('a.btn.unsichtbar.original').length) { } else {
        loadParams.set('mode', 'orig');
    } */
    loadParams.forEach(function(value, key) { // sanitize query parameters
        if (validParams.indexOf(key) === -1) { loadParams.delete(key) };
    });
    let newParams = loadParams ? '?' + loadParams : '';
    newUrl = target.pathname.substr(target.pathname.lastIndexOf('/') + 1) + newParams + target.hash;
    history.replaceState(history.state, '', newUrl);
})
ias.on('nexted', (event) => {           // apply original/edited mode to newly added elements
    applyMode();
})
ias.on('preved', (event) => {           // apply original/edited mode to newly added elements
    applyMode();
})
ias.on('appended', function (items) {   // add functionality to newly loaded elements (those functions are mostly copied from below)
    // 1. Refresh Popover Boxes to have a function on click ...
    $('[data-rel="popover"]').popover({
        trigger:    'click',
        animation:  'true',
        placement:  'bottom',
        container:  'body',
        template:   '<div class="popover sal-toolbox-body"><div class="popover-content"></div></div>',
        html:       true,
        title:      function() { return $('#popover-head').html(); },
        content:    function(){
            toolboxHighlight(this,'on');
            return $(this).siblings('.sal-toolbox-body').html()
        }
        // close popup by clicking outside
    }).click(function(event) {event.preventDefault();});
    // 2. Refresh ImageViewer Stuff...
    $('.pageNo').click(function(event) {
        event.preventDefault();                                     // do not actually go to this url
        $('#parent').dialog('open');                                // show Viewer with jquery-ui Dialog method
        $('#parent small').text($(this).attr('href'));              // update Viewer Heading
        $('#parent div').attr('title', $(this).attr('href'));       // update Viewer Title
    });
    // 3. Add tooltip
    $('.messengers').tooltipster({'multiple': true});
    // 4. Add highlighting as needed
    $('#hiliteBox a.highlighted').each(function() {
        $( this ).click();                                          // this disables highlighting
        $( this ).click();                                          // this re-enables it
    });
})
