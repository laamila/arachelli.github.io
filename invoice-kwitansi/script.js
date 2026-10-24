
// ================================================
// VELORA DOCS — GENERATOR INVOICE & KWITANSI
// ================================================

// URL Google Apps Script Web App milik kamu
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyhV3umA1dzQW9Pi2p5NeB5SsVHP6E_J_kypeZQUHT9Jc-_nemo7Zn-maBIzTWyujSY/exec";

// Ganti dengan token yang SAMA seperti di Google Apps Script
const SHEETS_TOKEN = "020101";

const $ = (id) => document.getElementById(id);
let currentDoc = "invoice";
const STORAGE_KEY = "veloraDocsDraftV1";

const fields = [
  "docNumber", "docDate", "dueDate", "paymentStatus",
  "businessName", "businessPhone", "businessAddress",
  "customerName", "customerAddress", "receivedFrom",
  "receiptFor", "discountPercent", "discountAmount",
  "taxPercent", "paidAmount", "receiptAmount",
  "paymentMethod", "notes"
];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function money(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function num(id) {
  return Math.max(0, Number($(id).value) || 0);
}

function dateText(value) {
  if (!value) return "-";
  return new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function safeText(value) {
  return String(value ?? "").trim();
}

function setMessage(message, good = false) {
  $("sheetMessage").textContent = message;
  $("sheetMessage").style.color = good ? "#2f7657" : "";
}

// ================================================
// DAFTAR BARANG / JASA
// ================================================

function addItem(name = "", qty = 1, price = 0) {
  const row = document.createElement("div");
  row.className = "item-row";

  row.innerHTML = `
    <input class="item-name" aria-label="Nama item" placeholder="Nama barang/jasa">
    <input class="item-qty" aria-label="Kuantitas" type="number" min="1" value="1">
    <input class="item-price" aria-label="Harga satuan" type="number" min="0" value="0">
    <span class="item-total">Rp0</span>
    <button class="remove-item" type="button" aria-label="Hapus item">×</button>
  `;

  row.querySelector(".item-name").value = name;
  row.querySelector(".item-qty").value = qty;
  row.querySelector(".item-price").value = price;

  row.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      renderPreview();
      saveDraft(false);
    });
  });

  row.querySelector(".remove-item").addEventListener("click", () => {
    row.remove();
    if (!$("itemsList").children.length) addItem();
    renderPreview();
    saveDraft(false);
  });

  $("itemsList").appendChild(row);
  renderPreview();
}

function getItems() {
  return [...$("itemsList").querySelectorAll(".item-row")].map(row => ({
    name: safeText(row.querySelector(".item-name").value),
    qty: Math.max(1, Number(row.querySelector(".item-qty").value) || 1),
    price: Math.max(0, Number(row.querySelector(".item-price").value) || 0)
  }));
}

// ================================================
// PERHITUNGAN INVOICE
// ================================================

function totals() {
  const subtotal = getItems().reduce(
    (sum, item) => sum + item.qty * item.price, 0
  );

  const discount = Math.min(
    subtotal,
    subtotal * num("discountPercent") / 100 + num("discountAmount")
  );

  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * num("taxPercent") / 100;
  const total = Math.max(0, taxable + tax);
  const paid = Math.min(total, num("paidAmount"));

  return {
    subtotal,
    discount,
    tax,
    total,
    paid,
    remaining: Math.max(0, total - paid)
  };
}

