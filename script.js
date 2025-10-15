// script.js — ΕΝΗΜΕΡΩΜΕΝΟ, συμβατό με το υπάρχον index.html
// Χρησιμοποιεί τα ίδια Backendless keys όπως στο HTML
Backendless.initApp(
  "8BCC68CF-12AA-4F64-A2DF-D6FD92100D8C",
  "6E2644FF-7C10-4AA1-98FB-F3F49CC325D7"
);

/* =======================
   Βοηθητικές συναρτήσεις
   ======================= */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('el-GR');
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m];
  });
}

function safeParseJSON(s) {
  try { return JSON.parse(s || '[]'); } catch { return []; }
}

/* =======================
   Global state
   ======================= */
let currentAdElement = null;   // το .ad στοιχείο που είναι ενεργό για σχόλιο / αναφορά
let editingObjectId = null;    // αν επεξεργαζόμαστε, εδώ είναι το objectId
const MAX_IMAGES = 4;

/* =======================
   DOM Ready
   ======================= */
document.addEventListener('DOMContentLoaded', () => {
  console.log('script.js φόρτωσε');

  // Στοιχεία από το index.html (υπάρχουν όπως στο αρχικό)
  const adModal = document.getElementById('adModal');
  const adForm = document.getElementById('adForm');
  const imageInput = document.getElementById('image'); // το input υπάρχει στο HTML
  const adsContainer = document.getElementById('adsContainer');
  const commentModal = document.getElementById('commentModal');
  const commentForm = document.getElementById('commentForm');
  const commentTextarea = document.getElementById('commentText');

  // 1) Κάνουμε το input εικόνας multiple (χωρίς να αλλάξουμε το HTML)
  if (imageInput) {
    imageInput.setAttribute('multiple', 'multiple'); // user can select many files
    // Επίσης περιορίζουμε programmatically πριν upload
  }

  // 2) Εισαγωγή search bar πάνω από τις αγγελίες (δεν αγγίζει CSS)
  insertSearchBar();

  // 3) Local login (τοπικό, απλό)
  setupLocalLogin();

  // 4) Hooks για modal open/close (υπάρχουν ήδη στο HTML κλήσεις openModal/closeModal)
  // Ορίζουμε τις λειτουργίες έτσι ώστε τα υπόλοιπα να δουλεύουν
  window.openModal = function() {
    editingObjectId = null;
    adForm.reset();
    // αν υπάρχει πεδίο για preview, το αδειάζουμε (δεν υπάρχει στο HTML αρχικά)
    adModal.style.display = "flex";
  };
  window.closeModal = function() {
    editingObjectId = null;
    adModal.style.display = "none";
    adForm.reset();
  };

  // 5) Καθαρή φόρτωση αγγελιών από Backendless
  loadAds();

  // 6) Submit φόρμας καταχώρησης / επεξεργασίας
  if (adForm) {
    adForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        // συλλογή πεδίων
        const category = document.getElementById('category').value;
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const location = document.getElementById('location').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const price = Number(document.getElementById('price').value) || 0;

        // user info από localStorage
        let userId = localStorage.getItem('userId');
        if (!userId) {
          userId = uuidv4();
          localStorage.setItem('userId', userId);
        }
        const userName = localStorage.getItem('userName') || 'Ανώνυμος';

        // εικόνες (έως MAX_IMAGES)
        const files = imageInput && imageInput.files ? Array.from(imageInput.files).slice(0, MAX_IMAGES) : [];
        // upload new files (αν υπάρχουν)
        const uploadedUrls = await uploadFiles(files);

        // Αν επεξεργασία -> φορτώνουμε το υπάρχον αντικείμενο για να κρατήσουμε created & υπάρχουσες εικόνες
        if (editingObjectId) {
          // fetch existing
          const existing = await Backendless.Data.of("Ads").findById(editingObjectId);
          if (!existing) {
            alert('Αδυναμία εύρεσης αγγελίας για επεξεργασία.');
            editingObjectId = null;
            return;
          }
          // Συνένωση url: υπάρχουσες (αν υπάρχουν) + νέες (έως MAX_IMAGES)
          const existingUrls = existing.imageUrls || (existing.imageUrl ? [existing.imageUrl] : []);
          const merged = existingUrls.concat(uploadedUrls).slice(0, MAX_IMAGES);

          const toSave = {
            objectId: editingObjectId,
            category, title, description, location, phone, price,
            imageUrls: merged,
            postedBy: existing.postedBy || userName,
            ownerId: existing.ownerId || userId,
            created: existing.created || new Date().toISOString()
          };

          const saved = await Backendless.Data.of("Ads").save(toSave);
          renderAd(saved, true);
          editingObjectId = null;
          adForm.reset();
          adModal.style.display = "none";
          return;
        }

        // νέα αγγελία
        const adObj = {
          category, title, description, location, phone, price,
          imageUrls: uploadedUrls,
          postedBy: userName,
          ownerId: userId,
          created: new Date().toISOString()
        };

        const saved = await Backendless.Data.of("Ads").save(adObj);
        renderAd(saved, true);
        adForm.reset();
        adModal.style.display = "none";
      } catch (err) {
        console.error('Σφάλμα αποθήκευσης αγγελίας:', err);
        alert('Σφάλμα κατά την αποθήκευση. Δες την κονσόλα.');
      }
    });
  }

  // 7) Comment form: εδώ εφαρμόζουμε τη διαγραφή με λέξη "delete" (μόνο από δημιουργό) ή απλό σχόλιο
  if (commentForm) {
    commentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = commentTextarea.value.trim();
      if (!currentAdElement) {
        closeCommentModal();
        return;
      }
      // αν περιέχει delete -> ΔΙΑΓΡΑΦΗ (μόνο δημιουργός)
      if (text.toLowerCase().includes('delete')) {
        const objectId = currentAdElement.dataset.id;
        const owner = currentAdElement.dataset.owner;
        const userId = localStorage.getItem('userId');
        if (!userId || owner !== userId) {
          alert('Μόνο ο δημιουργός της αγγελίας μπορεί να διαγράψει με τη λέξη "delete".');
          closeCommentModal();
          return;
        }
        // Διαγραφή: πρώτα φέρνουμε το αντικείμενο για image urls
        try {
          const adObj = await Backendless.Data.of("Ads").findById(objectId);
          if (adObj) {
            const urls = adObj.imageUrls || (adObj.imageUrl ? [adObj.imageUrl] : []);
            // Διαγραφή αρχείων (ασύγχρονη, αλλά περιμένουμε για αξιοπιστία)
            for (const u of urls) {
              await removeFileByUrl(u);
            }
          }
          await Backendless.Data.of("Ads").remove({ objectId });
          // Αφαιρούμε το element από DOM
          currentAdElement.remove();
          alert('Η αγγελία διαγράφηκε.');
        } catch (err) {
          console.error('Σφάλμα διαγραφής:', err);
          alert('Σφάλμα κατά τη διαγραφή. Δες κονσόλα.');
        } finally {
          closeCommentModal();
        }
        return;
      }

      // αλλιώς απλό σχόλιο: το εμφανίζουμε τοπικά κάτω από την αγγελία
      const commentsBox = currentAdElement.querySelector('.comments');
      if (commentsBox) {
        const p = document.createElement('p');
        p.textContent = text;
        commentsBox.appendChild(p);
      }
      closeCommentModal();
    });
  }

  /* =======================
     Βοηθητικές λειτουργίες upload/remove
     ======================= */
  async function uploadFiles(filesArray) {
    if (!filesArray || filesArray.length === 0) return [];
    const arr = Array.from(filesArray).slice(0, MAX_IMAGES);
    const promises = arr.map(f => Backendless.Files.upload(f, "ads-images", true)
      .then(res => {
        // backendless επιστρέφει αντικείμενο με fileURL
        if (res && res.fileURL) return res.fileURL;
        if (typeof res === 'string') return res;
        return '';
      })
      .catch(err => {
        console.error('Σφάλμα upload:', err);
        return '';
      })
    );
    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }

  async function removeFileByUrl(imageUrl) {
    if (!imageUrl) return;
    // Backendless path: μετά το "/files/"
    const idx = imageUrl.indexOf('/files/');
    if (idx === -1) return;
    const filePath = imageUrl.substring(idx + 7); // μετά το /files/
    try {
      await Backendless.Files.remove(filePath);
      console.log('Αφαίρεση αρχείου:', filePath);
    } catch (err) {
      console.error('Σφάλμα στην αφαίρεση αρχείου:', err);
    }
  }

  /* =======================
     Render single ad (συμβατό με υπάρχουσες classes)
     ======================= */
  function renderAd(ad, prepend = false) {
    // Αφαιρούμε τυχόν παλιό element με ίδιο id
    const existing = document.querySelector(`.ad[data-id="${ad.objectId}"]`);
    if (existing) existing.remove();

    const adDiv = document.createElement('div');
    adDiv.className = 'ad';
    if (ad.category) adDiv.setAttribute('data-category', ad.category);
    adDiv.setAttribute('data-id', ad.objectId || '');
    adDiv.setAttribute('data-owner', ad.ownerId || '');
    // Συντηρούμε εικόνες σε attribute για πιθανή χρήση
    adDiv.dataset.imageUrls = JSON.stringify(ad.imageUrls || (ad.imageUrl ? [ad.imageUrl] : []));

    // εικόνες (αν υπάρχουν) - μικρές thumbs
    let imagesHtml = '';
    const imgs = ad.imageUrls || (ad.imageUrl ? [ad.imageUrl] : []);
    if (imgs && imgs.length) {
      imagesHtml = imgs.map(u => `<img src="${u}" alt="ad image">`).join(' ');
    }

    const createdHtml = ad.created ? `<p><strong>Ημερομηνία:</strong> ${formatDate(ad.created)}</p>` : '';

    // κατασκευάζουμε το innerHTML σύμφωνα με το παλιό layout (παρόμοιο)
    adDiv.innerHTML = `
      ${imgs && imgs.length ? `<div class="ad-images">${imagesHtml}</div>` : ''}
      <h3>${escapeHtml(ad.title || '')}</h3>
      <p>${escapeHtml(ad.description || '')}</p>
      <p><strong>Τοποθεσία:</strong> ${escapeHtml(ad.location || '')}</p>
      <p><strong>Τηλέφωνο:</strong> ${escapeHtml(ad.phone || '')}</p>
      <p><strong>Τιμή:</strong> ${escapeHtml(String(ad.price || ''))} €</p>
      ${createdHtml}
      <div class="ad-actions" style="margin-top:6px;">
        <button class="comment-btn" onclick="openCommentModalForElement(this)">Σχόλιο</button>
        <button class="report-btn" onclick="reportAdPrompt('${ad.objectId}')">🚩 Αναφορά</button>
        <button class="share-btn" onclick="shareOnFacebook('${ad.objectId}')">📤 Κοινή χρήση</button>
        <span class="owner-controls" id="owner-controls-${ad.objectId}"></span>
      </div>
      <div class="comments"></div>
    `;

    // Προσθήκη Edit κουμπιού μόνο αν είσαι ιδιοκτήτης
    const userId = localStorage.getItem('userId');
    if (userId && ad.ownerId && userId === ad.ownerId) {
      const ownerSpan = adDiv.querySelector(`#owner-controls-${ad.objectId}`);
      if (ownerSpan) {
        ownerSpan.innerHTML = `<button class="edit-btn" onclick="startEditAd('${ad.objectId}')">✏️ Επεξεργασία</button>`;
      }
    }

    // Εισάγουμε στο container
    if (prepend && adsContainer) adsContainer.prepend(adDiv);
    else if (adsContainer) adsContainer.appendChild(adDiv);
  }

  // expose global functions (index.html calls openCommentModal etc.)
  window.renderAd = renderAd;

  /* =======================
     Load all ads
     ======================= */
  async function loadAds() {
    try {
      const ads = await Backendless.Data.of("Ads").find({ sortBy: ["created DESC"] });
      // Καθαρίζουμε το container και προσθέτουμε
      if (adsContainer) {
        adsContainer.innerHTML = '';
        ads.forEach(a => renderAd(a, false));
      }
    } catch (err) {
      console.error('Σφάλμα φόρτωσης αγγελιών:', err);
    }
  }

  // expose for use elsewhere
  window.loadAds = loadAds;

  /* =======================
     Επεξεργασία αγγελίας
     ======================= */
  window.startEditAd = async function(objectId) {
    try {
      const ad = await Backendless.Data.of("Ads").findById(objectId);
      if (!ad) { alert('Η αγγελία δεν βρέθηκε.'); return; }
      const userId = localStorage.getItem('userId');
      if (!userId || ad.ownerId !== userId) { alert('Μόνο ο δημιουργός μπορεί να επεξεργαστεί αυτή την αγγελία.'); return; }

      // Γεμίζουμε τη φόρμα με τα στοιχεία
      document.getElementById('category').value = ad.category || '';
      document.getElementById('title').value = ad.title || '';
      document.getElementById('description').value = ad.description || '';
      document.getElementById('location').value = ad.location || '';
      document.getElementById('phone').value = ad.phone || '';
      document.getElementById('price').value = ad.price || '';
      editingObjectId = ad.objectId;

      // Προβολή προϋπαρχουσών εικόνων: θα τις εμφανίσουμε μέσα στο modal (απλό)
      // Το αρχικό HTML δεν έχει preview area — θα το δημιουργήσουμε δυναμικά
      let preview = document.getElementById('imagePreviewContainer');
      if (!preview) {
        preview = document.createElement('div');
        preview.id = 'imagePreviewContainer';
        preview.style.marginTop = '8px';
        const modalContent = adModal.querySelector('.modal-content') || adModal;
        modalContent.appendChild(preview);
      }
      preview.innerHTML = ''; // καθαρισμός
      const urls = ad.imageUrls || (ad.imageUrl ? [ad.imageUrl] : []);
      preview.dataset.urls = JSON.stringify(urls || []);
      urls.forEach((u, idx) => {
        const div = document.createElement('div');
        div.style.display = 'inline-block';
        div.style.marginRight = '8px';
        div.innerHTML = `<img src="${u}" style="max-width:80px; display:block;"><button type="button" onclick="removePreviewImage(${idx})">Διαγραφή</button>`;
        preview.appendChild(div);
      });

      // Άνοιγμα modal (χρησιμοποιούμε τη global openModal αν υπάρχει)
      if (typeof window.openModal === 'function') window.openModal();
      else adModal.style.display = 'flex';
    } catch (err) {
      console.error('startEditAd error:', err);
      alert('Σφάλμα στο άνοιγμα επεξεργασίας. Δες την κονσόλα.');
    }
  };

  // remove preview image during edit -> θα ενημερώσει το datasetUrls στο preview
  window.removePreviewImage = function(index) {
    const preview = document.getElementById('imagePreviewContainer');
    if (!preview) return;
    const urls = safeParseJSON(preview.dataset.urls || '[]');
    if (index < 0 || index >= urls.length) return;
    const removed = urls.splice(index, 1)[0];
    preview.dataset.urls = JSON.stringify(urls);
    // Αφαιρούμε preview UI
    preview.innerHTML = '';
    urls.forEach((u, idx) => {
      const div = document.createElement('div');
      div.style.display = 'inline-block';
      div.style.marginRight = '8px';
      div.innerHTML = `<img src="${u}" style="max-width:80px; display:block;"><button type="button" onclick="removePreviewImage(${idx})">Διαγραφή</button>`;
      preview.appendChild(div);
    });
    // Όταν ο χρήστης πατήσει Αποθήκευση, η νέα λίστα θα συγχωνευτεί με τυχ. νέες uploads
  };

  /* =======================
     Αναφορά (report) — απλό prompt + αποθήκευση Reports στη βάση
     ======================= */
  window.reportAdPrompt = function(objectId) {
    const reason = prompt('Περιγράψτε τον λόγο της αναφοράς:');
    if (!reason) return;
    const reporter = localStorage.getItem('userName') || 'Ανώνυμος';
    const reporterId = localStorage.getItem('userId') || null;
    const reportObj = {
      adId: objectId,
      reason,
      reporter,
      reporterId,
      created: new Date().toISOString()
    };
    Backendless.Data.of("Reports").save(reportObj)
      .then(() => alert('Η αναφορά υποβλήθηκε. Ευχαριστούμε.'))
      .catch(err => {
        console.error('Σφάλμα υποβολής αναφοράς:', err);
        alert('Σφάλμα κατά την αποστολή της αναφοράς.');
      });
  };

  /* =======================
     Share στο Facebook
     ======================= */
  window.shareOnFacebook = function(objectId) {
    try {
      const url = encodeURIComponent(window.location.href.split('#')[0] + '?ad=' + objectId);
      const fb = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      window.open(fb, '_blank', 'noopener');
    } catch (err) {
      console.error('share error:', err);
    }
  };

  /* =======================
     Άνοιγμα modal σχολίων για συγκεκριμένο element
     ======================= */
  window.openCommentModalForElement = function(button) {
    // βρίσκουμε το .ad γονέα
    const adEl = button.closest('.ad');
    if (!adEl) return;
    currentAdElement = adEl;
    // ανοίγουμε το commentModal (το HTML έχει αυτό το modal)
    commentModal.style.display = 'flex';
  };

  // close comment modal (αν υπάρχει close button στο HTML, καλείται ήδη)
  window.closeCommentModal = function() {
    if (commentModal) commentModal.style.display = 'none';
    currentAdElement = null;
    if (commentTextarea) commentTextarea.value = '';
  };

  /* =======================
     Αναζήτηση (εφαρμόζεται σε υπάρχουσες .ad)
     ======================= */
  window.performSearch = function() {
    const qEl = document.getElementById('customSearchInput');
    const catEl = document.getElementById('customSearchCategory');
    const q = qEl ? qEl.value.trim().toLowerCase() : '';
    const cat = catEl ? catEl.value : 'all';
    const items = document.querySelectorAll('.ad');
    items.forEach(item => {
      const text = item.innerText.toLowerCase();
      const itemCat = item.dataset.category || '';
      const inCat = (cat === 'all' || itemCat === cat);
      const matches = !q || text.includes(q);
      item.style.display = (matches && inCat) ? '' : 'none';
    });
  };

  window.clearSearch = function() {
    const qEl = document.getElementById('customSearchInput');
    const catEl = document.getElementById('customSearchCategory');
    if (qEl) qEl.value = '';
    if (catEl) catEl.value = 'all';
    performSearch();
  };

}); // DOMContentLoaded end

