// ============ SETTINGS (the only part you normally edit) ============
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTqTKyebVGjmmHyliQ9FNPBBqU3CC7hKgeiQm9tt3gYE4EFrXivCvSd2MNM5F-syrNeYTTt96ZFrlQ-/pub?output=csv";
const WHATSAPP_NUMBER = "919875496874";
const PRODUCT_IMAGE_FOLDER = "images/";
const REVIEW_IMAGE_FOLDER = "images/reviews/";
const REVIEWS = [];   // later: ["review1.jpg", "review2.jpg"]
const SOLD_WORDS = ["yes", "true", "1", "sold"];

// ============ PAGE ELEMENTS ============
const list = document.getElementById("product-list");
const reviewSection = document.getElementById("reviews");
const reviewList = document.getElementById("review-list");
const lightbox = document.getElementById("lightbox");
const lbImage = document.getElementById("lb-img");

let products = [];

// ============ HELPERS ============

// Makes text from the sheet safe to show on the page
function esc(text) {
  return String(text).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

// Full links (https://...) are used as they are; plain file names get the folder added
function imagePath(file, folder) {
  return file.startsWith("https://") ? file : folder + file;
}

// Turns the CSV text from Google Sheets into rows of cells
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ============ LOAD PRODUCTS FROM THE SHEET ============
async function loadProducts() {
  list.innerHTML = "<p>Loading our collection...</p>";
  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error("Could not load sheet");
    const rows = parseCSV(await res.text());
    const head = rows[0].map(h => h.trim().toLowerCase());

    products = rows.slice(1).map(r => {
      const get = key => (r[head.indexOf(key)] || "").trim();
      return {
        name: get("name"),
        price: get("price"),
        sizes: get("sizes"),
        description: get("description"),
        sold: SOLD_WORDS.includes(get("sold").toLowerCase()),
        images: ["image1", "image2", "image3"]
          .map(get)
          .filter(Boolean)
          .map(file => imagePath(file, PRODUCT_IMAGE_FOLDER))
      };
    }).filter(p => p.name && p.images.length);

    renderProducts();
  } catch (err) {
    list.innerHTML = "<p>Couldn't load the collection right now. Please refresh, or message us on WhatsApp.</p>";
  }
}

// ============ DRAW THE CARDS ============
function renderProducts() {
  if (!products.length) {
    list.innerHTML = "<p>New pieces are coming soon!</p>";
    return;
  }

  list.innerHTML = products.map((product, index) => {
    const message = encodeURIComponent(`Hi, I'd like to order: ${product.name}`);
    const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;

    const thumbs = product.images.length > 1
      ? `<div class="thumbs">${product.images.map((src, i) =>
          `<img src="${esc(src)}" alt="${esc(product.name)} photo ${i + 1}" data-photo="${i}" loading="lazy">`
        ).join("")}</div>`
      : "";

    const sizes = product.sizes ? `<p class="sizes">Sizes: ${esc(product.sizes)}</p>` : "";
    const desc = product.description ? `<p class="desc">${esc(product.description)}</p>` : "";

    const button = product.sold
      ? `<span class="sold-btn">Sold out</span>`
      : `<a href="${link}" target="_blank" rel="noopener">Order on WhatsApp</a>`;

    return `
      <div class="card${product.sold ? " sold" : ""}" data-product="${index}">
        ${product.sold ? '<span class="sold-badge">Sold</span>' : ""}
        <img class="main-img" src="${esc(product.images[0])}" alt="${esc(product.name)}" data-photo="0" loading="lazy">
        ${thumbs}
        <h3>${esc(product.name)}</h3>
        <p>₹${esc(product.price)}</p>
        ${sizes}
        ${desc}
        ${button}
      </div>
    `;
  }).join("");

  setupReveal();
}

// One click listener for every card (no inline onclick needed)
list.addEventListener("click", e => {
  const img = e.target.closest("img");
  const card = img && img.closest(".card");
  if (!card) return;

  const main = card.querySelector(".main-img");
  if (img.closest(".thumbs")) {
    // Thumbnail clicked: swap the big photo
    main.src = img.src;
    main.dataset.photo = img.dataset.photo;
  } else if (img === main) {
    // Big photo clicked: open the viewer on the photo being shown
    openLightbox(products[card.dataset.product].images, Number(main.dataset.photo));
  }
});

// ============ REVIEWS ============
function renderReviews() {
  if (!REVIEWS.length || !reviewSection || !reviewList) return;

  const paths = REVIEWS.map(file => imagePath(file, REVIEW_IMAGE_FOLDER));
  reviewList.innerHTML = paths.map((src, i) =>
    `<img src="${esc(src)}" alt="Customer review ${i + 1}" data-index="${i}" loading="lazy">`
  ).join("");
  reviewSection.hidden = false;

  reviewList.addEventListener("click", e => {
    const img = e.target.closest("img");
    if (img) openLightbox(paths, Number(img.dataset.index));
  });

  setupReveal();
}

// ============ PHOTO VIEWER (LIGHTBOX) ============
let lbImages = [];
let lbIndex = 0;

function openLightbox(images, start = 0) {
  if (!lightbox) return;
  lbImages = images;
  lbIndex = start;
  lightbox.classList.toggle("single", images.length < 2);
  showLightbox();
  lightbox.classList.add("open");
}

function showLightbox() {
  lbImage.src = lbImages[lbIndex];
}

function moveLightbox(step) {
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length;
  showLightbox();
}

function closeLightbox() {
  lightbox.classList.remove("open");
}

if (lightbox) {
  lightbox.querySelector(".lb-close").onclick = closeLightbox;
  lightbox.querySelector(".lb-prev").onclick = () => moveLightbox(-1);
  lightbox.querySelector(".lb-next").onclick = () => moveLightbox(1);

  // Click on the dark area closes it
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard: Esc and arrow keys
  document.addEventListener("keydown", e => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") moveLightbox(-1);
    if (e.key === "ArrowRight") moveLightbox(1);
  });

  // Swipe on phones
  let touchStartX = 0;
  lightbox.addEventListener("touchstart", e => {
    touchStartX = e.changedTouches[0].screenX;
  });
  lightbox.addEventListener("touchend", e => {
    const diff = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(diff) > 50) moveLightbox(diff > 0 ? -1 : 1);
  });
}

// ============ SCROLL REVEAL ============
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

function setupReveal() {
  document.querySelectorAll("#about, #reviews, .social-links, .card").forEach((el, i) => {
    if (el.classList.contains("reveal")) return;
    el.classList.add("reveal");
    el.style.setProperty("--d", `${(i % 5) * 0.08}s`);
    revealObserver.observe(el);
  });
}

// ============ START ============
setupReveal();
renderReviews();
loadProducts();