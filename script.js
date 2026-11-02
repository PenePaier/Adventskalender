// ================= Einstellungen =================
const JAHR = 2026;          // In welchem Dezember der Kalender läuft
const ZEITZONE = "Europe/Berlin"; // Um Mitternacht dieser Zeitzone öffnet sich das nächste Türchen
const ORDNER = "bilder";    // Pro Kalender ein Unterordner: bilder/<code>/Aufgabe_01.jpg
const ENDUNGEN = ["jpg", "jpeg", "png", "webp", "gif", "JPG", "JPEG", "PNG", "WEBP"];
// =================================================

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
  "August", "September", "Oktober", "November", "Dezember"];
const WOCHENTAGE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
// Gemischte Reihenfolge der Türchen wie bei einem echten Kalender
const TUER_REIHENFOLGE = [7, 19, 2, 13, 22, 5, 16, 10, 1, 24, 8, 20, 3, 14, 11, 23, 6, 17, 12, 4, 21, 9, 15, 18];

const $ = (id) => document.getElementById(id);

let offen = 0;      // Anzahl geöffneter Türchen (0 = vor dem 1. Dezember)
let aktuell = 0;    // gerade angezeigter Tag
let zeitVersatz = 0; // Abweichung der Geräteuhr von der echten Zeit (ms)
const ladeZeit = Date.now();
let kalenderOrdner = ""; // Bilder-Ordner des gerade geöffneten Kalenders

// 1. Dezember, 00:00 Uhr deutscher Zeit (im Winter gilt MEZ = UTC+1)
const START = Date.UTC(JAHR, 10, 30, 23);

// Holt die echte Uhrzeit vom Webserver: GitHub Pages schickt sie bei jeder Antwort im "Date"-Header mit.
// So hilft es nichts, die Uhr am Handy vorzustellen.
async function synchronisiereZeit() {
  try {
    const vorher = Date.now();
    const antwort = await fetch(`${location.pathname}?zeit=${vorher}`, { method: "HEAD", cache: "no-store" });
    const nachher = Date.now();
    const server = Date.parse(antwort.headers.get("Date"));
    // Der Header ist auf Sekunden abgerundet, daher +500 ms
    if (!isNaN(server)) zeitVersatz = server + 500 - (vorher + nachher) / 2;
  } catch {
    // Server nicht erreichbar: dann bleibt nur die Geräteuhr
  }
}

// Aktueller Zeitpunkt in ms. Zum Testen auf dem eigenen Rechner: ?datum=2026-12-05 an die Adresse hängen.
// Auf der echten Website wird das ignoriert, sonst könnte jeder damit alle Türchen öffnen.
const TESTMODUS = ["localhost", "127.0.0.1"].includes(location.hostname);
function jetztMs() {
  const p = TESTMODUS ? new URLSearchParams(location.search).get("datum") : null;
  const m = p && p.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return Date.UTC(+m[1], m[2] - 1, +m[3], 11) + (Date.now() - ladeZeit);
  return Date.now() + zeitVersatz;
}

// Heutiges Kalenderdatum in deutscher Zeit, unabhängig von der Zeitzone des Geräts
function heute() {
  const teile = new Intl.DateTimeFormat("en-US", {
    timeZone: ZEITZONE, year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date(jetztMs()));
  const wert = (typ) => +teile.find((t) => t.type === typ).value;
  return { jahr: wert("year"), monat: wert("month"), tag: wert("day") };
}

function berechneOffen() {
  const h = heute();
  if (h.jahr < JAHR || (h.jahr === JAHR && h.monat < 12)) return 0;
  if (h.jahr > JAHR) return 24;
  return Math.min(h.tag, 24);
}

function nachWeihnachten() {
  const h = heute();
  return h.jahr > JAHR || (h.jahr === JAHR && h.monat === 12 && h.tag > 24);
}

function datumText(tag) {
  const d = new Date(JAHR, 11, tag);
  return `${WOCHENTAGE[d.getDay()]}, ${tag}. ${MONATE[11]}`;
}

// Findet das Bild zu einem Tag, egal ob .jpg, .png, … und ob "Aufgabe_05" oder "Aufgabe_5".
const bildCache = {};
function bildUrl(tag) {
  if (bildCache[tag]) return bildCache[tag];
  const namen = [`Aufgabe_${String(tag).padStart(2, "0")}`];
  if (tag < 10) namen.push(`Aufgabe_${tag}`);
  const kandidaten = namen.flatMap((n) => ENDUNGEN.map((e) => `${kalenderOrdner}/${n}.${e}`));

  bildCache[tag] = new Promise((resolve) => {
    let i = 0;
    const probiere = () => {
      if (i >= kandidaten.length) {
        delete bildCache[tag];
        resolve(null);
        return;
      }
      const url = kandidaten[i++];
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = probiere;
      img.src = url;
    };
    probiere();
  });
  return bildCache[tag];
}

// ---------- Code merken ----------
// Der Speicher kann im privaten Modus gesperrt sein, dann wird eben jedes Mal gefragt.
const CODE_SPEICHER = "adventskalender-code";
function gemerkterCode() {
  try { return localStorage.getItem(CODE_SPEICHER); } catch { return null; }
}
function merkeCode(code) {
  try { localStorage.setItem(CODE_SPEICHER, code); } catch {}
}
function vergissCode() {
  try { localStorage.removeItem(CODE_SPEICHER); } catch {}
}

// ---------- Code prüfen und Kalender öffnen ----------
const CODE_FALSCH = "Diesen Code kennen wir leider nicht. Schau nochmal genau hin!";

// Der Code ist der Name des Unterordners. Gibt die Fehlermeldung zurück, oder "" bei Erfolg.
async function oeffneKalender(eingabe) {
  const code = eingabe.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(code)) return CODE_FALSCH;

  kalenderOrdner = `${ORDNER}/${code}`;
  let name = "";
  try {
    const antwort = await fetch(`${kalenderOrdner}/name.txt`, { cache: "no-cache" });
    if (antwort.ok) {
      name = (await antwort.text()).split(/\r?\n/)[0].trim().slice(0, 40);
    } else if (!(await bildUrl(1))) {
      return CODE_FALSCH;
    }
  } catch {
    return "Keine Verbindung. Bitte versuch es gleich nochmal.";
  }

  if (name) {
    $("fuer").textContent = `für ${name}`;
    $("fuer").classList.remove("hidden");
    document.title = `Adventskalender für ${name}`;
  }
  merkeCode(code);
  await synchronisiereZeit();
  $("zugang").classList.add("hidden");
  $("kalender").classList.remove("hidden");
  start();
  return "";
}

