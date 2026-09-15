/* Heer Art Gallery — shared front-end behaviour
   No build step: this fetches content/gallery.json directly,
   which is the exact file the admin panel (Decap CMS) edits. */

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initYear();

  const grid = document.getElementById("gallery-grid");
  if (grid) initGallery(grid);

  const preview = document.getElementById("home-preview-grid");
  if (preview) initHomePreview(preview);
});

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

function initYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

async function loadCatalog() {
  const res = await fetch("content/gallery.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load gallery data");
  const data = await res.json();
  return (data.artworks || []).filter((a) => !a.hidden);
}

function formatPrice(item) {
  if (item.pricing_type === "by_size" && Array.isArray(item.sizes) && item.sizes.length) {
    const values = item.sizes.map((s) => Number(s.price)).filter((n) => !isNaN(n));
    if (!values.length) return "Price on request";
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? `₹${min.toLocaleString("en-IN")}` : `From ₹${min.toLocaleString("en-IN")}`;
  }
  if (item.price) return `₹${Number(item.price).toLocaleString("en-IN")}`;
  return "Price on request";
}

function sizeLine(item) {
  if (item.pricing_type === "by_size" && Array.isArray(item.sizes) && item.sizes.length) {
    return item.sizes.map((s) => s.size).filter(Boolean).join(" · ");
  }
  return item.medium || "";
}

const CATEGORY_ICON = {
  Painting: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 6C17 6 6 17 6 30c0 8 5 11 10 11 3 0 4-2 4-4s-2-3-2-6c0-9 8-16 18-16 9 0 15 6 15 13 0 10-8 16-19 16-1.5 0-3-.1-4-.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="20" cy="26" r="2.6" fill="currentColor"/><circle cx="30" cy="18" r="2.6" fill="currentColor"/><circle cx="41" cy="21" r="2.6" fill="currentColor"/><circle cx="46" cy="31" r="2.6" fill="currentColor"/></svg>`,
  "Home Decor": `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 8c9 8 15 15 15 23a15 15 0 1 1-30 0c0-8 6-15 15-23Z" stroke="currentColor" stroke-width="2.2"/><path d="M32 46v10M24 56h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  Gifting: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="26" width="44" height="30" stroke="currentColor" stroke-width="2.2"/><path d="M10 26h44M32 26v30" stroke="currentColor" stroke-width="2.2"/><path d="M32 26c-4-10-20-10-20-1 0 4 8 1 20 1Zm0 0c4-10 20-10 20-1 0 4-8 1-20 1Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
};

function placeholderArt(category) {
  const icon = CATEGORY_ICON[category] || CATEGORY_ICON.Painting;
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);opacity:.55;">${icon.replace("64\" fill", "64\" width=\"56\" height=\"56\" fill")}</div>`;
}

function cardTemplate(item) {
  const img = item.image
    ? `<img src="${item.image}" alt="${item.title}" loading="lazy">`
    : placeholderArt(item.category);

  return `
    <article class="art-card" data-category="${item.category}">
      <div class="art-frame">
        ${item.sold ? '<span class="sold-badge">Sold</span>' : ""}
        ${img}
      </div>
      <div class="art-info">
        <div class="art-cat">${item.category}</div>
        <h3>${item.title}</h3>
        <div class="art-meta">${sizeLine(item)}</div>
        <div class="art-price">${item.sold ? "Sold" : formatPrice(item)}</div>
        <a class="art-enquire" href="https://www.instagram.com/heer.artgallery" target="_blank" rel="noopener">Enquire on Instagram</a>
      </div>
    </article>`;
}

async function initGallery(grid) {
  grid.innerHTML = `<p style="color:var(--ink-soft)">Loading the gallery…</p>`;
  let items = [];
  try {
    items = await loadCatalog();
  } catch (e) {
    grid.innerHTML = `<div class="empty-state">The gallery couldn't be loaded right now. Please refresh, or reach out on Instagram.</div>`;
    return;
  }

  const params = new URLSearchParams(location.search);
  let activeCategory = params.get("category") || "All";

  const filterRow = document.getElementById("filter-row");
  const categories = ["All", "Painting", "Home Decor", "Gifting"];

  function render() {
    const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);
    grid.innerHTML = filtered.length
      ? filtered.map(cardTemplate).join("")
      : `<div class="empty-state">No pieces in this category yet — new work is added regularly, check back soon.</div>`;

    if (filterRow) {
      [...filterRow.querySelectorAll(".filter-btn")].forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.category === activeCategory);
      });
    }
  }

  if (filterRow) {
    filterRow.innerHTML = categories
      .map((c) => `<button class="filter-btn${c === activeCategory ? " active" : ""}" data-category="${c}">${c}</button>`)
      .join("");
    filterRow.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      activeCategory = btn.dataset.category;
      render();
    });
  }

  render();
}

async function initHomePreview(grid) {
  grid.innerHTML = "";
  let items = [];
  try {
    items = await loadCatalog();
  } catch (e) {
    return;
  }
  const featured = items.slice(0, 3);
  grid.innerHTML = featured.length
    ? featured.map(cardTemplate).join("")
    : `<div class="empty-state">New paintings are added here as soon as they're framed.</div>`;
}
