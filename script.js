// 1. Αρχικοποίηση Δεδομένων (Μία φορά μόνο)
let ads = JSON.parse(localStorage.getItem('kv_ads')) || [];
let phones = JSON.parse(localStorage.getItem('kv_phones')) || {
    municipality: "22353 50037",
    police: "22350 22222",
    health: "22353 50000"
};
let currentImageData = "";
let currentViewAdId = null;
let logoClicks = 0;

const legalTexts = {
    about: {
        title: "Σχετικά με το Kamena Vourla Topic",
        content: `
            <p>Η πλατφόρμα μας δημιουργήθηκε με όραμα τον εκσυγχρονισμό της τοπικής επικοινωνίας στα Καμένα Βούρλα. Είμαστε μια ανεξάρτητη πρωτοβουλία που στοχεύει στη δωρεάν παροχή υπηρεσιών αγγελιών και ενημέρωσης.</p>
            <p>Εδώ μπορείτε να βρείτε από θέσεις εργασίας μέχρι ενοικιάσεις κατοικιών, ενισχύοντας την τοπική οικονομία και την αλληλεγγύη μεταξύ των συμπολιτών μας.</p>`
    },
    privacy: {
        title: "Πολιτική Απορρήτου & GDPR",
        content: `
            <p>Η ασφάλεια των δεδομένων σας είναι προτεραιότητά μας. Συλλέγουμε μόνο τα απαραίτητα στοιχεία για τη δημοσίευση των αγγελιών σας (όνομα, τηλέφωνο).</p>
            <ul>
                <li>Δεν μοιραζόμαστε τα στοιχεία σας με διαφημιστικές εταιρείες.</li>
                <li>Έχετε το δικαίωμα διαγραφής της αγγελίας σας ανά πάσα στιγμή.</li>
                <li>Χρησιμοποιούμε localStorage για την ταχύτερη εμπειρία σας χωρίς εξωτερικούς servers.</li>
            </ul>`
    },
    terms: {
        title: "Όροι Χρήσης Πλατφόρμας",
        content: `
            <p>Χρησιμοποιώντας την ιστοσελίδα, συμφωνείτε με τους κάτωθι κανόνες:</p>
            <ul>
                <li>Απαγορεύονται οι ψευδείς ή παραπλανητικές αγγελίες.</li>
                <li>Το περιεχόμενο πρέπει να είναι κόσμιο και σύμφωνο με το νόμο.</li>
                <li>Η διαχείριση διατηρεί το δικαίωμα αφαίρεσης περιεχομένου που κρίνεται ακατάλληλο.</li>
            </ul>`
    },
    cookies: {
        title: "Πολιτική Cookies",
        content: "<p>Η σελίδα χρησιμοποιεί μόνο τεχνικά απαραίτητα cookies για τη σωστή λειτουργία της προβολής των αγγελιών και την αποθήκευση των προτιμήσεών σας.</p>"
    },
    faq: {
        title: "Συχνές Ερωτήσεις (FAQ)",
        content: `
            <div style="text-align:left;">
                <strong>Πώς ανεβάζω αγγελία;</strong><p>Πατήστε το κουμπί "+" και συμπληρώστε τη φόρμα.</p>
                <strong>Είναι δωρεάν;</strong><p>Ναι, η χρήση της πλατφόρμας είναι εντελώς δωρεάν για όλους.</p>
                <strong>Πώς διαγράφω μια αγγελία;</strong><p>Επικοινωνήστε με τον διαχειριστή ή χρησιμοποιήστε τον ειδικό κωδικό αν είστε ο κάτοχος.</p>
            </div>`
    },
    contact: { 
        title: "Επικοινωνία", 
        content: `
            <p>Είμαστε εδώ για να σας βοηθήσουμε!</p>
            <p><strong>Email:</strong> support@kamenavourlatopic.gr</p>
            <p><strong>Facebook:</strong> Kamena Vourla Topic Group</p>
            <p>Ωράριο Υποστήριξης: Δευτέρα - Παρασκευή, 09:00 - 17:00</p>` 
    },
    phones: { 
        title: "📞 Τηλέφωνα Ανάγκης & Υπηρεσιών", 
        content: `
            <div class="phone-list">
                <div class="phone-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <strong>🏛️ Δήμος:</strong> <span>22353 50037</span>
                </div>
                <div class="phone-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                    <strong>🚓 Αστυνομία:</strong> <span>22350 22222</span>
                </div>
                <div class="phone-item" style="display:flex; justify-content:space-between; padding:10px;">
                    <strong>🏥 Κέντρο Υγείας:</strong> <span>22353 50000</span>
                </div>
            </div>` 
    }
};

