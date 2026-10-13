// referral.js — Sir Name Referral System — Separated from main website
// Like ForexElites — include via <script src="referral.js"></script> before </body>
// No phone exposed, only SIR NAME e.g. ?ref=KAMAU — if taken, use KAMAU2

const REFERRAL_API_URL = "https://script.google.com/macros/s/AKfycbyTna3jo7cF0SbM04DpFiSyiNi7JGgZ3ghVigfzyIpk1oR5CCQSKd-eDVqbpPlBrajR/exec";
const REFERRAL_SITE_URL = "https://bradleyhome.github.io/bradley-funeral/";

const Referral = {
  // Extract sir name (last word) from full name
  extractSirName(fullName) {
    if (!fullName) return "";
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1].toUpperCase().replace(/[^A-Z0-9]/g, "");
  },

  // Get ?ref= from URL
  getRefParam() {
    return new URLSearchParams(location.search).get("ref") || "";
  },

  // Check if sir name ref is available — returns {available, taken, suggestions}
  async checkAvailability(sirName) {
    const s = (sirName || "").trim().toUpperCase();
    if (!s) return { ok: false, error: "Empty" };
    try {
      const qs = new URLSearchParams({ action: "checkref", ref: s }).toString();
      const res = await fetch(REFERRAL_API_URL + "?" + qs);
      const data = await res.json();
      return data; // {ok, available, taken}
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },

  // Resolve ref to display name — for banner "Referred by Sir KAMAU"
  async resolveRef(ref) {
    const r = (ref || "").trim().toUpperCase();
    if (!r) return null;
    try {
      const qs = new URLSearchParams({ action: "resolve", ref: r }).toString();
      const res = await fetch(REFERRAL_API_URL + "?" + qs);
      const data = await res.json();
      return data; // {found, sirName, fullName}
    } catch {
      return { found: false, sirName: r };
    }
  },

  // Build personal referral link from sir name
  buildLink(sirName) {
    return REFERRAL_SITE_URL + "?ref=" + encodeURIComponent(sirName.toUpperCase());
  },

  // Show banner if ?ref=KAMAU present — auto-runs on load
  async showBanner() {
    const ref = this.getRefParam();
    if (!ref) return;
    const banner = document.getElementById("refBanner") || document.getElementById("referralBanner") || document.getElementById("ref-banner");
    if (!banner) return;
    try {
      const info = await this.resolveRef(ref);
      const display = info && info.found ? `Sir ${ref} (${info.fullName})` : `Sir ${ref}`;
      banner.textContent = `✅ Referred by ${display} — 5 Levels 10,4,3,2,1 Locked 12 months`;
      banner.classList.remove("hidden");
      banner.style.display = "block";
    } catch {
      banner.textContent = `✅ Referred by Sir ${ref} — 5 Levels`;
      banner.classList.remove("hidden");
      banner.style.display = "block";
    }
  },

  // Attach to your existing form — call this if you have inputs with these IDs, or pass custom IDs
  attachToForm(opts = {}) {
    const nameInput = document.getElementById(opts.nameId || "inpName") || document.getElementById("fullName") || document.querySelector('input[name="name"]');
    const sirInput = document.getElementById(opts.sirId || "inpSir") || document.getElementById("sirName") || document.getElementById("sirname");
    const checkBtn = document.getElementById(opts.checkId || "checkBtn") || document.getElementById("checkSirBtn");
    const sirStatus = document.getElementById(opts.statusId || "sirStatus") || document.getElementById("sirNameStatus");

    if (nameInput && sirInput) {
      nameInput.addEventListener("input", (e) => {
        const sir = this.extractSirName(e.target.value);
        if (sir && !sirInput.dataset.manual) sirInput.value = sir;
      });
    }
    if (sirInput) {
      sirInput.addEventListener("input", () => { sirInput.dataset.manual = "1"; });
    }
    if (checkBtn && sirInput) {
      checkBtn.addEventListener("click", async () => {
        const sir = sirInput.value.trim().toUpperCase();
        if (!sir) { if (sirStatus) sirStatus.textContent = "Enter sir name"; return; }
        if (sirStatus) sirStatus.textContent = "Checking...";
        const result = await this.checkAvailability(sir);
        if (sirStatus) {
          if (result.available) {
            sirStatus.innerHTML = `<span style="color:#22c55e">✅ ${sir} is available!</span>`;
          } else if (result.taken) {
            const sug = sir + "2";
            sirStatus.innerHTML = `<span style="color:#ef4444">❌ ${sir} taken — try ${sug} or ${sir}_${(nameInput?.value.split(" ")[0].charAt(0) || "J")}</span>`;
          } else {
            sirStatus.textContent = "Check failed";
          }
        }
      });
    }
  },

  // Use this in your existing lead submit — returns data from backend with sirNameRef + myRefLink
  async registerMember({ fullName, sirName, phone, email, ref }) {
    const payload = {
      action: "lead",
      name: fullName,
      sirname: sirName,
      phone: phone,
      email: email || "",
      ref: ref || this.getRefParam() || "BRADLEY"
    };
    const qs = new URLSearchParams(payload).toString();
    const res = await fetch(REFERRAL_API_URL + "?" + qs);
    const data = await res.json();
    return data; // {ok, taken, sirNameRef, myRefLink, L1-L5, suggestions}
  }
};

// Auto-run on page load — banner + attach
document.addEventListener("DOMContentLoaded", () => {
  Referral.showBanner();
  Referral.attachToForm();
});

// Expose globally
window.Referral = Referral;
window.getRef = () => Referral.getRefParam();
window.checkSirName = (sir) => Referral.checkAvailability(sir);
