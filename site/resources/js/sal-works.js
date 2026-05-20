const itemTemplate =
'<div class="col-lg-6 col-md-12 col-sm-12">' +
  '<div class="panel panel-default <%= obj.status %>">' +
    '<div class="panel-body">' +
      '<div class="hit">' +
        '<% if (obj.WIPstatus == "yes") { %><p class="watermark-wip-text">Work in Progress!</p><% } %> ' +
        '<div class="lead">' +
          '<% if (obj.type == "Reference Work") { %>' +
            '<p class="typeWork"><%= obj.type %> <a href="https://www.salamanca.school/guidelines.html#en-edition" target="_blank"><span type="button" style="margin-left: 4px;" class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="right" title="Transcribed reference text with automatic editing only"></span></a></p>' +
            '</br>' +
            '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) { %><%= obj.title %><% } %></span></a>' +
          '<% } else if (obj.type == "Automatically Edited Work") { %>' +
            '<p class="typeWork"><%= obj.type %> <a href="https://www.salamanca.school/guidelines.html#en-edition" target="_blank"><span type="button" style="margin-left: 4px;" class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="right" title="Transcribed text with automatic editing only"></span></a></p>' +
            '</br>' +
            '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) { %><%= obj.title %><% } %></span></a>' +
          '<% } else if (obj.type == "Edited Work") { %>' +
            '<p class="typeWork"><%= obj.type %> <a href="https://www.salamanca.school/guidelines.html#en-edition" target="_blank"><span type="button" style="margin-left: 4px;" class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="right" title="Fully scholarly edited text"></span></a></p>' +
            '</br>' +
            '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) { %><%= obj.title %><% } %></span></a>' +
          '<% } else if (obj.type == "Facsimiles") { %>' +
            '<p class="typeWork"><%= obj.type %> <span type="btn" style="margin-left: 4px;" class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="right" title="Image scans only; text is forthcoming"></span></p>' +
            '</br>' +
            '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) { %><%= obj.title %><% } %></span></a>' +
          '<% } else { %>' +
            ' <p class="typeWork">Other <span type="button" style="margin-left: 4px;" class="glyphicon glyphicon-info-sign" data-toggle="tooltip" data-placement="right" title="No type found"></span></p>' +
            '</br>' +
            '<a href="<%= obj.monoMultiUrl %>"><span class="work-title"><% if (obj.title) { %><%= obj.title %><% } %></span></a>' +
          '<% }%>' +
          '</br>' +
          '<span><% if (obj.name) { %><%= obj.name %><% } %></span>' +
        '</div>' +
        '<p>' +
            '<span>' +
              '<% if (obj.printingPlace) { %><%= obj.printingPlace %><% } %>' +
              '<% if (obj.printer) { %><%= obj.printer %><% } %>' +
              '<% if (obj.date) { %>, <%= obj.date %><% } %>' +
            '</span>' +
        '</p>' +
        '<p class="volumeLinks">' +
          '<span><%= obj.volLabel %></span>' +
          '<% if (obj.vol1) { %>' +
            '<a class="workVolume" href="<%= obj.vol1 %>"><%= obj.vol1Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol1Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol2) { %>' +
            '<a class="workVolume" href="<%= obj.vol2 %>"><%= obj.vol2Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol2Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol3) { %>' +
            '<a class="workVolume" href="<%= obj.vol3 %>"><%= obj.vol3Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol3Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol4) { %>' +
            '<a class="workVolume" href="<%= obj.vol4 %>"><%= obj.vol4Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol4Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol5) { %>' +
            '<a class="workVolume" href="<%= obj.vol5 %>"><%= obj.vol5Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol5Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol6) { %>' +
            '<a class="workVolume" href="<%= obj.vol6 %>"><%= obj.vol6Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol6Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol7) { %>' +
            '<a class="workVolume" href="<%= obj.vol7 %>"><%= obj.vol7Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol7Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol8) { %>' +
            '<a class="workVolume" href="<%= obj.vol8 %>"><%= obj.vol8Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol8Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol9) { %>' +
            '<a class="workVolume" href="<%= obj.vol9 %>"><%= obj.vol9Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol9Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol10) { %>' +
            '<a class="workVolume" href="<%= obj.vol10 %>"><%= obj.vol10Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol10Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol11) { %>' +
            '<a class="workVolume" href="<%= obj.vol11 %>"><%= obj.vol11Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol11Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol12) { %>' +
            '<a class="workVolume" href="<%= obj.vol12 %>"><%= obj.vol12Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol12Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol13) { %>' +
            '<a class="workVolume" href="<%= obj.vol13 %>"><%= obj.vol13Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol13Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol14) { %>' +
            '<a class="workVolume" href="<%= obj.vol14 %>"><%= obj.vol14Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol14Cont %></span>' +
          '<% } %>' +
          '<% if (obj.vol15) { %>' +
            '<a class="workVolume" href="<%= obj.vol15 %>"><%= obj.vol15Cont %></a>' +
          '<% } else { %>' +
            '<span class="workVolume"><%= obj.vol15Cont %></span>' +
          '<% } %>' +
        '</p>' +
        '<% if (obj.type == "Reference Work") { %>' +
          '<a title="<%=obj.facsAttrib %>" class="workImages pull-right" target="_blank" rel="noopener noreferrer" href="<%= obj.workImages %>"><i class="fas fa-book-open" ></i> <%=obj.facsAttrib %></a>' +
        '<% } else { %>' +
          '<a title="<%=obj.facsAttrib %>" class="workImages pull-right" target="_blank" rel="noopener noreferrer" href="<%= obj.workImages %>"><i class="fas fa-book-open" ></i> <%=obj.facsAttrib %></a>' +
        '<% } %>' +
        '<br/>' +
        '<% if (obj.type == "Reference Work") { %>' +
          '<a title="<%=obj.titAttrib %>" class="workDetails pull-right" href="<%= obj.workdetails %>"><i class="fas fa-file-alt"></i> <%=obj.titAttrib %></a>' +
          '<a style="display: none;" ><%= obj.sortName %></a>' +
        '<% } else { %>' +
          '<a title="<%=obj.titAttrib %>" class="workDetails pull-right" href="<%= obj.workdetails %>"><i class="fas fa-file-alt"></i> <%=obj.titAttrib %></a>' +
          '<a style="display: none;" ><%= obj.sortName %></a>' +
        '<% } %>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</div>'