document.addEventListener('DOMContentLoaded', () => {
    renderAds();
    
    // Φόρμα Αγγελίας
    const adForm = document.getElementById('adForm');
    if (adForm) {
        adForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newAd = {
                id: Date.now(),
                category: document.getElementById('category').value,
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                price: document.getElementById('price').value,
                phone: document.getElementById('phone').value,
                image: currentImageData || "https://via.placeholder.com/300x200?text=No+Image",
                comments: []
            };
            ads.unshift(newAd);
            saveAndRefresh();
            closeModal('adModal');
            adForm.reset();
            document.getElementById('imagePreview').innerHTML = "<span>Προσθήκη Φωτογραφίας</span>";
            currentImageData = "";
        });
    }

    // 5 Κλικ στο Logo για Admin
    const logo = document.querySelector('.main-logo');
    if(logo) {
        logo.addEventListener('click', () => {
            logoClicks++;
            if (logoClicks === 5) {
                const pass = prompt("Κωδικός Διαχειριστή:");
                if (pass === "20251414") openAdminPanel();
                else alert("Πρόσβαση μη εξουσιοδοτημένη.");
                logoClicks = 0;
            }
            setTimeout(() => logoClicks = 0, 3000);
        });
    }

    // ESC Key για κλείσιμο modal
    document.addEventListener('keydown', (e) => { if (e.key === "Escape") closeAllModals(); });
});

// --- ΣΥΝΑΡΤΗΣΕΙΣ ΕΜΦΑΝΙΣΗΣ ---
function renderAds(data = ads) {
    const container = document.getElementById('adsContainer');
    if (!container) return;
    if(data.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; opacity: 0.5;">Δεν υπάρχουν αγγελίες.</p>`;
        return;
    }
    container.innerHTML = data.map(ad => `
        <div class="ad-card" onclick="viewFullAd(${ad.id})">
            <img src="${ad.image}" class="ad-card-image">
            <span class="category-tag">${ad.category}</span>
            <h3 style="margin: 10px 0;">${ad.title}</h3>
            <p>${ad.description.substring(0, 80)}...</p>
            <div class="ad-meta">
                <span class="price">${ad.price} €</span>
                <span class="phone">📞 ${ad.phone}</span>
            </div>
        </div>
    `).join('');
}

function viewFullAd(id) {
    const ad = ads.find(a => a.id === id);
    if(!ad) return;
    currentViewAdId = id;
    document.getElementById('viewAdTitle').innerText = ad.title;
    document.getElementById('viewAdImage').src = ad.image;
    document.getElementById('viewAdCategory').innerText = ad.category;
    document.getElementById('viewAdDescription').innerText = ad.description;
    document.getElementById('viewAdPrice').innerText = ad.price + " €";
    document.getElementById('viewAdPhone').innerText = "📞 " + ad.phone;
    renderComments(ad.comments || []);
    openModal('viewAdModal');
}

// --- ΣΧΟΛΙΑ & ΔΙΑΓΡΑΦΗ ΜΕ ΚΩΔΙΚΟ ---
function renderComments(comments) {
    const list = document.getElementById('commentsList');
    list.innerHTML = comments.length ? comments.map((c, index) => `
        <div class="comment-item">
            <div style="display:flex; justify-content:space-between;">
                <small><strong>${c.user}</strong> • ${c.date}</small>
                <button onclick="deleteComment(${index})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:10px;">Διαγραφή</button>
            </div>
            <p style="margin-top:5px;">${c.text}</p>
        </div>
    `).join('') : "<p style='font-size:0.8rem; opacity:0.5;'>Κανένα σχόλιο ακόμα.</p>";
}

