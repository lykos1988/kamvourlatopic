/* ===========================
   Firebase αρχικοποίηση
   =========================== */
const firebaseConfig = {
  apiKey: "AIzaSyAOTN20OrDBMIeXqgOeiEWwk__ylT9wOcQ",
  authDomain: "kamvourlatopic.firebaseapp.com",
  projectId: "kamvourlatopic",
  storageBucket: "kamvourlatopic.firebasestorage.app",
  messagingSenderId: "959451336361",
  appId: "1:959451336361:web:27b94d1799d4bb3159a3b8",
  measurementId: "G-0T7K4QLYH6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ===========================
   Cached DOM elements
   =========================== */
const servicesList = document.getElementById('servicesList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');

const serviceModal = document.getElementById('serviceModal');
const s_title = document.getElementById('s_title');
const s_name = document.getElementById('s_name');
const s_phone = document.getElementById('s_phone');
const s_email = document.getElementById('s_email');
const s_website = document.getElementById('s_website');
const s_desc = document.getElementById('s_desc');
const s_price = document.getElementById('s_price');
const s_img = document.getElementById('s_img');
const saveServiceBtn = document.getElementById('saveServiceBtn');
const deleteServiceBtn = document.getElementById('deleteServiceBtn');
const serviceClose = document.getElementById('serviceClose');
const btnAddService = document.getElementById('btn-add-service');

const reviewsModal = document.getElementById('reviewsModal');
const reviewsList = document.getElementById('reviewsList');
const reviewsServiceTitle = document.getElementById('reviewsServiceTitle');
const review_name = document.getElementById('review_name');
const review_text = document.getElementById('review_text');
const review_rating = document.getElementById('review_rating');
const submitReview = document.getElementById('submitReview');
const closeReviews = document.getElementById('closeReviews');

const helpModal = document.getElementById('helpModal');
const openHelp = document.getElementById('openHelp');
const closeHelp = document.getElementById('closeHelp');

let currentServiceId = null;
let currentServiceForReview = null;
let unsubscribeReviewsSnapshot = null;

/* ===========================
   Modal helpers
   =========================== */
function openModal(el) {
  if (!el) return;
  el.style.display = 'flex';
  el.setAttribute('aria-hidden', 'false');
}
function closeModal(el) {
  if (!el) return;
  el.style.display = 'none';
  el.setAttribute('aria-hidden', 'true');
}

/* ===========================
   Add Service UI
   =========================== */
btnAddService.addEventListener('click', () => {
  currentServiceId = null;
  document.getElementById('serviceModalTitle').textContent = 'Προσθήκη Υπηρεσίας';
  deleteServiceBtn.style.display = 'none';
  s_title.value = '';
  s_name.value = '';
  s_phone.value = '';
  s_email.value = '';
  s_website.value = '';
  s_desc.value = '';
  s_price.value = '';
  s_img.value = '';
  openModal(serviceModal);
});

serviceClose.onclick = () => closeModal(serviceModal);

/* ===========================
   Save Service -> Firestore
   =========================== */
saveServiceBtn.onclick = async () => {
  const title = s_title.value.trim();
  const name = s_name.value.trim();
  const phone = s_phone.value.trim();
  const email = s_email.value.trim();
  const website = s_website.value.trim();
  const desc = s_desc.value.trim();
  const price = parseFloat(s_price.value);
  const img = s_img.value.trim() || null;

  if (!title || !name || !phone || !email || isNaN(price)) {
    alert('Συμπλήρωσε τα υποχρεωτικά πεδία (*)');
    return;
  }

  try {
    // Πάντα νέα υπηρεσία — όχι επεξεργασία
    await db.collection('services').add({
      title, name, phone, email, website, desc, price, img,
      created: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal(serviceModal);
    alert('Η υπηρεσία αποθηκεύτηκε');
  } catch (err) {
    console.error('Σφάλμα αποθήκευσης:', err);
    alert('Παρουσιάστηκε σφάλμα κατά την αποθήκευση.');
  }
};

/* ===========================
   Delete Service (απενεργοποιημένο)
   =========================== */
// Κρύβουμε το κουμπί διαγραφής και αφαιρούμε το event
deleteServiceBtn.style.display = 'none';

/* ===========================
   Render Services (real-time)
   =========================== */
function renderServicesFromArray(services) {
  // Apply search filter
  const q = (searchInput.value || '').toLowerCase();
  let filtered = services;
  if (q) {
    filtered = services.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.desc || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q)
    );
  }

  // Sort
  const sort = sortSelect.value;
  if (sort === 'price-asc') filtered.sort((a,b) => (a.price||0) - (b.price||0));
  else if (sort === 'price-desc') filtered.sort((a,b) => (b.price||0) - (a.price||0));
  else if (sort === 'name-asc') filtered.sort((a,b) => (a.title||'').localeCompare(b.title||''));
  else if (sort === 'name-desc') filtered.sort((a,b) => (b.title||'').localeCompare(a.title||''));

  servicesList.innerHTML = '';

  filtered.forEach(s => {
    const reviewsForS = s._reviews || [];
    const reviewsCount = reviewsForS.length;
    const avgRating = reviewsCount ? (reviewsForS.reduce((sum,r)=>sum+(r.rating||0),0)/reviewsCount) : 0;

    const priceText = (typeof s.price === 'number') ? `€${s.price.toFixed(2)}` : '-';

    const div = document.createElement('div');
    div.className = 'service';
    div.innerHTML = `
      <div class="thumb">${s.img ? `<img src="${s.img}" alt="${s.title}">` : ''}</div>
      <div class="meta">
        <h3>${s.title || ''}</h3>
        <p>${s.desc || ''}</p>
        <div style="display:flex; justify-content:space-between; margin-top:8px; align-items:center">
          <div class="price">${priceText}</div>
          <div style="font-size:0.95em">
            ${reviewsCount ? `${avgRating.toFixed(1)} ★ (${reviewsCount})` : 'Χωρίς κριτικές'}
          </div>
        </div>
        <div style="font-size:0.9em; color:var(--muted); margin-top:6px">
          ${s.name || ''} | ${s.phone || ''} | ${s.email || ''}
        </div>
      </div>
      <div class="actions">
        <button class="small book" data-id="${s.id}">Κριτικές</button>
        <!-- Δεν υπάρχει κουμπί επεξεργασίας -->
        <button class="small share" data-title="${encodeURIComponent(s.title||'')}" data-desc="${encodeURIComponent(s.desc||'')}">Κοινή χρήση</button>
      </div>
    `;

    // Κριτικές - άνοιγμα modal
    div.querySelector('.book').onclick = () => {
      openReviewsForService(s.id, s.title || '');
    };

    // Share / copy
    div.querySelector('.share').onclick = (e) => {
      const title = decodeURIComponent(e.target.getAttribute('data-title') || '');
      const desc = decodeURIComponent(e.target.getAttribute('data-desc') || '');
      const shareText = `${title} - ${desc}`.substring(0, 200);
      if (navigator.share) {
        navigator.share({ title, text: desc, url: window.location.href }).catch(() => copyToClipboard(shareText));
      } else {
        copyToClipboard(shareText);
      }
    };

    servicesList.appendChild(div);
  });
}

/* ===========================
   Load services + attach review counts (live)
   =========================== */
function startServicesListener() {
  return db.collection('services').orderBy('created', 'desc').onSnapshot(async serviceSnap => {
    const services = [];
    serviceSnap.forEach(doc => services.push({ id: doc.id, ...doc.data() }));

    const serviceIds = services.map(s => s.id);
    if (serviceIds.length === 0) {
      renderServicesFromArray([]);
      return;
    }

    try {
      const reviewsSnap = await db.collection('reviews').where('serviceId', 'in', serviceIds).get();
      const reviews = [];
      reviewsSnap.forEach(rdoc => reviews.push({ id: rdoc.id, ...rdoc.data() }));

      services.forEach(s => {
        s._reviews = reviews.filter(r => r.serviceId === s.id).map(r => ({
          id: r.id,
          name: r.name || 'Ανώνυμος',
          text: r.text || '',
          rating: r.rating || 0,
          date: r.date ? r.date.toDate ? r.date.toDate() : new Date(r.date) : null
        }));
      });
    } catch (err) {
      console.warn('in-query failed or too many services — falling back to fetch all reviews', err);
      const reviewsSnapAll = await db.collection('reviews').get();
      const allReviews = [];
      reviewsSnapAll.forEach(rdoc => allReviews.push({ id: rdoc.id, ...rdoc.data() }));
      services.forEach(s => {
        s._reviews = allReviews.filter(r => r.serviceId === s.id).map(r => ({
          id: r.id,
          name: r.name || 'Ανώνυμος',
          text: r.text || '',
          rating: r.rating || 0,
          date: r.date ? r.date.toDate ? r.date.toDate() : new Date(r.date) : null
        }));
      });
    }

    renderServicesFromArray(services);
  }, err => {
    console.error('Σφάλμα listener services:', err);
  });
}

/* ===========================
   Search / Sort handlers
   =========================== */
searchInput.oninput = () => {
  db.collection('services').orderBy('created', 'desc').get().then(snap => {
    const services = [];
    snap.forEach(doc => services.push({ id: doc.id, ...doc.data() }));
    services.forEach(s => s._reviews = []);
    renderServicesFromArray(services);
  });
};
sortSelect.onchange = searchInput.oninput;

/* ===========================
   Reviews: open modal and live-listen reviews for a service
   =========================== */
function openReviewsForService(serviceId, serviceTitle) {
  currentServiceForReview = serviceId;
  reviewsServiceTitle.textContent = serviceTitle || 'Κριτικές';
  review_name.value = '';
  review_text.value = '';
  review_rating.value = '5';
  openModal(reviewsModal);

  if (typeof unsubscribeReviewsSnapshot === 'function') {
    unsubscribeReviewsSnapshot();
    unsubscribeReviewsSnapshot = null;
  }

  unsubscribeReviewsSnapshot = db.collection('reviews')
    .where('serviceId', '==', serviceId)
    .orderBy('date', 'desc')
    .onSnapshot(snapshot => {
      const reviews = [];
      snapshot.forEach(doc => {
        const r = doc.data();
        reviews.push({
          id: doc.id,
          name: r.name || 'Ανώνυμος',
          text: r.text || '',
          rating: r.rating || 0,
          date: r.date ? (r.date.toDate ? r.date.toDate() : new Date(r.date)) : null
        });
      });

      if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>Δεν υπάρχουν ακόμα κριτικές για αυτή την υπηρεσία.</p>';
      } else {
        reviewsList.innerHTML = reviews.map(r => `
          <div class="review" style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #eee">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
              <strong>${escapeHtml(r.name)}</strong>
              <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <div style="white-space:pre-wrap">${escapeHtml(r.text)}</div>
            <div style="font-size:0.8em; color:#666; margin-top:8px">
              ${r.date ? new Date(r.date).toLocaleString('el-GR') : ''}
            </div>
          </div>
        `).join('');
      }
    }, err => {
      console.error('Σφάλμα listener κριτικών:', err);
      reviewsList.innerHTML = '<p>Σφάλμα στην ανάκτηση κριτικών.</p>';
    });
}