const settings = {
  // eslint-disable-next-line no-undef
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
  countTemplate: '<div class=facettotalcount style="position: absolute; top: 10px; left:340px;width:400px"><%= count %> Entries</div>',
  noResults: '<div class=results style=float:left;>Sorry, but no items match these criteria (or the list of items has not been found [hint to admin])</div>',
  paginationCount: 40,
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

// ==== Load Corpus Statistics ====
function loadCorpusStats() {
    // Assuming the file is located in the /data/ directory
    var statsUrl = '/data/corpus-stats.json';

    fetch(statsUrl)
        .then(function(response) {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            // Check if data exists and has the expected structure
            if (data && data.length > 0 && data[0].corpus) {
                var corpus = data[0].corpus;
                var statsHtml = '';

                // Helper to format numbers
                var formatNum = function(num) {
                    if (num) {
                        return parseInt(num).toLocaleString();
                    }
                    return 'N/A';
                };

                var tokens = formatNum(corpus.tokens_count);
                var chars = formatNum(corpus.chars_count);
                var words = formatNum(corpus.words_count);
                var wordforms = formatNum(corpus.wordforms_count);
                if (corpus.normalizations_count) {
                  var sic = formatNum(corpus.normalizations_count.sic);
                  var corr = formatNum(corpus.normalizations_count.corr);
                  var abbr = formatNum(corpus.normalizations_count.abbr);
                  var expan = formatNum(corpus.normalizations_count.expan);
                  var hyph = formatNum(corpus.normalizations_count.unmarked_hyph);
                }
                if (corpus.facs_count) {
                  var facs_txt = formatNum(corpus.facs_count.full_text);
                  var facs_img = formatNum(corpus.facs_count.images);
                  var facs_total = facs_txt !== 'N/A' && facs_img !== 'N/A' ? formatNum(parseInt(corpus.facs_count.full_text) + parseInt(corpus.facs_count.images)) : 'N/A';
                }

                // Construct HTML with Bootstrap classes and Glyphicons (Table format)
                statsHtml = '<table class="corpus-stats-table">';
                statsHtml += '<tbody>';
                statsHtml += '<tr><td colspan="2" class="section-header"><strong>Text</strong></td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-list"></span> <strong>Tokens:</strong></td><td class="stat-value">' + tokens + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-text-size"></span> <strong>Characters:</strong></td><td class="stat-value">' + chars + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-globe"></span> <strong>Words:</strong></td><td class="stat-value">' + words + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-sort"></span> <strong>Wordforms:</strong></td><td class="stat-value">' + wordforms + '</td></tr>';
                statsHtml += '<tr><td colspan="2" class="section-header"><strong>Page Images</strong></td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-picture"></span> <strong>Transcribed:</strong></td><td class="stat-value">' + facs_txt + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-picture"></span> <strong>Untranscribed:</strong></td><td class="stat-value">' + facs_img + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-picture"></span> <strong>Total:</strong></td><td class="stat-value">' + facs_total + '</td></tr>';
                statsHtml += '<tr><td colspan="2" class="section-header"><strong>Normalizations</strong></td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-ok"></span> <strong>Errors:</strong></td><td class="stat-value">' + sic + '/' + corr + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-ok"></span> <strong>Abbreviations:</strong></td><td class="stat-value">' + abbr + '/' + expan + '</td></tr>';
                statsHtml += '<tr><td class="stat-label"><span class="glyphicon glyphicon-ok"></span> <strong>Fixed hyphenations:</strong></td><td class="stat-value">' + hyph + '</td></tr>';
                statsHtml += '</tbody>';
                statsHtml += '</table>';

                // Find the placeholder element using plain DOM API
                var placeholder = document.querySelector('[data-template="app:corpusStatsTeaser"]');

                // Inject HTML instead of the placeholder
                if (placeholder) {
                    placeholder.outerHTML = statsHtml;
                }
            }
        })
        .catch(function(error) {
            console.warn('Could not load corpus statistics from ' + statsUrl + ': ' + error.message);
            // Optional: Add a fallback message if the file is missing
            // var placeholder = document.querySelector('[data-template="app:corpusStatsTeaser"]');
            // if (placeholder) {
            //     placeholder.innerHTML = '<p>Statistics unavailable.</p>';
            // }
        });
}

// Run when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    loadCorpusStats();
});
