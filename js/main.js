/* لوبارنيز كافيه — interactions */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const CFG = window.LE_BARNIES || {};
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toAr = (n) => Number(n).toLocaleString("ar-EG");

function itemsLabel(n) {
  if (n === 1) return "صنف واحد";
  if (n === 2) return "صنفان";
  if (n >= 3 && n <= 10) return `${toAr(n)} أصناف`;
  return `${toAr(n)} صنفًا`;
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- contact links from config ---------- */
function waLink(text) {
  const num = (CFG.whatsapp || "").replace(/\D/g, "");
  const base = "https://wa.me/" + num;
  return text ? base + "?text=" + encodeURIComponent(text) : base;
}
$$("[data-contact]").forEach((el) => {
  if (el.dataset.contact === "whatsapp") el.href = waLink("");
  if (el.dataset.contact === "phone") {
    el.href = "tel:" + (CFG.phoneTel || "").replace(/\s/g, "");
    if (CFG.phoneDisplay) el.textContent = CFG.phoneDisplay;
  }
});

/* ---------- branch search ---------- */
const searchToggle = $("#branchSearchToggle");
const searchPanel = $("#branchSearchPanel");
const branchSearch = $("#branchSearch");
if (searchToggle && searchPanel) {
  searchToggle.addEventListener("click", () => {
    const open = !searchPanel.classList.contains("open");
    searchPanel.classList.toggle("open", open);
    searchToggle.setAttribute("aria-expanded", String(open));
    if (open && branchSearch) setTimeout(() => branchSearch.focus(), 20);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".nav-tools")) {
      searchPanel.classList.remove("open");
      searchToggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchPanel.classList.remove("open");
      searchToggle.setAttribute("aria-expanded", "false");
      const nl = $("#navLinks");
      const mt = $("#mobileToggle");
      if (nl) nl.classList.remove("open");
      if (mt) mt.setAttribute("aria-expanded", "false");
    }
  });
}

/* ---------- header state ---------- */
const header = document.querySelector(".site-header");
if (header) {
  const sync = () => header.classList.toggle("scrolled", scrollY > 30);
  addEventListener("scroll", sync, { passive: true });
  sync();
}

/* ---------- scroll spy ---------- */
const spySections = ["top", "story", "menu", "locations", "gallery", "why", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const navAs = [...document.querySelectorAll("#navLinks a")];
if ("IntersectionObserver" in window && spySections.length) {
  const spy = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting) {
          navAs.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id)
          );
        }
      }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  spySections.forEach((s) => spy.observe(s));
}

/* ---------- mobile nav ---------- */
const nav = $("#navLinks");
const mobileToggle = $("#mobileToggle");
if (nav && mobileToggle) {
  mobileToggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open);
    mobileToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      mobileToggle.setAttribute("aria-expanded", "false");
    })
  );
}
$$('a[href="#top"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    if (nav) nav.classList.remove("open");
    const mt = $("#mobileToggle");
    if (mt) mt.setAttribute("aria-expanded", "false");
    navAs.forEach((x) => x.classList.toggle("active", x.getAttribute("href") === "#top"));
  })
);

/* ---------- branches filter ---------- */
function filterBranches(q) {
  const term = (q || "").trim().toLowerCase();
  let count = 0;
  $$(".branch-card").forEach((card) => {
    const match =
      !term ||
      (card.dataset.search || "").toLowerCase().includes(term) ||
      card.textContent.toLowerCase().includes(term);
    card.hidden = !match;
    if (match) count++;
  });
  const nb = $("#noBranchResults");
  const sh = $("#searchHint");
  if (nb) nb.hidden = count > 0;
  if (sh)
    sh.textContent = term
      ? count
        ? `وجدنا ${toAr(count)} فروع مطابقة`
        : "لا توجد نتائج مطابقة"
      : "اختار منطقة لعرض الفروع";
}
if (branchSearch) {
  let dt;
  branchSearch.addEventListener("input", () => {
    clearTimeout(dt);
    dt = setTimeout(() => filterBranches(branchSearch.value), 150);
  });
  branchSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchPanel) searchPanel.classList.remove("open");
      const l = $("#locations");
      if (l) l.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}
const sab = $("#showAllBranches");
if (sab)
  sab.addEventListener("click", (e) => {
    e.preventDefault();
    if (branchSearch) {
      branchSearch.value = "";
      filterBranches("");
    }
  });

/* ---------- menu filter ---------- */
const totalMenu = $$(".menu-card").length;
const totalDrinks = $$('.menu-card[data-category="hot"],.menu-card[data-category="cold"]').length;
let currentFilter = "all";

