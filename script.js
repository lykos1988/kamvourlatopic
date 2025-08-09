/* ===========================
   Αρχικά δεδομένα
   =========================== */
function read(key){ try{return JSON.parse(localStorage.getItem(key)||'null')}catch(e){return null} }
function write(key,val){ localStorage.setItem(key, JSON.stringify(val)) }

if(!read('kv_services')) {
  write('kv_services', []);
}
if(!read('kv_reviews')) {
  write('kv_reviews', []);
}

/* cached DOM */
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

/* open/close helpers */
function openModal(el) { 
  el.style.display = 'flex'; 
  el.setAttribute('aria-hidden','false');
}
function closeModal(el) { 
  el.style.display = 'none'; 
  el.setAttribute('aria-hidden','true');
}

/* Event listeners */
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

saveServiceBtn.onclick = () => {
  const title = s_title.value.trim();
  const name = s_name.value.trim();
  const phone = s_phone.value.trim();
  const email = s_email.value.trim();
  const website = s_website.value.trim();
  const desc = s_desc.value.trim();
  const price = parseFloat(s_price.value);
  const img = s_img.value.trim() || null;
  
  if(!title || !name || !phone || !email || isNaN(price)) {
    alert('Συμπλήρωσε τα υποχρεωτικά πεδία (*)');
    return;
  }

  let services = read('kv_services') || [];
  
  if(currentServiceId) {
    // Επεξεργασία υπάρχουσας υπηρεσίας
    const index = services.findIndex(s => s.id === currentServiceId);
    if(index !== -1) {
      services[index] = {
        ...services[index],
        title, name, phone, email, website, desc, price, img
      };
    }
  } else {
    // Προσθήκη νέας υπηρεσίας
    const id = services.length ? services[services.length-1].id + 1 : 1;
    services.push({ id, title, name, phone, email, website, desc, price, img });
  }
  
  write('kv_services', services);
  closeModal(serviceModal);
  renderServices();
  alert('Η υπηρεσία αποθηκεύτηκε');
};

deleteServiceBtn.onclick = () => {
  if(!currentServiceId || !confirm('Είστε σίγουρος ότι θέλετε να διαγράψετε αυτή την υπηρεσία;')) {
    return;
  }
  
  let services = read('kv_services') || [];
  services = services.filter(s => s.id !== currentServiceId);
  write('kv_services', services);
  
  // Διαγραφή και των κριτικών για αυτή την υπηρεσία
  let reviews = read('kv_reviews') || [];
  reviews = reviews.filter(r => r.serviceId !== currentServiceId);
  write('kv_reviews', reviews);
  
  closeModal(serviceModal);
  renderServices();
  alert('Η υπηρεσία διαγράφηκε');
};

function openReviewsModal(serviceId, serviceTitle) {
  currentServiceForReview = serviceId;
  reviewsServiceTitle.textContent = serviceTitle;
  renderReviews(serviceId);
  openModal(reviewsModal);
}

function renderReviews(serviceId) {
  const reviews = (read('kv_reviews') || []).filter(r => r.serviceId === serviceId);
  
  if(reviews.length === 0) {
    reviewsList.innerHTML = '<p>Δεν υπάρχουν ακόμα κριτικές για αυτή την υπηρεσία.</p>';
    return;
  }
  
  reviewsList.innerHTML = reviews.map(r => `
    <div class="review" style="margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #eee">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px">
        <strong>${r.name || 'Ανώνυμος'}</strong>
        <div>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      </div>
      <div>${r.text}</div>
      <div style="font-size:0.8em; color:#666; margin-top:8px">${new Date(r.date).toLocaleDateString('el-GR')}</div>
    </div>
  `).join('');
}

submitReview.onclick = () => {
  const name = review_name.value.trim();
  const text = review_text.value.trim();
  const rating = parseInt(review_rating.value);
  
  if(!text || isNaN(rating)) {
    alert('Συμπλήρωσε την κριτική και την βαθμολογία');
    return;
  }
  
  let reviews = read('kv_reviews') || [];
  reviews.push({
    serviceId: currentServiceForReview,
    name: name || 'Ανώνυμος',
    text,
    rating,
    date: new Date().toISOString()
  });
  
  write('kv_reviews', reviews);
  review_name.value = '';
  review_text.value = '';
  renderReviews(currentServiceForReview);
  renderServices(); // Για να ενημερωθεί η μέση βαθμολογία
  alert('Η κριτική σας υποβλήθηκε');
};