closeReviews.onclick = () => {
  closeModal(reviewsModal);
  if (typeof unsubscribeReviewsSnapshot === 'function') {
    unsubscribeReviewsSnapshot();
    unsubscribeReviewsSnapshot = null;
  }
};

/* ===========================
   Submit review
   =========================== */
submitReview.onclick = async () => {
  const name = review_name.value.trim() || 'Ανώνυμος';
  const text = review_text.value.trim();
  const rating = parseInt(review_rating.value);

  if (!text || isNaN(rating) || !currentServiceForReview) {
    alert('Συμπλήρωσε την κριτική και την βαθμολογία');
    return;
  }

  try {
    await db.collection('reviews').add({
      serviceId: currentServiceForReview,
      name,
      text,
      rating,
      date: firebase.firestore.FieldValue.serverTimestamp()
    });
    review_name.value = '';
    review_text.value = '';
    review_rating.value = '5';
    alert('Η κριτική σας υποβλήθηκε');
  } catch (err) {
    console.error('Σφάλμα υποβολής κριτικής:', err);
    alert('Παρουσιάστηκε σφάλμα κατά την υποβολή της κριτικής.');
  }
};

/* ===========================
   Utility: copy to clipboard
   =========================== */
function copyToClipboard(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    alert('Κείμενο αντιγράφηκε στο πρόχειρο:\n\n' + text);
  } catch (e) {
    alert('Δεν ήταν δυνατή η αντιγραφή. Κάνε χειροκίνητη αντιγραφή:\n\n' + text);
  }
  document.body.removeChild(ta);
}

/* ===========================
   Utility: HTML escape
   =========================== */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

/* ===========================
   Start listeners
   =========================== */
const unsubscribeServices = startServicesListener();

/* ===========================
   Clean-up on page unload
   =========================== */
window.addEventListener('beforeunload', () => {
  if (typeof unsubscribeReviewsSnapshot === 'function') unsubscribeReviewsSnapshot();
  if (typeof unsubscribeServices === 'function') unsubscribeServices();
});
