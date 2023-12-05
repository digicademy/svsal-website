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

function copyCitRef (elem) {
  var target = elem.parentElement.getElementsByClassName('sal-cite-rec')[0]
  var input = document.createElement('textarea')
  input.setAttribute('style', 'display:block; width:0; height:0; opacity: 0;')
  // construct string to be copied: get pre-rendered work/passage citation strings and insert the current date
  var v1 = target.getElementsByClassName('cite-rec-body')[0].textContent
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
  if (typeof variable !== 'undefined' && variable !== null) {
    elem.parentElement.removeChild(del)
  }
  var language = getLang()
  // console.log('$lang=' + language)
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

// TOC tree
var tree = $('#tableOfConts')
tree.bind('loaded.jstree', function (event, data) {
  tree.jstree(true).open_node($('#tableOfConts').find('li').first())
})
$('#tableOfConts').jstree({
  'core': { }
}).bind('select_node.jstree', function (e, data) {
  var href = data.node.a_attr.href
  document.location.href = href
})

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

// Toolboxes: highlighting and copy functions
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