/* =======================
   Utilities που χρειάζονται εκτός DOMContentLoaded
   ======================= */

// Εισάγει search bar πάνω από adsContainer χωρίς να αλλάξει το υπάρχον HTML/CSS
function insertSearchBar() {
  const adsContainer = document.getElementById('adsContainer');
  if (!adsContainer) return;
  // αν υπάρχει ήδη (πχ επαναφόρτωση), μην ξαναβάλεις
  if (document.getElementById('customSearchWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'customSearchWrapper';
  wrapper.style.margin = '12px';
  wrapper.style.display = 'flex';
  wrapper.style.gap = '8px';
  wrapper.style.alignItems = 'center';
  wrapper.innerHTML = `
    <input id="customSearchInput" placeholder="Αναζήτηση (τίτλος / περιγραφή / τοποθεσία)" style="flex:1; padding:8px;">
    <select id="customSearchCategory" style="padding:8px;">
      <option value="all">Όλες οι κατηγορίες</option>
      <option value="Ακίνητα">Ακίνητα</option>
      <option value="Αυτοκίνητα">Αυτοκίνητα</option>
      <option value="Επαγγελματικά">Επαγγελματικά</option>
      <option value="Εργασία">Εργασία</option>
      <option value="Άλλο">Άλλο</option>
    </select>
    <button onclick="performSearch()" style="padding:8px;">Αναζήτηση</button>
    <button onclick="clearSearch()" style="padding:8px;">Καθαρισμός</button>
  `;
  adsContainer.parentElement.insertBefore(wrapper, adsContainer);
}

// Upload/remove helpers (διεθνώς διαθέσιμα)
async function uploadFiles(filesArray) {
  if (!filesArray || filesArray.length === 0) return [];
  const arr = Array.from(filesArray).slice(0, MAX_IMAGES);
  const promises = arr.map(f => Backendless.Files.upload(f, "ads-images", true)
    .then(res => {
      if (res && res.fileURL) return res.fileURL;
      if (typeof res === 'string') return res;
      return '';
    })
    .catch(err => {
      console.error('upload error:', err);
      return '';
    })
  );
  const results = await Promise.all(promises);
  return results.filter(Boolean);
}

async function removeFileByUrl(imageUrl) {
  if (!imageUrl) return;
  const idx = imageUrl.indexOf('/files/');
  if (idx === -1) return;
  const filePath = imageUrl.substring(idx + 7);
  try {
    await Backendless.Files.remove(filePath);
    console.log('Removed file:', filePath);
  } catch (err) {
    console.error('removeFile error:', err);
  }
}

/* =======================
   Utility: loadAds (έξω από DOMContentLoaded για δυνατότητα κλήσης)
   ======================= */
async function loadAds() {
  try {
    const ads = await Backendless.Data.of("Ads").find({ sortBy: ["created DESC"] });
    const adsContainer = document.getElementById('adsContainer');
    if (!adsContainer) return;
    adsContainer.innerHTML = '';
    ads.forEach(ad => {
      // 使用 renderAd defined in DOMContentLoaded (exposed to window)
      if (typeof window.renderAd === 'function') window.renderAd(ad, false);
    });
  } catch (err) {
    console.error('loadAds error:', err);
  }
}

/* =======================
   Local login simple UI logic (minimal, χωρίς να αλλάξει HTML)
   ======================= */
function setupLocalLogin() {
  // The original HTML doesn't have explicit login inputs — we'll try to find them:
  const loginName = document.getElementById('loginName');
  const loginEmail = document.getElementById('loginEmail');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const welcomeLabel = document.getElementById('welcomeLabel');

  if (!loginBtn || !welcomeLabel) {
    // maybe the page didn't have login area — in that case do nothing
    return;
  }

  function updateUI() {
    const name = localStorage.getItem('userName');
    if (name) {
      welcomeLabel.textContent = `Σύνδεση ως: ${name}`;
      loginBtn.classList.add('hidden');
      if (logoutBtn) logoutBtn.classList.remove('hidden');
      if (loginName) loginName.style.display = 'none';
      if (loginEmail) loginEmail.style.display = 'none';
    } else {
      welcomeLabel.textContent = 'Επισκέπτης';
      loginBtn.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (loginName) loginName.style.display = '';
      if (loginEmail) loginEmail.style.display = '';
    }
  }

  // ensure userId
  if (!localStorage.getItem('userId')) localStorage.setItem('userId', uuidv4());
  updateUI();

  loginBtn.addEventListener('click', () => {
    const name = (loginName ? loginName.value : '').trim();
    const email = (loginEmail ? loginEmail.value : '').trim();
    if (!name) { alert('Πληκτρολόγησε το όνομά σου για σύνδεση.'); return; }
    localStorage.setItem('userName', name);
    if (email) localStorage.setItem('userEmail', email);
    if (!localStorage.getItem('userId')) localStorage.setItem('userId', uuidv4());
    updateUI();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userName');
      updateUI();
    });
  }
}
/* =======================
   Footer & Contact Modals
   ======================= */
window.openFooterModal = function(type) {
  const modal = document.getElementById('footerModal');
  const content = document.getElementById('footerContent');
  if (!modal || !content) return;

  let html = '';
  if (type === 'privacy') {
    html = `
      <h2>Πολιτική Απορρήτου</h2>
      <p>Η ιστοσελίδα <strong>Kamena Vourla Topic</strong> σέβεται απόλυτα την ιδιωτικότητα και τα προσωπικά σας δεδομένα. 
      Οι πληροφορίες που παρέχετε χρησιμοποιούνται αποκλειστικά για τη λειτουργία των υπηρεσιών μας, όπως 
      η ανάρτηση και διαχείριση αγγελιών.</p>

      <p>Δεν κοινοποιούμε, πωλούμε ή ανταλλάσσουμε προσωπικά δεδομένα με τρίτους, εκτός εάν αυτό απαιτείται από τον νόμο 
      ή είναι απολύτως αναγκαίο για τη λειτουργία της πλατφόρμας.</p>

      <p>Τα δεδομένα που συλλέγονται περιορίζονται στα απολύτως απαραίτητα (όνομα, email, τηλέφωνο και περιεχόμενο αγγελίας). 
      Ο χρήστης έχει δικαίωμα ανά πάσα στιγμή να ζητήσει τη διαγραφή ή τροποποίηση των δεδομένων του.</p>

      <p>Για οποιαδήποτε απορία σχετικά με την Πολιτική Απορρήτου, μπορείτε να επικοινωνήσετε μαζί μας στο 
      <a href="mailto:sotiris.dimitriou.1988@gmail.com">sotiris.dimitriou.1988@gmail.com</a>.</p>

      <p><strong>Η χρήση της ιστοσελίδας συνεπάγεται αποδοχή της παρούσας Πολιτικής Απορρήτου.</strong></p>
    `;
  } else if (type === 'terms') {
    html = `
      <h2>Όροι Χρήσης</h2>
      <p>Με την πρόσβαση και χρήση της ιστοσελίδας <strong>Kamena Vourla Topic</strong> αποδέχεστε τους παρακάτω όρους.</p>

      <ul>
        <li>Απαγορεύεται η ανάρτηση προσβλητικού, παραπλανητικού, ρατσιστικού, ή παράνομου περιεχομένου.</li>
        <li>Ο κάθε χρήστης είναι αποκλειστικά υπεύθυνος για το περιεχόμενο των αγγελιών του.</li>
        <li>Η διαχείριση της ιστοσελίδας διατηρεί το δικαίωμα να αφαιρεί οποιοδήποτε περιεχόμενο χωρίς προειδοποίηση, 
        εάν παραβιάζει τους όρους χρήσης ή τη νομοθεσία.</li>
        <li>Η πλατφόρμα παρέχεται «ως έχει» χωρίς καμία εγγύηση για τη διαθεσιμότητα ή την ακρίβεια των πληροφοριών.</li>
        <li>Η χρήση της ιστοσελίδας συνεπάγεται την αποδοχή όλων των παραπάνω όρων.</li>
      </ul>

      <p>Για οποιαδήποτε διευκρίνιση ή πρόβλημα, μπορείτε να επικοινωνήσετε στο 
      <a href="mailto:sotiris.dimitriou.1988@gmail.com">sotiris.dimitriou.1988@gmail.com</a>.</p>
    `;
  } else if (type === 'contact') {
    html = `
      <h2>Επικοινωνία</h2>
      <p>Είμαστε πάντα διαθέσιμοι για οποιαδήποτε απορία, πρόταση ή τεχνικό ζήτημα που αφορά την ιστοσελίδα 
      <strong>Kamena Vourla Topic</strong>.</p>

      <p>Μπορείτε να επικοινωνήσετε μαζί μας μέσω email στο: 
      <a href="mailto:sotiris.dimitriou.1988@gmail.com">sotiris.dimitriou.1988@gmail.com</a></p>

      <p>Ώρες επικοινωνίας: Δευτέρα έως Παρασκευή, 09:00 – 18:00.</p>
    `;
  }

  content.innerHTML = html;
  modal.style.display = 'flex';
};

window.closeFooterModal = function() {
  const modal = document.getElementById('footerModal');
  if (modal) modal.style.display = 'none';
};

window.openContactModal = function() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.style.display = 'flex';
};
window.closeContactModal = function() {
  const modal = document.getElementById('contactModal');
  if (modal) modal.style.display = 'none';
};

window.openPhonesModal = function() {
  const modal = document.getElementById('phonesModal');
  if (modal) modal.style.display = 'flex';
};
window.closePhonesModal = function() {
  const modal = document.getElementById('phonesModal');
  if (modal) modal.style.display = 'none';
};

/* Κλείσιμο modal όταν κάνεις κλικ εκτός περιεχομένου */
window.addEventListener('click', function(e) {
  document.querySelectorAll('.modal').forEach(m => {
    if (e.target === m) m.style.display = 'none';
  });
});