function show(id, visible) {
  $(id).classList.toggle("hidden", !visible);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// ================================================
// LIVE PREVIEW
// ================================================

function renderPreview() {
  const receipt = currentDoc === "receipt";

  $("formTitle").textContent = receipt ? "Detail Kwitansi" : "Detail Invoice";
  $("pDocLabel").textContent = receipt ? "KWITANSI" : "INVOICE";
  $("pCustomerLabel").textContent = receipt ? "DITERIMA DARI" : "TAGIHAN KEPADA";
  $("customerHeading").textContent = receipt ? "Informasi pembayaran" : "Informasi pelanggan";

  show("dueDateWrap", !receipt);
  show("customerNameWrap", !receipt);
  show("customerAddressWrap", !receipt);
  show("receivedFromWrap", receipt);
  show("receiptForWrap", receipt);
  show("itemsSection", !receipt);
  show("totalsSection", !receipt);
  show("receiptAmountSection", receipt);
  show("pItemsWrap", !receipt);
  show("pTotals", !receipt);
  show("pReceiptAmount", receipt);
  show("pReceiptDetail", receipt);

  $("pBusinessName").textContent = safeText($("businessName").value) || "Nama Usaha";
  $("pBusinessAddress").textContent = safeText($("businessAddress").value) || "Alamat usaha";
  $("pBusinessPhone").textContent = safeText($("businessPhone").value);
  $("pDocNumber").textContent = safeText($("docNumber").value) || (receipt ? "KW-001" : "INV-001");
  $("pDocStatus").textContent = $("paymentStatus").value;
  $("pDocDate").textContent = dateText($("docDate").value);
  $("pDueDate").textContent = receipt ? "" : "Jatuh tempo: " + dateText($("dueDate").value);

  $("pCustomerName").textContent = receipt
    ? (safeText($("receivedFrom").value) || "Nama pembayar")
    : (safeText($("customerName").value) || "Nama pelanggan");

  $("pCustomerAddress").textContent = receipt ? "" : safeText($("customerAddress").value);

  const items = getItems();

  $("pItems").innerHTML = items.map(item => `
    <tr>
      <td>${escapeHtml(item.name || "Item")}</td>
      <td>${item.qty}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.qty * item.price)}</td>
    </tr>
  `).join("");

  const t = totals();

  $("itemsList").querySelectorAll(".item-row").forEach((row, i) => {
    row.querySelector(".item-total").textContent =
      money((items[i]?.qty || 0) * (items[i]?.price || 0));
  });

  $("pSubtotal").textContent = money(t.subtotal);
  $("pDiscount").textContent = "- " + money(t.discount);
  $("pTax").textContent = money(t.tax);
  $("pTotal").textContent = money(t.total);
  $("pPaid").textContent = money(t.paid);
  $("pRemaining").textContent = money(t.remaining);

  $("pReceiptAmount").textContent = money(num("receiptAmount"));
  $("pReceivedFrom").textContent = safeText($("receivedFrom").value) || "—";
  $("pReceiptFor").textContent = safeText($("receiptFor").value) || "—";
  $("pPaymentMethod").textContent = $("paymentMethod").value;
  $("pNotes").textContent = safeText($("notes").value) || "Terima kasih atas kepercayaan Anda.";
  $("pFooterBrand").textContent = (safeText($("businessName").value) || "Velora Docs").toUpperCase();
}

// ================================================
// SIMPAN DRAFT DI BROWSER
// ================================================

function getData() {
  return {
    version: 1,
    docType: currentDoc,
    fields: Object.fromEntries(fields.map(id => [id, $(id).value])),
    items: getItems()
  };
}

function loadData(data) {
  if (!data) return;

  currentDoc = data.docType === "receipt" ? "receipt" : "invoice";

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.doc === currentDoc);
  });

  if (data.fields) {
    fields.forEach(id => {
      if (data.fields[id] !== undefined) $(id).value = data.fields[id];
    });
  }

  $("itemsList").innerHTML = "";

  (Array.isArray(data.items) && data.items.length
    ? data.items
    : [{ name: "", qty: 1, price: 0 }]
  ).forEach(item => addItem(item.name, item.qty, item.price));

  renderPreview();
}

function saveDraft(showNotice = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getData()));

    if (showNotice) {
      $("savedIndicator").textContent = "Draft tersimpan";
      setTimeout(() => {
        $("savedIndicator").textContent = "Draft tersimpan otomatis";
      }, 1800);
    }
  } catch (error) {
    if (showNotice) setMessage("Browser tidak dapat menyimpan draft.");
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      loadData(JSON.parse(raw));
      return true;
    }
  } catch (error) {
    console.warn("Draft tidak dapat dibaca:", error);
  }
  return false;
}

// ================================================
// GANTI JENIS DOKUMEN
// ================================================