// ---------- Bild eines Tages anzeigen ----------
async function zeige(tag) {
  aktuell = tag;
  const istHeute = tag === offen;

  $("tag-nummer").textContent = tag;
  $("tag-datum").textContent = datumText(tag);
  $("tag-label").textContent = istHeute && nachWeihnachten()
    ? "Das letzte Türchen"
    : istHeute ? "Heutiges Türchen" : "Türchen von früher";
  $("zurueck").disabled = tag <= 1;
  $("vor").disabled = tag >= offen;
  $("heute").classList.toggle("hidden", istHeute);

  document.querySelectorAll(".tuer").forEach((t) => {
    t.classList.toggle("gewaehlt", +t.dataset.tag === tag);
  });
  history.replaceState(null, "", `${location.search}#tag-${tag}`);

  const rahmen = $("rahmen");
  const img = $("bild");
  rahmen.classList.add("laedt");
  $("bild-link").classList.add("hidden");
  $("rahmen-info").textContent = "Türchen wird geöffnet …";

  const url = await bildUrl(tag);
  if (aktuell !== tag) return; // inzwischen wurde ein anderer Tag gewählt
  rahmen.classList.remove("laedt");

  if (!url) {
    $("rahmen-info").textContent = `Hinter Türchen ${tag} versteckt sich noch nichts – schau später nochmal vorbei!`;
    return;
  }
  $("rahmen-info").textContent = "";
  img.src = url;
  img.alt = `Aufgabe für den ${tag}. Dezember`;
  img.classList.remove("erscheint");
  void img.offsetWidth; // Animation neu starten
  img.classList.add("erscheint");
  $("bild-link").href = url;
  $("bild-link").classList.remove("hidden");

  if (tag > 1) bildUrl(tag - 1); // Vortag schon mal vorladen
}

// ---------- Türchen-Raster ----------
function baueTueren() {
  const box = $("tueren");
  box.replaceChildren();
  for (const tag of TUER_REIHENFOLGE) {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "tuer";
    t.dataset.tag = tag;
    t.innerHTML = `<span class="innen" aria-hidden="true">★</span><span class="vorne"><span class="zahl">${tag}</span></span>`;
    t.addEventListener("click", () => klickTuer(t, tag));
    box.append(t);
  }
  aktualisiereTueren(true);
}

function aktualisiereTueren(ersterStart) {
  document.querySelectorAll(".tuer").forEach((t) => {
    const tag = +t.dataset.tag;
    const istOffen = tag <= offen;
    t.classList.toggle("gesperrt", !istOffen);
    t.classList.toggle("heute", tag === offen);
    t.setAttribute("aria-label", istOffen ? `Türchen ${tag} anzeigen` : `Türchen ${tag}, noch verschlossen`);
    // Das heutige Türchen geht beim Laden sichtbar auf
    if (ersterStart && tag === offen) {
      setTimeout(() => t.classList.add("offen"), 700);
    } else {
      t.classList.toggle("offen", istOffen);
    }
  });
}