closeReviews.onclick = () => closeModal(reviewsModal);

openHelp.onclick = () => openModal(helpModal);
closeHelp.onclick = () => closeModal(helpModal);

/* Render services list */
function renderServices() {
  let services = read('kv_services') || [];
  const q = (searchInput.value || '').toLowerCase();
  
  if(q) {
    services = services.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.desc.toLowerCase().includes(q) || 
      s.name.toLowerCase().includes(q)
    );
  }
  
  const sort = sortSelect.value;
  if(sort === 'price-asc') services.sort((a,b) => a.price - b.price);
  else if(sort === 'price-desc') services.sort((a,b) => b.price - a.price);
  else if(sort === 'name-asc') services.sort((a,b) => a.title.localeCompare(b.title));
  else if(sort === 'name-desc') services.sort((a,b) => b.title.localeCompare(a.title));
  else if(sort === 'rating-desc') {
    services.forEach(s => {
      const reviews = (read('kv_reviews') || []).filter(r => r.serviceId === s.id);
      s.averageRating = reviews.length ? 
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 
        0;
    });
    services.sort((a,b) => b.averageRating - a.averageRating);
  }

  servicesList.innerHTML = '';
  
  services.forEach(s => {
    const reviews = (read('kv_reviews') || []).filter(r => r.serviceId === s.id);
    const averageRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) 
    : 0;

    const reviewsCount = reviews.length;
    
    const div = document.createElement('div');
    div.className = 'service';
    div.innerHTML = `
      <div class="thumb">${s.img ? `<img src="${s.img}" alt="${s.title}">` : ''}</div>
      <div class="meta">
        <h3>${s.title}</h3>
        <p>${s.desc || ''}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px">
          <div class="price">€${s.price.toFixed(2)}</div>
          <div>
            ${averageRating > 0 ? `${averageRating.toFixed(1)} ★ (${reviewsCount})` : 'Χωρίς κριτικές'}
          </div>
        </div>
        <div style="font-size:0.9em; color:var(--muted); margin-top:4px">
          ${s.name} | ${s.phone} | ${s.email}
        </div>
      </div>
      <div class="actions">
        <button class="small book" data-service-id="${s.id}">Κριτικές</button>
        <button class="small edit" data-service-id="${s.id}">Επεξεργασία</button>
        <button class="small share" data-service-title="${encodeURIComponent(s.title)}" 
                data-service-desc="${encodeURIComponent(s.desc || '')}">
          Κοινή χρήση
        </button>
      </div>
    `;
    
    div.querySelector('.book').onclick = () => {
      openReviewsModal(s.id, s.title);
    };
    
    div.querySelector('.edit').onclick = () => {
      currentServiceId = s.id;
      document.getElementById('serviceModalTitle').textContent = 'Επεξεργασία Υπηρεσίας';
      deleteServiceBtn.style.display = 'inline-block';
      s_title.value = s.title;
      s_name.value = s.name;
      s_phone.value = s.phone;
      s_email.value = s.email;
      s_website.value = s.website || '';
      s_desc.value = s.desc || '';
      s_price.value = s.price;
      s_img.value = s.img || '';
      openModal(serviceModal);
    };
    
    div.querySelector('.share').onclick = (e) => {
      const title = decodeURIComponent(e.target.getAttribute('data-service-title'));
      const desc = decodeURIComponent(e.target.getAttribute('data-service-desc'));
      const shareText = `${title} - ${desc}`.substring(0, 100) + '...';
      
      if(navigator.share) {
        navigator.share({
          title: title,
          text: desc,
          url: window.location.href
        }).catch(err => {
          console.log('Error sharing:', err);
          copyToClipboard(shareText);
        });
      } else {
        copyToClipboard(shareText);
      }
    };
    
    servicesList.appendChild(div);
  });
}

function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  alert('Ο σύνδεσμος αντιγράφηκε στο clipboard:\n\n' + text);
}

/* Event listeners */
searchInput.oninput = renderServices;
sortSelect.onchange = renderServices;

/* Init */
renderServices();