function setFilter(filter, scroll = false) {
  currentFilter = filter;
  let visible = 0;
  $$(".menu-card").forEach((card, i) => {
    const show =
      filter === "all" ||
      card.dataset.category === filter ||
      (filter === "drinks" && ["hot", "cold"].includes(card.dataset.category));
    card.hidden = !show;
    if (show) {
      visible++;
      card.style.animation = "none";
      void card.offsetWidth;
      card.style.animation = `card-enter .34s ${Math.min(i, 5) * 0.025}s both`;
    }
  });
  $$(".menu-tab").forEach((b) => {
    const active = b.dataset.filter === filter;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  const ms = $("#menuStatus");
  if (ms)
    ms.innerHTML =
      filter === "all"
        ? `القائمة تضم <strong>${toAr(totalMenu)} صنفًا</strong>؛ ${toAr(totalDrinks)} مشروبات من إجمالي القائمة.`
        : `عدد الأصناف في هذا القسم: <strong>${toAr(visible)}</strong>`;
  const va = $("#viewAllMenu");
  if (va)
    va.innerHTML =
      filter === "all"
        ? 'عرض المشروبات فقط <span aria-hidden="true">←</span>'
        : 'عرض القائمة كاملة <span aria-hidden="true">←</span>';
  if (scroll) {
    const m = $("#menu");
    if (m) m.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
$$(".menu-tab").forEach((b) => b.addEventListener("click", () => setFilter(b.dataset.filter, true)));
const vam = $("#viewAllMenu");
if (vam) vam.addEventListener("click", () => setFilter(currentFilter === "all" ? "drinks" : "all", true));

/* ---------- order selection + whatsapp ---------- */
const selected = [];
const orderBar = document.createElement("div");
orderBar.className = "order-bar";
orderBar.id = "orderBar";
orderBar.hidden = true;
orderBar.setAttribute("role", "region");
orderBar.setAttribute("aria-label", "طلبك الحالي");
orderBar.innerHTML =
  '<div class="order-bar-info"><strong id="orderCount"></strong><span id="orderTotal"></span></div>' +
  '<div class="order-bar-actions"><a class="btn btn-gold" id="orderSend" href="#" rel="noopener" target="_blank">أرسل الطلب واتساب</a>' +
  '<button class="order-clear" id="orderClear" type="button">مسح</button></div>';
document.body.appendChild(orderBar);

function priceOf(name) {
  const card = $$(".menu-card").find((c) => c.dataset.name === name);
  if (!card) return 0;
  const raw = card.querySelector(".price")?.textContent || "";
  const latin = raw.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
  return parseInt(latin, 10) || 0;
}

function renderOrder() {
  if (!selected.length) {
    orderBar.hidden = true;
    document.body.classList.remove("has-order");
    return;
  }
  const counts = {};
  selected.forEach((n) => (counts[n] = (counts[n] || 0) + 1));
  const total = selected.reduce((sum, n) => sum + priceOf(n), 0);
  $("#orderCount").textContent = itemsLabel(selected.length);
  $("#orderTotal").textContent = `الإجمالي ${toAr(total)} ج.م`;
  const lines = Object.entries(counts)
    .map(([name, qty]) => "- " + name + (qty > 1 ? ` × ${qty}` : ""))
    .join("\n");
  const msg = `مرحبًا لوبارنيز، عايز أطلب:\n${lines}\n\nالإجمالي: ${total} جنيه\n(الطلب من الموقع)`;
  $("#orderSend").href = waLink(msg);
  orderBar.hidden = false;
  document.body.classList.add("has-order");
}

$("#orderClear").addEventListener("click", () => {
  selected.length = 0;
  renderOrder();
  toast("تم مسح الطلب");
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  if (selected.length >= 20) {
    toast("وصلت للحد الأقصى (٢٠ صنف) — ابعت اللي اختارته");
    return;
  }
  selected.push(btn.dataset.add);
  btn.classList.add("added");
  setTimeout(() => btn.classList.remove("added"), 280);
  renderOrder();
  toast(`تمت إضافة «${btn.dataset.add}» — ${itemsLabel(selected.length)} في الطلب`);
});

/* ---------- misc ---------- */
const yr = $("#year");
if (yr) yr.textContent = new Date().getFullYear();

if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  $$(".reveal").forEach((el) => el.classList.add("in-view"));
} else if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((x) => {
        if (x.isIntersecting) {
          x.target.classList.add("in-view");
          observer.unobserve(x.target);
        }
      }),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => observer.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("in-view"));
}
