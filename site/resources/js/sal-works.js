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
          '<span ><% if (obj.printingPlace) {  %><%= obj.printingPlace %><% } %><% if (obj.printer) {  %><%= obj.printer %><% } %><% if (obj.date) {  %>, <%= obj.date %><% } %></span>' +
        '</p>' +
        '<p class="volumeLinks">' +
          '<span><%= obj.volLabel %></span>' +
          '<% if (obj.vol1) { %>' +
            '<a class="workVolume" href="<%= obj.vol1 %>"><%= obj.vol1Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol1Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol2) { %>' +
            '<a class="workVolume" href="<%= obj.vol2 %>"><%= obj.vol2Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol2Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol3) { %>' +
            '<a class="workVolume" href="<%= obj.vol3 %>"><%= obj.vol3Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol3Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol4) { %>' +
            '<a class="workVolume" href="<%= obj.vol4 %>"><%= obj.vol4Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol4Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol5) { %>' +
            '<a class="workVolume" href="<%= obj.vol5 %>"><%= obj.vol5Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol5Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol6) { %>' +
            '<a class="workVolume" href="<%= obj.vol6 %>"><%= obj.vol6Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol6Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol7) { %>' +
            '<a class="workVolume" href="<%= obj.vol7 %>"><%= obj.vol7Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol7Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol8) { %>' +
            '<a class="workVolume" href="<%= obj.vol8 %>"><%= obj.vol8Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol8Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol9) { %>' +
            '<a class="workVolume" href="<%= obj.vol9 %>"><%= obj.vol9Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol9Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol10) { %>' +
            '<a class="workVolume" href="<%= obj.vol10 %>"><%= obj.vol10Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol10Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol11) { %>' +
            '<a class="workVolume" href="<%= obj.vol11 %>"><%= obj.vol11Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol11Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol12) { %>' +
            '<a class="workVolume" href="<%= obj.vol12 %>"><%= obj.vol12Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol12Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol13) { %>' +
            '<a class="workVolume" href="<%= obj.vol13 %>"><%= obj.vol13Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol13Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol14) { %>' +
            '<a class="workVolume" href="<%= obj.vol14 %>"><%= obj.vol14Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol14Cont %></span>' +
          '<% }%>' +
          '<% if (obj.vol15) { %>' +
            '<a class="workVolume" href="<%= obj.vol15 %>"><%= obj.vol15Cont %></a>' +
          '<% } else {%>' +
            '<span class="workVolume"><%= obj.vol15Cont %></span>' +
          '<% }%>' +
        '</p>' +
          '<a title="<%=obj.facsAttrib %>" class="workImages pull-right" target="_blank" rel="noopener noreferrer" href="<%= obj.workImages %>"><i class="fas fa-book-open" ></i> <%=obj.facsAttrib %></a>' +
        '<br/>' +
        '<a title="<%=obj.titAttrib %>" class="workDetails pull-right" href="<%= obj.workdetails %>"><i class="fas fa-file-alt" ></i> <%=obj.titAttrib %></a>' +
          '<a style="display: none;"  ><%= obj.sortName %></a>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</div>'

var settings = {
  items: worksItems,
  facets: {
    'nameFacet': 'Author',
    'chronology': 'Year of Publication',
    'textLanguage': 'Language',
    'facetPlace': 'Publish place',
    'facetAvailability': 'Availability'
  },
  resultSelector: '#results',
  facetSelector: '#facets',
  resultTemplate: itemTemplate,
  deselectTemplate: '<div class=deselectstartover><span class="glyphicon glyphicon-remove-circle"></span> Deselect filters</div>',
  countTemplate: '<div class=facettotalcount style="position: absolute; top: 10px; left:340px;width:400px"><%= count %> Entries </div>',
  noResults: '<div class=results style=float:left;>Sorry, but no items match these criteria (or the list of items has not been found [hint to admin])</div>',
  paginationCount: 10,
  orderByOptions: {'sortName': 'Author', 'title': 'Title', 'printingPlace': 'Publish place', 'date': 'Year of Publication'}
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