function klickTuer(t, tag) {
  if (tag <= offen) {
    $("hinweis").textContent = "";
    zeige(tag);
    $("buehne").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  t.classList.remove("ruetteln");
  void t.offsetWidth;
  t.classList.add("ruetteln");
  const h = heute();
  const tage = Math.round((Date.UTC(JAHR, 11, tag) - Date.UTC(h.jahr, h.monat - 1, h.tag)) / 86400000);
  $("hinweis").textContent = `Nicht schummeln! Türchen ${tag} öffnet sich ${tage === 1 ? "morgen" : `in ${tage} Tagen`}. 🎅`;
}

// ---------- Countdown bis zum 1. Dezember ----------
let countdownTimer;
function starteCountdown() {
  const tick = () => {
    const rest = Math.max(0, START - jetztMs());
    if (rest === 0) {
      clearInterval(countdownTimer);
      start();
      return;
    }
    const s = Math.floor(rest / 1000);
    $("cd-tage").textContent = Math.floor(s / 86400);
    $("cd-std").textContent = Math.floor((s % 86400) / 3600);
    $("cd-min").textContent = Math.floor((s % 3600) / 60);
    $("cd-sek").textContent = s % 60;
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

// ---------- Deko ----------
function schnee() {
  const box = $("snow");
  const anzahl = window.innerWidth < 640 ? 28 : 55;
  const zeichen = ["❄", "❅", "❆", "•"];
  for (let i = 0; i < anzahl; i++) {
    const f = document.createElement("span");
    f.className = "flocke";
    f.textContent = zeichen[i % zeichen.length];
    f.style.left = `${Math.random() * 100}%`;
    f.style.fontSize = `${8 + Math.random() * 14}px`;
    f.style.opacity = (0.35 + Math.random() * 0.6).toFixed(2);
    f.style.setProperty("--wind", `${(Math.random() - 0.5) * 120}px`);
    f.style.animationDuration = `${9 + Math.random() * 14}s`;
    f.style.animationDelay = `${-Math.random() * 20}s`;
    box.append(f);
  }
}

function lichterkette() {
  const box = $("lights");
  for (let i = 0; i < 30; i++) box.append(document.createElement("i"));
}

// ---------- Start ----------
function start() {
  offen = berechneOffen();

  if (offen === 0) {
    $("untertitel").textContent = "24 Türchen warten darauf, geöffnet zu werden.";
  } else if (nachWeihnachten()) {
    $("untertitel").textContent = "Alle Türchen sind offen – frohe Weihnachten!";
  } else if (offen === 24) {
    $("untertitel").textContent = "Heiligabend! Das letzte Türchen ist offen.";
  } else {
    $("untertitel").textContent = `Noch ${24 - offen} ${24 - offen === 1 ? "Tag" : "Tage"} bis Heiligabend.`;
  }

  $("countdown").classList.toggle("hidden", offen > 0);
  $("buehne").classList.toggle("hidden", offen === 0);

  if (!document.querySelector(".tuer")) baueTueren();
  else aktualisiereTueren(false);

  if (offen === 0) {
    starteCountdown();
    return;
  }

  // Gewählter Tag aus der Adresse (#tag-5), sonst heute
  const m = location.hash.match(/^#tag-(\d+)$/);
  const gewuenscht = m ? +m[1] : offen;
  zeige(gewuenscht >= 1 && gewuenscht <= offen ? gewuenscht : offen);
}

$("code-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const knopf = e.target.querySelector("button");
  knopf.disabled = true;
  $("code-fehler").textContent = "";
  $("code-fehler").textContent = await oeffneKalender($("code").value);
  knopf.disabled = false;
});
// Code vergessen und neu laden führt zurück zur Code-Abfrage
$("abmelden").addEventListener("click", () => {
  vergissCode();
  location.replace(location.pathname + location.search);
});

$("zurueck").addEventListener("click", () => aktuell > 1 && zeige(aktuell - 1));
$("vor").addEventListener("click", () => aktuell < offen && zeige(aktuell + 1));
$("heute").addEventListener("click", () => zeige(offen));
document.addEventListener("keydown", (e) => {
  if (offen === 0 || e.target.closest("input, textarea")) return;
  if (e.key === "ArrowLeft") $("zurueck").click();
  if (e.key === "ArrowRight") $("vor").click();
});

// Um Mitternacht das neue Türchen freischalten, falls die Seite offen bleibt
setInterval(() => {
  if (offen > 0 && berechneOffen() !== offen) {
    const warHeute = aktuell === offen;
    offen = berechneOffen();
    aktualisiereTueren(false);
    zeige(warHeute ? offen : aktuell);
  }
}, 60 * 1000);

$("jahr").textContent = JAHR;
lichterkette();
schnee();

// Wer schon einmal einen gültigen Code eingegeben hat, landet direkt im Kalender
async function oeffneGemerktenKalender() {
  const code = gemerkterCode();
  if (!code) return;
  $("zugang").classList.add("hidden");
  const fehler = await oeffneKalender(code);
  if (!fehler) return;
  $("zugang").classList.remove("hidden");
  if (fehler === CODE_FALSCH) vergissCode(); // z. B. Ordner wurde umbenannt
  else $("code-fehler").textContent = fehler;
}
oeffneGemerktenKalender();
