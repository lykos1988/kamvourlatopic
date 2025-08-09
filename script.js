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
        <!-- <button class="small edit" data-id="${s.id}">Επεξεργασία</button> -->
        <button class="small share" data-title="${encodeURIComponent(s.title||'')}" data-desc="${encodeURIComponent(s.desc||'')}">Κοινή χρήση</button>
      </div>
    `;

    // Κριτικές - άνοιγμα modal
    div.querySelector('.book').onclick = () => {
      openReviewsForService(s.id, s.title || '');
    };

    // Επεξεργασία - αφαιρεμένο / σχολιασμένο
    /*
    div.querySelector('.edit').onclick = () => {
      currentServiceId = s.id;
      document.getElementById('serviceModalTitle').textContent = 'Επεξεργασία Υπηρεσίας';
      deleteServiceBtn.style.display = 'inline-block';
      s_title.value = s.title || '';
      s_name.value = s.name || '';
      s_phone.value = s.phone || '';
      s_email.value = s.email || '';
      s_website.value = s.website || '';
      s_desc.value = s.desc || '';
      s_price.value = (typeof s.price === 'number') ? s.price : '';
      s_img.value = s.img || '';
      openModal(serviceModal);
    };
    */

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
