// 1. UI Core - ทำงานทันที
const initUI = () => {
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

  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    let currentSlide = 0;
    setInterval(() => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (currentSlide + 1) % slides.length;
      slides[currentSlide].classList.add('active');
    }, 5000);
  }

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
      if (nav) nav.classList.remove('open');
      const icon = burger?.querySelector('i');
      if (icon) icon.classList.replace('fa-xmark', 'fa-bars');
    });
  });

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-q');
    if (question) {
      question.addEventListener('click', () => {
        faqItems.forEach(otherItem => {
          if (otherItem !== item) otherItem.classList.remove('active');
        });
        item.classList.toggle('active');
      });
    }
  });
};

// 2. Firebase Logic (Compat version)
const initFirebase = async () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBLKEaPOWbHAJef71nxDYdn6uz8iRwoUws",
    authDomain: "uthit-3cabe.firebaseapp.com",
    projectId: "uthit-3cabe",
    storageBucket: "uthit-3cabe.firebasestorage.app",
    messagingSenderId: "590967453177",
    appId: "1:590967453177:web:b9579a36b8159d40c4f928",
    measurementId: "G-WDGSEHMQ0B"
  };

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const storage = firebase.storage();

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

    const loadReviews = async () => {
      if (!reviewsDisplay) return;
      reviewsDisplay.innerHTML = '<p style="text-align:center; width:100%;">กำลังโหลดรีวิว...</p>';

      try {
        const snapshot = await db.collection("reviews").orderBy("createdAt", "desc").get();
        reviewsDisplay.innerHTML = '';

        snapshot.forEach((docSnap) => {
          const rev = docSnap.data();
          const docId = docSnap.id;
          const index = snapshot.docs.indexOf(docSnap);

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
            <div class="delete-review" data-id="${docId}"><i class="fa-solid fa-trash"></i></div>
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
      } catch (error) {
        console.error("Error loading reviews:", error);
        reviewsDisplay.innerHTML = '<p style="text-align:center; width:100%;">เกิดข้อผิดพลาดในการโหลดรีวิว</p>';
      }
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

    if (publishBtn) {
      publishBtn.addEventListener('click', async () => {
        const name = document.getElementById('rev-name').value;
        const text = document.getElementById('rev-text').value;
        const imgFiles = document.getElementById('rev-img').files;

        if (!name || !text || selectedRating === 0) {
          alert('กรุณากรอกข้อมูลให้ครบถ้วน และให้คะแนนดาวครับ');
          return;
        }

        publishBtn.disabled = true;
        publishBtn.innerHTML = 'กำลังส่งรีวิว... <i class="fa-solid fa-spinner fa-spin"></i>';

        try {
          const filesToUpload = Array.from(imgFiles).slice(0, 2);
          const imgUrls = [];

          for (const file of filesToUpload) {
            const storageRef = storage.ref(`reviews/${Date.now()}_${file.name}`);
            await storageRef.put(file);
            const url = await storageRef.getDownloadURL();
            imgUrls.push(url);
          }

          await db.collection("reviews").add({
            name,
            text,
            rating: selectedRating,
            imgs: imgUrls,
            date: new Date().toLocaleDateString('th-TH', {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit'
            }),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          document.getElementById('rev-name').value = '';
          document.getElementById('rev-text').value = '';
          document.getElementById('rev-img').value = '';
          selectedRating = 0;
          stars.forEach(s => s.classList.remove('active'));

          await loadReviews();
          alert('เผยแพร่รีวิวเรียบร้อยแล้ว ขอบคุณครับ!');
        } catch (error) {
          console.error("Error publishing review:", error);
          alert('เกิดข้อผิดพลาดในการส่งรีวิว กรุณาลองใหม่');
        } finally {
          publishBtn.disabled = false;
          publishBtn.innerHTML = 'เผยแพร่รีวิว <i class="fa-solid fa-paper-plane"></i>';
        }
      });
    }

    if (reviewsDisplay) {
      reviewsDisplay.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-review');
        if (deleteBtn) {
          const docId = deleteBtn.dataset.id;
          if (confirm('คุณต้องการลบรีวิวนี้ใช่หรือไม่?')) {
            try {
              await db.collection("reviews").doc(docId).delete();
              loadReviews();
            } catch (error) {
              console.error("Error deleting review:", error);
              alert('ไม่สามารถลบรีวิวได้');
            }
          }
        }
      });
    }

    loadReviews();
  } catch (error) {
    console.error("Firebase Init Error:", error);
  }
};

initUI();
initFirebase();