function addComment() {
    const name = document.getElementById('commentName').value;
    const text = document.getElementById('commentText').value;
    
    if(!name || !text) return alert("Παρακαλώ συμπληρώστε όνομα και σχόλιο.");

    // ΕΛΕΓΧΟΣ ΓΙΑ ΔΙΑΓΡΑΦΗ ΑΓΓΕΛΙΑΣ
    // Αν το κείμενο του σχολίου είναι ο κωδικός "deletetopic"
    if (text.trim() === "deletetopic") {
        if (confirm("Προσοχή: Εισάγατε τον κωδικό διαγραφής. Θέλετε να διαγράψετε ολόκληρη την αγγελία;")) {
            // Φιλτράρουμε τις αγγελίες και κρατάμε όλες εκτός από αυτή που βλέπουμε
            ads = ads.filter(a => a.id !== currentViewAdId);
            saveAndRefresh(); // Αποθήκευση στο localStorage και ανανέωση λίστας
            closeModal('viewAdModal'); // Κλείσιμο του παραθύρου της αγγελίας
            alert("Η αγγελία διαγράφηκε επιτυχώς.");
            return; // Σταματάμε εδώ, δεν προσθέτουμε σχόλιο
        }
    }

    // ΚΑΝΟΝΙΚΗ ΠΡΟΣΘΗΚΗ ΣΧΟΛΙΟΥ (αν δεν είναι ο κωδικός)
    const adIndex = ads.findIndex(a => a.id === currentViewAdId);
    if(!ads[adIndex].comments) ads[adIndex].comments = [];
    
    ads[adIndex].comments.push({
        user: name,
        text: text,
        date: new Date().toLocaleDateString('el-GR')
    });

    saveAndRefresh();
    renderComments(ads[adIndex].comments);
    
    // Καθαρισμός πεδίων
    document.getElementById('commentName').value = "";
    document.getElementById('commentText').value = "";
}

function deleteComment(index) {
    if (prompt("Εισάγετε τον κωδικό διαγραφής:") === "deletetopic") {
        const adIndex = ads.findIndex(a => a.id === currentViewAdId);
        ads[adIndex].comments.splice(index, 1);
        saveAndRefresh();
        renderComments(ads[adIndex].comments);
    } else {
        alert("Λάθος κωδικός!");
    }
}

// --- ΛΟΙΠΕΣ ΛΕΙΤΟΥΡΓΙΕΣ ---
function saveAndRefresh() {
    localStorage.setItem('kv_ads', JSON.stringify(ads));
    renderAds();
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none'); }

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = () => {
        document.getElementById('imagePreview').innerHTML = `<img src="${reader.result}">`;
        currentImageData = reader.result;
    };
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

function openLegalModal(type) {
    if(type === 'phones') {
        legalTexts.phones.content = `
            <div class="phone-list">
                <div class="phone-item"><strong>🏛️ Δήμος:</strong> <span>${phones.municipality}</span></div>
                <div class="phone-item"><strong>🚓 Αστυνομία:</strong> <span>${phones.police}</span></div>
                <div class="phone-item"><strong>🏥 Υγεία:</strong> <span>${phones.health}</span></div>
            </div>`;
    }
    document.getElementById('legalTitle').innerText = legalTexts[type].title;
    document.getElementById('legalContent').innerHTML = legalTexts[type].content;
    openModal('legalModal');
}

function filterAds() {
    const term = document.getElementById('mainSearch').value.toLowerCase();
    renderAds(ads.filter(a => a.title.toLowerCase().includes(term) || a.description.toLowerCase().includes(term)));
}

function filterCategory(cat) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    renderAds(cat === 'all' ? ads : ads.filter(a => a.category === cat));
}

// --- ADMIN ---
function openAdminPanel() {
    document.getElementById('p_mun').value = phones.municipality;
    document.getElementById('p_pol').value = phones.police;
    document.getElementById('p_hea').value = phones.health;
    renderAdminAdsList();
    openModal('adminModal');
}

function renderAdminAdsList() {
    const list = document.getElementById('adminAdsList');
    list.innerHTML = ads.map(ad => `
        <div class="admin-ad-item">
            <span>${ad.title}</span>
            <button onclick="deleteAd(${ad.id})" class="delete-btn">🗑️</button>
        </div>
    `).join('');
}

function deleteAd(id) {
    if(confirm("Διαγραφή αγγελίας;")) {
        ads = ads.filter(a => a.id !== id);
        saveAndRefresh();
        renderAdminAdsList();
    }
}

function savePhones() {
    phones = {
        municipality: document.getElementById('p_mun').value,
        police: document.getElementById('p_pol').value,
        health: document.getElementById('p_hea').value
    };
    localStorage.setItem('kv_phones', JSON.stringify(phones));
    alert("Ενημερώθηκε!");
}