function switchDoc(type) {
  currentDoc = type;

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.doc === type);
  });

  const prefix = type === "receipt" ? "KW-" : "INV-";

  if (
    !$("docNumber").value ||
    $("docNumber").value.startsWith("INV-") ||
    $("docNumber").value.startsWith("KW-")
  ) {
    $("docNumber").value = prefix + String(Date.now()).slice(-6);
  }

  renderPreview();
  saveDraft(false);
}

// ================================================
// CETAK / SIMPAN PDF
// ================================================

function printDocument() {
  renderPreview();
  window.print();
}

// ================================================
// KIRIM KWITANSI KE GOOGLE SHEETS
// ================================================

async function saveToSheets() {
  if (currentDoc !== "receipt") {
    setMessage("Pilih tab Kwitansi terlebih dahulu.");
    return;
  }

  const amount = num("receiptAmount");

  if (
    !$("docNumber").value.trim() ||
    !$("businessName").value.trim() ||
    !$("receivedFrom").value.trim() ||
    !amount
  ) {
    setMessage("Lengkapi nomor kwitansi, nama usaha/penerima, nama pembayar, dan nominal.");
    return;
  }

  if (!APPS_SCRIPT_URL.endsWith("/exec")) {
    setMessage("URL Apps Script belum benar.");
    return;
  }

  if (!SHEETS_TOKEN || SHEETS_TOKEN === "GANTI_DENGAN_KUNCI_RAHASIA") {
    setMessage("Atur SHEETS_TOKEN di script.js agar sama dengan token di Apps Script.");
    return;
  }

  const data = {
    token: SHEETS_TOKEN,
    jenis: "Kwitansi",
    nomor: $("docNumber").value,
    tanggal: $("docDate").value,
    pembayar: $("receivedFrom").value,
    keterangan: $("receiptFor").value,
    nominal: String(amount),
    metode: $("paymentMethod").value,
    status: $("paymentStatus").value,
    usaha: $("businessName").value
  };

  const button = $("saveSheets");
  button.disabled = true;
  button.textContent = "Mengirim…";

  try {
    // Browser tidak dapat membaca balasan dari mode no-cors.
    // Periksa Google Sheets untuk memastikan baris masuk.
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams(data).toString()
    });

    setMessage(
      "Permintaan kirim sudah dilakukan. Periksa Google Sheets untuk memastikan baris kwitansi baru muncul.",
      true
    );
  } catch (error) {
    setMessage("Pengiriman gagal. Periksa koneksi internet dan URL Apps Script.");
  } finally {
    button.disabled = false;
    button.textContent = "Simpan ke Sheets";
  }
}

// ================================================
// RESET FORMULIR
// ================================================

function resetForm() {
  if (!confirm("Reset semua isian dokumen? Draft saat ini akan diganti.")) return;

  $("docForm").reset();
  $("docDate").value = todayISO();
  $("dueDate").value = todayISO();
  $("docNumber").value = (currentDoc === "receipt" ? "KW-" : "INV-") + String(Date.now()).slice(-6);

  $("itemsList").innerHTML = "";
  addItem();
  renderPreview();
  saveDraft(false);
}

// ================================================
// EVENT LISTENERS & INISIALISASI
// ================================================

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => switchDoc(tab.dataset.doc));
});

$("addItem").addEventListener("click", () => {
  addItem();
  saveDraft(false);
});

$("docForm").addEventListener("input", () => {
  renderPreview();
  saveDraft(false);
});

$("saveLocal").addEventListener("click", () => saveDraft(true));
$("resetForm").addEventListener("click", resetForm);
$("printTop").addEventListener("click", printDocument);
$("printPreview").addEventListener("click", printDocument);
$("saveSheets").addEventListener("click", saveToSheets);

$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "veloraDocsTheme",
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
});

if (localStorage.getItem("veloraDocsTheme") === "dark") {
  document.body.classList.add("dark-mode");
}

if (!loadDraft()) {
  $("docDate").value = todayISO();
  $("dueDate").value = todayISO();
  $("docNumber").value = "INV-" + String(Date.now()).slice(-6);
  addItem();
}

renderPreview();
