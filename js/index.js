function goLogin() {
  window.location.href = '/login';
}

document.getElementById('go-login')?.addEventListener('click', goLogin);
document.getElementById('go-login-bottom')?.addEventListener('click', goLogin);

function setupHeroSlider() {
  const root = document.querySelector('[data-hero-slider]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.hero-slide'));
  const track = root.querySelector('[data-slide-track]');
  const progressBar = root.querySelector('[data-slide-progress]');
  const dotsContainer = root.querySelector('[data-slide-dots]');
  const prevBtn = root.querySelector('[data-slide-prev]');
  const nextBtn = root.querySelector('[data-slide-next]');
  if (!slides.length || !track || !dotsContainer || !prevBtn || !nextBtn) return;

  let current = 0;

  const dots = slides.map((_slide, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider-dot';
    dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
    dot.addEventListener('click', () => {
      goTo(index);
      resetAutoplay();
    });
    dotsContainer.appendChild(dot);
    return dot;
  });

  const AUTOPLAY_MS = 4500;
  function render() {
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, index) => {
      dot.classList.toggle('is-active', index === current);
    });
    if (progressBar) {
      progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    }
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    render();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  prevBtn.addEventListener('click', () => {
    prev();
    resetAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    next();
    resetAutoplay();
  });

  let timer = null;
  function startAutoplay() {
    timer = window.setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }
  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);

  let touchStartX = null;
  let touchCurrentX = null;
  const SWIPE_THRESHOLD = 45;

  root.addEventListener(
    'touchstart',
    (event) => {
      if (!event.touches.length) return;
      touchStartX = event.touches[0].clientX;
      touchCurrentX = touchStartX;
      stopAutoplay();
    },
    { passive: true }
  );

  root.addEventListener(
    'touchmove',
    (event) => {
      if (!event.touches.length) return;
      touchCurrentX = event.touches[0].clientX;
    },
    { passive: true }
  );

  root.addEventListener('touchend', () => {
    if (touchStartX === null || touchCurrentX === null) {
      startAutoplay();
      return;
    }

    const deltaX = touchCurrentX - touchStartX;
    if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        next();
      } else {
        prev();
      }
    }

    touchStartX = null;
    touchCurrentX = null;
    resetAutoplay();
  });

  render();
  startAutoplay();
}

function setupRevealAnimations() {
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

setupHeroSlider();
setupRevealAnimations();
