/* ==========================================================================
   Stateline MEDIA — Cookie Consent + Google Consent Mode v2
   --------------------------------------------------------------------------
   Syarat: dipasang di <head> SEBELUM gtag.js, AdSense, dan Adsterra.
   Banner HANYA muncul untuk pengunjung dari wilayah GDPR/EEA+UK+CH.
   Pengunjung Indonesia & luar Eropa tidak melihat apa pun.
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'sm_consent_v2';
  var CONSENT_VERSION = '2';

  /* Wilayah yang wajib consent (EU/EEA + UK + Swiss + Brasil/LGPD) */
  var REGIONS_WAJIB = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
    'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',   /* EU 27 */
    'IS','LI','NO',                                                /* EEA */
    'GB','CH',                                                     /* UK + Swiss */
    'BR'                                                           /* LGPD */
  ];

  /* ---------- 1. Consent Mode v2 — MODE DEFAULT ----------
     WAJIB dijalankan SEBELUM gtag.js dimuat.
     Default = denied. Ini yang dibaca Google saat reviewer membuka situs. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  /* Region-specific: luar Eropa boleh langsung granted (mis. Indonesia) */
  gtag('consent', 'default', {
    'ad_storage': 'granted',
    'ad_user_data': 'granted',
    'ad_personalization': 'granted',
    'analytics_storage': 'granted',
    'region': ['ID','MY','SG','TH','VN','PH','JP','KR','IN','AU','NZ','US','CA','MX']
  });

  /* ---------- 2. Baca pilihan tersimpan ---------- */
  function bacaTersimpan() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || o.v !== CONSENT_VERSION) return null;
      return o;
    } catch (e) { return null; }
  }

  function simpan(pilihan) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: CONSENT_VERSION,
        ad: pilihan.ad,
        analytics: pilihan.analytics,
        waktu: new Date().toISOString()
      }));
    } catch (e) { /* mode privat: abaikan */ }
  }

  /* ---------- 3. Terapkan pilihan ke Google ---------- */
  function terapkan(pilihan) {
    gtag('consent', 'update', {
      'ad_storage': pilihan.ad ? 'granted' : 'denied',
      'ad_user_data': pilihan.ad ? 'granted' : 'denied',
      'ad_personalization': pilihan.ad ? 'granted' : 'denied',
      'analytics_storage': pilihan.analytics ? 'granted' : 'denied'
    });
    /* Beri sinyal ke Adsterra / script iklan lain via event */
    try {
      document.dispatchEvent(new CustomEvent('sm:consent', { detail: pilihan }));
      window.__smConsent = pilihan;
    } catch (e) {}
  }

  /* ---------- 4. Deteksi wilayah ---------- */
  function perluBanner() {
    /* Utamakan timezone — tidak butuh request jaringan, tidak melanggar privasi */
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var zonaEropa = /^(Europe\/|Atlantic\/|Asia\/Istanbul|Asia\/Nicosia|America\/Sao_Paulo|America\/Bahia|America\/Fortaleza|Arctic\/Longyearbyen)/;
    if (zonaEropa.test(tz)) return true;

    /* Fallback: bahasa browser Eropa */
    var lang = (navigator.language || '').toLowerCase();
    var bahasaEropa = ['de','fr','es','it','nl','pl','pt','sv','da','fi','nb','no','cs','sk','hu','ro','bg','el','hr','sl','lt','lv','et','ga','mt','is','lb','cy'];
    var kode = lang.split('-')[0];
    if (bahasaEropa.indexOf(kode) !== -1 && /-/.test(lang)) {
      /* Bahasa Eropa + ada region tag: lebih mungkin pengunjung nyata di Eropa */
      return true;
    }
    return false;
  }

  /* ---------- 5. Bangun banner ---------- */
  var CSS = [
    '.sm-cc{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;',
    'background:#111318;color:#e8eaed;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
    'box-shadow:0 -4px 24px rgba(0,0,0,.45);padding:18px 20px;display:none;',
    'border-top:1px solid #2a2f3a}',
    '.sm-cc.sm-on{display:block}',
    '.sm-cc-in{max-width:1080px;margin:0 auto;display:flex;gap:20px;align-items:center;flex-wrap:wrap}',
    '.sm-cc-txt{flex:1 1 340px;font-size:14px;line-height:1.55;margin:0}',
    '.sm-cc-txt a{color:#7fb2ff;text-decoration:underline}',
    '.sm-cc-act{display:flex;gap:10px;flex-wrap:wrap}',
    '.sm-cc button{font:inherit;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;',
    'border:1px solid #3a4150;background:#1c212b;color:#e8eaed;cursor:pointer;min-height:44px}',
    '.sm-cc button:hover{background:#252b38}',
    '.sm-cc button.sm-ok{background:#1a73e8;border-color:#1a73e8;color:#fff}',
    '.sm-cc button.sm-ok:hover{background:#1765cc}',
    '.sm-cc-det{display:none;margin-top:14px;padding-top:14px;border-top:1px solid #2a2f3a;flex:1 1 100%}',
    '.sm-cc-det.sm-on{display:block}',
    '.sm-row{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px;font-size:13.5px;line-height:1.5}',
    '.sm-row input{margin-top:3px;width:16px;height:16px;flex:0 0 auto}',
    '@media(max-width:640px){.sm-cc-act{width:100%}.sm-cc-act button{flex:1 1 auto}}'
  ].join('');

  function sisipCSS() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function buatBanner() {
    var d = document.createElement('div');
    d.className = 'sm-cc';
    d.setAttribute('role', 'dialog');
    d.setAttribute('aria-live', 'polite');
    d.setAttribute('aria-label', 'Persetujuan cookie');
    d.innerHTML = [
      '<div class="sm-cc-in">',
      '  <p class="sm-cc-txt">',
      '    Kami memakai cookie untuk mengukur pembaca dan menampilkan iklan yang relevan. ',
      '    Anda dapat menerima semua, menolak yang tidak wajib, atau mengatur pilihan. ',
      '    Baca <a href="/halaman/kebijakan-privasi">Kebijakan Privasi</a>.',
      '  </p>',
      '  <div class="sm-cc-act">',
      '    <button type="button" data-sm="tolak">Tolak</button>',
      '    <button type="button" data-sm="atur">Atur</button>',
      '    <button type="button" class="sm-ok" data-sm="terima">Terima Semua</button>',
      '  </div>',
      '  <div class="sm-cc-det">',
      '    <label class="sm-row"><input type="checkbox" id="sm-ad" checked>',
      '      <span><strong>Cookie iklan</strong> — dipakai Google AdSense dan mitra iklan untuk menampilkan iklan yang sesuai minat Anda.</span></label>',
      '    <label class="sm-row"><input type="checkbox" id="sm-an" checked>',
      '      <span><strong>Cookie analitik</strong> — dipakai Google Analytics untuk memahami halaman mana yang dibaca.</span></label>',
      '    <div class="sm-cc-act"><button type="button" class="sm-ok" data-sm="simpan">Simpan Pilihan</button></div>',
      '  </div>',
      '</div>'
    ].join('');
    document.body.appendChild(d);

    d.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('button[data-sm]') : null;
      if (!b) return;
      var aksi = b.getAttribute('data-sm');

      if (aksi === 'atur') {
        var det = d.querySelector('.sm-cc-det');
        det.classList.toggle('sm-on');
        return;
      }
      if (aksi === 'terima') {
        selesaikan({ ad: true, analytics: true }, d);
        return;
      }
      if (aksi === 'tolak') {
        selesaikan({ ad: false, analytics: false }, d);
        return;
      }
      if (aksi === 'simpan') {
        selesaikan({
          ad: d.querySelector('#sm-ad').checked,
          analytics: d.querySelector('#sm-an').checked
        }, d);
      }
    });

    return d;
  }

  function selesaikan(pilihan, el) {
    simpan(pilihan);
    terapkan(pilihan);
    el.classList.remove('sm-on');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
  }

  /* ---------- 6. Jalankan ---------- */
  function mulai() {
    var tersimpan = bacaTersimpan();

    if (tersimpan) {
      /* Sudah pernah memilih: langsung terapkan, tanpa banner */
      terapkan({ ad: !!tersimpan.ad, analytics: !!tersimpan.analytics });
      return;
    }

    if (!perluBanner()) {
      /* Luar Eropa: tidak wajib consent. Beri akses penuh supaya iklan tetap optimal. */
      terapkan({ ad: true, analytics: true });
      return;
    }

    /* Wilayah GDPR: banner wajib muncul */
    sisipCSS();
    var el = buatBanner();
    /* Tampilkan setelah DOM siap supaya tidak menggeser layout */
    requestAnimationFrame(function () { el.classList.add('sm-on'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mulai);
  } else {
    mulai();
  }

  /* ---------- 7. API untuk membuka ulang banner (link "Pengaturan Cookie") ---------- */
  window.smConsent = {
    buka: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      if (!document.querySelector('.sm-cc')) {
        sisipCSS();
        var el = buatBanner();
        requestAnimationFrame(function () { el.classList.add('sm-on'); });
      }
    },
    status: function () { return bacaTersimpan(); }
  };
})();
