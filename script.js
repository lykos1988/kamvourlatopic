// Αρχικοποίηση Backendless
Backendless.initApp(
  "8BCC68CF-12AA-4F64-A2DF-D6FD92100D8C",
  "6E2644FF-7C10-4AA1-98FB-F3F49CC325D7"
);

// Dropdown menu toggle
function toggleMenu() {
  document.getElementById("menu").classList.toggle("hidden");
}

// Κλείσιμο dropdown όταν κάνουμε click έξω
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      if (!dropdowns[i].classList.contains("hidden")) {
        dropdowns[i].classList.add("hidden");
      }
    }
  }
};

// Filter αγγελιών
function filterAds(category) {
  const ads = document.querySelectorAll(".ad");
  ads.forEach(ad => {
    if (category === "all" || ad.dataset.category === category) {
      ad.style.display = "block";
    } else {
      ad.style.display = "none";
    }
  });
  toggleMenu();
}

// ----- Modal Αγγελίας -----
const adModal = document.getElementById("adModal");
function openModal() {
  adModal.style.display = "flex";
}
function closeModal() {
  adModal.style.display = "none";
  document.getElementById("adForm").reset();
}

// Καταχώρηση νέας αγγελίας
document.getElementById("adForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const category = document.getElementById("category").value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const location = document.getElementById("location").value;
  const phone = document.getElementById("phone").value;
  const price = document.getElementById("price").value;
  const imageInput = document.getElementById("image");
  const imageUrl = document.getElementById("imageUrl") ? document.getElementById("imageUrl").value.trim() : "";

  let newAd = {
    category,
    title,
    description,
    location,
    phone,
    price: Number(price)
  };

  // Ανέβασμα εικόνας είτε από συσκευή είτε από URL
  if (imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    Backendless.Files.upload(file, "ads-images", true)
      .then(uploadedFile => {
        newAd.imageUrl = uploadedFile.fileURL;
        saveAd(newAd);
      })
      .catch(err => console.error("Σφάλμα ανεβάσματος:", err));
  } else if (imageUrl) {
    newAd.imageUrl = imageUrl;
    saveAd(newAd);
  } else {
    saveAd(newAd);
  }
});

// Αποθήκευση αγγελίας στη βάση
function saveAd(adObj) {
  Backendless.Data.of("Ads").save(adObj)
    .then(saved => {
      console.log("Αγγελία αποθηκεύτηκε:", saved);
      renderAd(saved, true);
      closeModal();
    })
    .catch(err => console.error("Σφάλμα αποθήκευσης:", err));
}

