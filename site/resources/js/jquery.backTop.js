/* eslint-env browser jquery */
/* Minified js for jQuery BackTop */
!(function (o) {
  o.fn.backTop = function (e) {
    var n = this,
      i = o.extend({ position: 400, speed: 500, color: 'white' }, e),
      t = i.position,
      c = i.speed,
      d = i.color;
    n.addClass(
      'white' == d
        ? 'white'
        : 'red' == d
        ? 'red'
        : 'green' == d
        ? 'green'
        : 'black'
    ),
      n.css({ right: 40, bottom: 40, position: 'fixed' }),
      o(document).scroll(function () {
        var e = o(window).scrollTop();
        e >= t ? n.fadeIn(c) : n.fadeOut(c);
      }),
      n.click(function () {
        if (document.querySelector('link[rel="first"]')) {
          var firstFragHTML = document
              .querySelector('link[rel="first"]')
              .getAttribute('href'),
            firstFrag = firstFragHTML.match(/frag=([^&]*)/i)[1],
            params = new URLSearchParams(window.location.search),
            curFrag = params.get('frag');
          if (curFrag == firstFrag) {
            console.log('Going to top...');
            o('html, body').animate(
              {
                scrollTop: 0,
              },
              {
                duration: 1200,
              }
            );
          } else {
            console.log('Going to ' + firstFrag + '...');
            params.delete('frag');
            params.delete('wid');
            window.location.href = firstFragHTML + '&' + params;
            return;
          }
        } else {
          console.log('Going to top...');
          o('html, body').animate(
            {
              scrollTop: 0,
            },
            {
              duration: 1200,
            }
          );
        }
      });
  };
})(jQuery);
