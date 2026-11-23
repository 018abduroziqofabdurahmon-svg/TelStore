// Standalone AOS Bridge for TelStore
window.AOS = {
  init: function(options) {
    var opts = options || {};
    var duration = opts.duration || 750;
    var easing = opts.easing || 'cubic-bezier(0.16, 1, 0.3, 1)';
    var once = opts.once !== false;

    var elements = document.querySelectorAll('[data-aos]');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          entry.target.classList.remove('aos-animate');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(function(el) {
      if (el.dataset.aosDuration) {
        el.style.transitionDuration = (el.dataset.aosDuration / 1000) + 's';
      }
      if (el.dataset.aosDelay) {
        el.style.transitionDelay = (el.dataset.aosDelay / 1000) + 's';
      }
      observer.observe(el);
    });
  }
};