// Εμφάνιση αγγελίας στη σελίδα (διορθωμένη εκδοχή)
function renderAd(ad, prepend = false) {
  const adContainer = document.getElementById("adsContainer");
  const adDiv = document.createElement("div");
  adDiv.classList.add("ad");
  adDiv.dataset.category = ad.category;
  adDiv.dataset.id = ad.objectId;     
  adDiv.dataset.imageUrl = ad.imageUrl || ""; 

  const verifiedHtml = ad.verified ? `<span class="verified-badge">Εγκεκριμένη</span>` : "";

  adDiv.innerHTML = `
    ${ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}">` : ""}
    <h3>${ad.title} ${verifiedHtml}</h3>
    <p>${ad.description}</p>
    <p><strong>Τοποθεσία:</strong> ${ad.location}</p>
    <p><strong>Τηλέφωνο:</strong> ${ad.phone}</p>
    <p><strong>Τιμή:</strong> ${ad.price} €</p>
    <button class="comment-btn" onclick="openCommentModal(this)">Σχόλιο</button>
    <div class="comments"></div>
  `;

  if (prepend) {
    adContainer.prepend(adDiv);
  } else {
    adContainer.appendChild(adDiv);
  }
}

// ----- Modal Σχολίων -----
let currentAd = null;

function openCommentModal(button) {
  currentAd = button.closest(".ad");
  document.getElementById("commentModal").style.display = "flex";
}

function closeCommentModal() {
  document.getElementById("commentModal").style.display = "none";
  document.getElementById("commentText").value = "";
}

document.getElementById("commentForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const text = document.getElementById("commentText").value.trim();

  if (!currentAd) return;

  // Αν το σχόλιο περιέχει τη λέξη DELETE -> διαγράφουμε την αγγελία και από DB + εικόνα
  if (text.toUpperCase().includes("DELETE")) {
    const objectId = currentAd.dataset.id;
    const imageUrl = currentAd.dataset.imageUrl;

    if (objectId) {
      Backendless.Data.of("Ads").remove({ objectId })
        .then(() => {
          console.log("Αγγελία διαγράφηκε από τη βάση");

          // Αν υπάρχει εικόνα -> σβήνουμε και από File Storage
          if (imageUrl) {
            const filePath = imageUrl.split("/files/")[1]; 
            if (filePath) {
              Backendless.Files.remove(filePath)
                .then(() => console.log("Εικόνα διαγράφηκε:", filePath))
                .catch(err => console.error("Σφάλμα διαγραφής εικόνας:", err));
            }
          }

          currentAd.remove();
        })
        .catch(err => console.error("Σφάλμα διαγραφής αγγελίας:", err));
    } else {
      currentAd.remove();
    }
  } else {
    const commentBox = currentAd.querySelector(".comments");
    const p = document.createElement("p");
    p.textContent = text;
    commentBox.appendChild(p);
  }

  closeCommentModal();
});

// ----- Modal Footer -----
function openFooterModal(type) {
  const modal = document.getElementById("footerModal");
  const content = document.getElementById("footerContent");

  if (type === "privacy") {
    content.innerHTML = `
      <h2>Πολιτική Απορρήτου</h2>
      <p>Η προστασία των προσωπικών σας δεδομένων είναι πολύ σημαντική για εμάς. 
      Συλλέγουμε μόνο τις απολύτως απαραίτητες πληροφορίες που μας παρέχετε κατά τη χρήση της πλατφόρμας.</p>
      <p>Τα δεδομένα (π.χ. όνομα, τηλέφωνο, τοποθεσία αγγελίας) χρησιμοποιούνται αποκλειστικά για την εμφάνιση της αγγελίας 
      και δεν κοινοποιούνται σε τρίτους χωρίς τη συγκατάθεσή σας.</p>
      <p>Μπορείτε οποιαδήποτε στιγμή να ζητήσετε τη διαγραφή της αγγελίας ή των στοιχείων σας.</p>
    `;
  } else if (type === "terms") {
    content.innerHTML = `
      <h2>Όροι Χρήσης</h2>
      <p>Η χρήση της πλατφόρμας συνεπάγεται την αποδοχή των παρακάτω όρων:</p>
      <ul>
        <li>Οι αγγελίες πρέπει να είναι αληθείς και να μην παραπλανούν.</li>
        <li>Απαγορεύεται η ανάρτηση περιεχομένου προσβλητικού, παράνομου ή άσχετου.</li>
        <li>Η πλατφόρμα δεν φέρει ευθύνη για τις συναλλαγές μεταξύ χρηστών.</li>
        <li>Διατηρούμε το δικαίωμα να αφαιρούμε αγγελίες που παραβιάζουν τους όρους.</li>
      </ul>
      <p>Συνιστούμε προσοχή στις συναλλαγές και επαλήθευση στοιχείων πριν από οποιαδήποτε συμφωνία.</p>
    `;
  } else if (type === "contact") {
    content.innerHTML = `
      <h2>Επικοινωνία</h2>
      <p>Αν έχετε ερωτήσεις ή χρειάζεστε υποστήριξη, μπορείτε να επικοινωνήσετε μαζί μας:</p>
      <p>Email: sotiris.dimitriou.1988@gmail.com<br>Τηλέφωνο:-</p>
    `;
  }

  modal.style.display = "flex";
}

function closeFooterModal() {
  document.getElementById("footerModal").style.display = "none";
}

// Κλείσιμο modal με κλικ έξω
window.addEventListener("click", function(e) {
  if (e.target === adModal) closeModal();
  if (e.target === document.getElementById("commentModal")) closeCommentModal();
  if (e.target === document.getElementById("footerModal")) closeFooterModal();
});

// ----- Ανάκτηση αγγελιών στην εκκίνηση -----
document.addEventListener("DOMContentLoaded", function() {
  Backendless.Data.of("Ads").find()
    .then(ads => {
      const adContainer = document.getElementById("adsContainer");
      adContainer.innerHTML = "";
      ads.forEach(ad => renderAd(ad));
    })
    .catch(err => console.error("Σφάλμα φόρτωσης αγγελιών:", err));
});

// --- Modal Επικοινωνίας ---
function openContactModal() {
  const m = document.getElementById("contactModal");
  if (m) m.style.display = "flex";
}
function closeContactModal() {
  const m = document.getElementById("contactModal");
  if (m) m.style.display = "none";
}

// Υποβολή φόρμας επικοινωνίας
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("contactName").value.trim();
    const msg = document.getElementById("contactMsg").value.trim();
    if (!name || !msg) { alert("Συμπληρώστε όλα τα πεδία."); return; }

    try {
      await Backendless.Data.of("Contacts").save({ name, message: msg, created: new Date() });
      alert("Το μήνυμά σας εστάλη!");
      contactForm.reset();
      closeContactModal();
    } catch {
      alert("Σφάλμα αποστολής. Προσπαθήστε ξανά.");
    }
  });
}

// --- Modal Χρήσιμα Τηλέφωνα ---
function openPhonesModal() {
  const m = document.getElementById("phonesModal");
  if (m) m.style.display = "flex";
}
function closePhonesModal() {
  const m = document.getElementById("phonesModal");
  if (m) m.style.display = "none";
}

// Κλείσιμο modal με κλικ έξω
window.addEventListener("click", (e) => {
  if (e.target.id === "contactModal") closeContactModal();
  if (e.target.id === "phonesModal") closePhonesModal();
});
