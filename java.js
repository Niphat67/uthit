document.addEventListener('DOMContentLoaded', () => {
  // --- Hero Image Rotation ---
  const startHeroRotation = () => {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 1) {
      let currentSlide = 0;
      setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
      }, 5000); // Rotate every 5 seconds
    }
  };
  startHeroRotation();

  // --- Burger Menu ---
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('nav');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      const icon = burger.querySelector('i');
      if (nav.classList.contains('open')) {
        icon.classList.replace('fa-bars', 'fa-xmark');
      } else {
        icon.classList.replace('fa-xmark', 'fa-bars');
      }
    });
  }

  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      const icon = burger.querySelector('i');
      if (icon) icon.classList.replace('fa-xmark', 'fa-bars');
    });
  });

  // --- FAQ Accordion ---
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-q');
    question.addEventListener('click', () => {
      faqItems.forEach(otherItem => {
        if (otherItem !== item) otherItem.classList.remove('active');
      });
      item.classList.toggle('active');
    });
  });

  // --- Enhanced Review System with Image Slideshow ---
  let selectedRating = 0;
  const stars = document.querySelectorAll('.star-rating i');
  const publishBtn = document.getElementById('publish-review');
  const reviewsDisplay = document.getElementById('reviews-display');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      stars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.value) <= selectedRating);
      });
    });
  });

  const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const loadReviews = () => {
    const reviews = JSON.parse(localStorage.getItem('uthit_reviews') || '[]');
    reviewsDisplay.innerHTML = '';

    reviews.forEach((rev, index) => {
      const card = document.createElement('div');
      card.className = 'review-card reveal visible';

      let imgHtml = '';
      if (rev.imgs && rev.imgs.length > 0) {
        imgHtml = `<div class="review-carousel" data-review-id="${index}">`;
        rev.imgs.forEach((img, i) => {
          imgHtml += `<img src="${img}" class="review-img-slide ${i === 0 ? 'active' : ''}" data-index="${i}">`;
        });
        imgHtml += `</div>`;
      }

      const starsHtml = '<div class="stars">' +
        Array.from({length: 5}, (_, i) => `<i class="fa-solid fa-star" style="color:${i < rev.rating ? '#ffc107' : '#ddd'}"></i>`).join('') +
        '</div>';

      card.innerHTML = `
        <div class="delete-review" data-index="${index}"><i class="fa-solid fa-trash"></i></div>
        ${imgHtml}
        ${starsHtml}
        <p>"${rev.text}"</p>
        <div class="client-info">
          <div class="client">${rev.name}</div>
          <div class="rev-date">${rev.date}</div>
        </div>
      `;
      reviewsDisplay.appendChild(card);
    });

    startImageRotation();
  };

  const startImageRotation = () => {
    const carousels = document.querySelectorAll('.review-carousel');
    carousels.forEach(carousel => {
      const slides = carousel.querySelectorAll('.review-img-slide');
      if (slides.length > 1) {
        let currentSlide = 0;
        setInterval(() => {
          slides[currentSlide].classList.remove('active');
          currentSlide = (currentSlide + 1) % slides.length;
          slides[currentSlide].classList.add('active');
        }, 3000);
      }
    });
  };

  publishBtn.addEventListener('click', async () => {
    const name = document.getElementById('rev-name').value;
    const text = document.getElementById('rev-text').value;
    const imgFiles = document.getElementById('rev-img').files;

    if (!name || !text || selectedRating === 0) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน และให้คะแนนดาวครับ');
      return;
    }

    const filesToUpload = Array.from(imgFiles).slice(0, 2);
    const imgBase64Array = await Promise.all(filesToUpload.map(file => toBase64(file)));

    const newReview = {
      name,
      text,
      rating: selectedRating,
      imgs: imgBase64Array,
      date: new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    };

    const reviews = JSON.parse(localStorage.getItem('uthit_reviews') || '[]');
    reviews.unshift(newReview);
    localStorage.setItem('uthit_reviews', JSON.stringify(reviews));

    document.getElementById('rev-name').value = '';
    document.getElementById('rev-text').value = '';
    document.getElementById('rev-img').value = '';
    selectedRating = 0;
    stars.forEach(s => s.classList.remove('active'));

    loadReviews();
    alert('เผยแพร่รีวิวเรียบร้อยแล้ว ขอบคุณครับ!');
  });

  reviewsDisplay.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-review');
    if (deleteBtn) {
      const index = deleteBtn.dataset.index;
      if (confirm('คุณต้องการลบรีวิวนี้ใช่หรือไม่?')) {
        const reviews = JSON.parse(localStorage.getItem('uthit_reviews') || '[]');
        reviews.splice(index, 1);
        localStorage.setItem('uthit_reviews', JSON.stringify(reviews));
        loadReviews();
      }
    }
  });

  loadReviews();

  const revealOptions = { threshold: 0.15 };
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        target.classList.add('visible');
        const children = target.querySelectorAll('.reveal, .service-card, .contact-card, .stat, .port-item, .review-card, .faq-item');
        if (children.length > 0) {
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 100}ms`;
            child.classList.add('visible');
          });
        }
      }
    });
  }, revealOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    revealObserver.observe(el);
  });
});