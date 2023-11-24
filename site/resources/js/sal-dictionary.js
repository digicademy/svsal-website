var itemTemplate =
'<div class="col-lg-6 col-md-12 col-sm-12">' +
  '<div class="panel panel-default <%= obj.status %>">' +
    '<div class="panel-body">' +
      '<div class="hit">' +
        '<% if (obj.WIPstatus == "yes") { %>' +
          '<p class="watermark-wip-text">Work in Progress!</p>' +
        '<% } %>' +
        '<p class="lead">' +
          '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) {  %><%= obj.title %><% } %> </span></a>' +
          '</br>' +
          '<span><% if (obj.name) {  %><%= obj.name %><% } %></span>' +
        '</p>' +
        '<p>' +
          '<span><% if (obj.author) {  %><%= obj.author %><% } %></span>' +
        '</p>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</div>'

var settings = {
  items: dictionaryItems,
  facets: {},
  resultSelector: '#results',
  facetSelector: '#facets',
  resultTemplate: itemTemplate,
  deselectTemplate: '<div class=deselectstartover><span class="glyphicon glyphicon-remove-circle"></span> Deselect filters</div>',
  countTemplate: '<div class=facettotalcount style="position: absolute; top: 10px; left:340px;width:400px"><%= count %> Entries </div>',
  noResults: '<div class=results style=float:left;>Sorry, but no items match these criteria (or the list of items has not been found [hint to admin])</div>',
  paginationCount: 20,
  orderByOptions: {'title': 'Title', 'sortName': 'Author'}
}

$.facetelize(settings)

// ==== change label value in dropdown when order by value is chosen ====
$('.dropdown-menu').on('click', 'li a', function () {
  $('#order:first-child').html($(this).text() + ' <span class="caret"></span>')
  $('#order:first-child').val($(this).text())
})

// ==== Mobil-View: Hide opened collapsed menu after clicking elsewhere on page ====
$(document).on('click', function () {
  $('.collapse').collapse('hide')
})

// ==== Mobil-View: scroll to last collapsed navbar item on mobile when there are many items ====
$('.navbar-collapse').css({ maxHeight: $(window).height() - $('.navbar-header').height() + 'px' })
