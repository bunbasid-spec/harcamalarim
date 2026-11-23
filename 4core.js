const APP_CONFIG = {
  VERSION: "5.0.0",
  API_URL: "https://script.google.com/macros/s/AKfycbxwsVf8deHomi5jaNLfU86AkVbRQdXPNHuK8z9qiL1EGJanlSo_1e9BhQX0Kup7BdTb/exec",
  CURRENCY_SYMBOL: "€",
  LOCALE: "de-DE"
};

const AppStorage = {
  get(key, defaultVal = null) {
    try {
      const val = localStorage.getItem(key);
      return val === null ? defaultVal : val;
    } catch (e) {
      return defaultVal;
    }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  },
  getJSON(key, defaultVal = null) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  },
  setJSON(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
};

const AppFormat = {
  currency(num, symbol = "€") {
    const n = Number(num) || 0;
    return symbol + n.toLocaleString(APP_CONFIG.LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  number(num) {
    const n = Number(num) || 0;
    return n.toLocaleString(APP_CONFIG.LOCALE, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  int(num) {
    return Math.round(Number(num) || 0).toLocaleString(APP_CONFIG.LOCALE);
  },
  amountText(val) {
    if (!val && val !== 0) return "€0,00";
    const str = val.toString().trim();
    if (str.includes("€") || str.includes("₺")) return str;
    const num = this.parseAmount(str);
    return isNaN(num) ? str : this.currency(num);
  },
  parseAmount(amt) {
    if (typeof amt === "number") return amt;
    if (!amt) return 0;
    let str = amt.toString().replace(/[€₺\s]/g, "").trim();
    if (!str) return 0;
    if (str.includes(".") && str.includes(",")) {
      if (str.lastIndexOf(",") > str.lastIndexOf(".")) {
        str = str.replace(/\./g, "").replace(",", ".");
      } else {
        str = str.replace(/,/g, "");
      }
    } else if (str.includes(",")) {
      str = str.replace(",", ".");
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  },
  escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }
};

const AppDate = {
  todayISO() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split("T")[0];
  },
  dmyToISO(dateStr) {
    if (!dateStr) return this.todayISO();
    const parts = dateStr.toString().trim().split(".");
    return parts.length === 3 ? `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}` : dateStr;
  },
  isoToDMY(isoStr) {
    if (!isoStr) return "";
    const parts = isoStr.toString().trim().split("-");
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : isoStr;
  },
  toTimestamp(dateStr, emptyToMax = true) {
    if (!dateStr || dateStr.toString().trim() === "") {
      return emptyToMax ? Number.MAX_SAFE_INTEGER : 0;
    }
    const parts = dateStr.toString().trim().split(".");
    return parts.length === 3 ? new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)).getTime() : 0;
  }
};

let _coreToastTimer = null;
function showToast(msg, duration = 2400) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(_coreToastTimer);
  _coreToastTimer = setTimeout(() => el.classList.remove("show"), duration);
}

const AppAPI = {
  async get(action, params = {}) {
    const url = new URL(APP_CONFIG.API_URL);
    url.searchParams.set("action", action);
    Object.keys(params).forEach(k => {
      if (params[k] !== undefined && params[k] !== null) url.searchParams.set(k, params[k]);
    });
    const res = await fetch(url.toString());
    return await res.json();
  },
  async post(payload) {
    const res = await fetch(APP_CONFIG.API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { status: "ok", raw: text };
    }
  }
};

const AppFrame = {
  isEmbed() {
    const qs = new URLSearchParams(window.location.search);
    return qs.get("embed") === "1" && window.parent !== window;
  },
  initEmbedInsets() {
    if (!this.isEmbed()) return false;
    document.documentElement.classList.add("embed");
    const qs = new URLSearchParams(window.location.search);
    let top = NaN;
    const hy = parseFloat(qs.get("hy"));
    if (isFinite(hy)) {
      try { top = Math.max(0, hy - window.frameElement.getBoundingClientRect().top); } catch (e) {}
    }
    if (!isFinite(top)) {
      const s = parseFloat(qs.get("sat"));
      if (isFinite(s)) top = s;
    }
    if (isFinite(top)) document.documentElement.style.setProperty("--sat", top + "px");
    const sab = parseFloat(qs.get("sab"));
    if (isFinite(sab)) document.documentElement.style.setProperty("--sab", sab + "px");
    return true;
  },
  close(type = "frame-close", fallbackUrl = "2.html") {
    if (this.isEmbed()) {
      window.parent.postMessage({ type }, window.location.origin);
    } else {
      window.location.href = fallbackUrl;
    }
  }
};
