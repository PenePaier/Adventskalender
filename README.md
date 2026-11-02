# Adventskalender 🎄

Eine statische Website für GitHub Pages: Beim ersten Öffnen gibt man einen Code ein und bekommt dann seinen persönlichen Kalender. Der Code bleibt im Browser des Geräts gespeichert, bis man unter den Türchen auf „Anderen Code eingeben“ klickt. Jeden Tag im Dezember öffnet sich darin ein Türchen mit einem neuen Bild. Ältere Tage kann man über „‹ Vortag“ oder das Türchen-Raster wieder anschauen, zukünftige Türchen bleiben zu.

## Kalender anlegen

Jeder Kalender ist ein Unterordner von `bilder/`. **Der Ordnername ist gleichzeitig der Code:**

```
bilder/zimt-kerze-42/name.txt
bilder/zimt-kerze-42/Aufgabe_01.jpg
bilder/zimt-kerze-42/Aufgabe_02.jpg
…
bilder/zimt-kerze-42/Aufgabe_24.jpg
```

- **Ordnername:** nur Kleinbuchstaben (a–z), Ziffern, `-` und `_`, also keine Umlaute oder Leerzeichen. Nimm etwas, das man nicht erraten kann, also nicht einfach den Vornamen. Beim Eingeben spielt Groß-/Kleinschreibung keine Rolle.
- **`name.txt`:** eine reine Textdatei, in deren erster Zeile der Name steht, z. B. `Luis`. Die Seite zeigt dann „für Luis“. Solange die Datei fehlt, gilt der Code erst, wenn `Aufgabe_01` im Ordner liegt, und es wird kein Name angezeigt.
- **Bilder:** Erlaubt sind `.jpg`, `.jpeg`, `.png`, `.webp` und `.gif`. Die Seite findet das passende Format selbst. `Aufgabe_5.jpg` statt `Aufgabe_05.jpg` funktioniert auch.
- **Achtung:** GitHub unterscheidet Groß- und Kleinschreibung. `aufgabe_01.jpg` (kleines „a“) wird nicht gefunden.
- Fehlt ein Bild, steht dort „Hinter Türchen X versteckt sich noch nichts“. Man kann Bilder also auch nach und nach hochladen.

## Auf GitHub Pages veröffentlichen

1. Auf [github.com](https://github.com) ein neues Repository anlegen (z. B. `adventskalender`), Sichtbarkeit **Public**.
2. Im Repository auf **Add file → Upload files** klicken und den *Inhalt* dieses Ordners hineinziehen: `index.html`, `style.css`, `script.js` und den Ordner `bilder`. Unten auf **Commit changes** klicken.
3. **Settings → Pages**: Bei *Source* „Deploy from a branch“ wählen, Branch `main` und Ordner `/ (root)`, dann **Save**.
4. Nach ein bis zwei Minuten ist die Seite erreichbar unter
   `https://DEIN-GITHUB-NAME.github.io/adventskalender/`

Später neue Bilder hochladen: wieder **Add file → Upload files**, vorher in den Ordner des Kalenders klicken. Einen neuen Kalender legst du an, indem du seinen ganzen Ordner in `bilder` hineinziehst.

## Testen

Auf dem eigenen Rechner kann man mit `?datum=…` in der Adresse so tun, als wäre ein anderer Tag. Dazu in diesem Ordner starten:

```bash
python3 -m http.server
```

- `http://localhost:8000/?datum=2026-12-05`: 5. Dezember
- `http://localhost:8000/?datum=2026-12-24`: Heiligabend, alle Türchen offen
- `http://localhost:8000/?datum=2026-11-20`: Countdown vor dem Start

Das klappt nur lokal. Auf der echten Website wird `?datum=` ignoriert, damit niemand damit die Türchen vorzeitig öffnen kann.

## Einstellungen

Oben in `script.js`:

| Einstellung | Bedeutung |
|---|---|
| `JAHR` | In welchem Dezember der Kalender läuft (für nächstes Jahr einfach ändern). |
| `ORDNER` | Ordner, in dem die Kalender-Unterordner liegen. |
| `ENDUNGEN` | Dateiendungen, nach denen gesucht wird. |
| `ZEITZONE` | Um Mitternacht welcher Zeitzone das nächste Türchen aufgeht (Standard: `Europe/Berlin`). |

Die Uhrzeit kommt nicht vom Gerät, sondern vom GitHub-Server: Die Seite liest beim Laden die echte Zeit aus der Server-Antwort. Die Uhr am Handy vorzustellen bringt also nichts, und Besucher in anderen Zeitzonen bekommen das Türchen zur selben Zeit wie in Deutschland. Nur wenn der Server gar nicht erreichbar ist, nimmt die Seite die Geräteuhr. Nach dem 24. Dezember bleiben alle Türchen offen.

## Gut zu wissen

Der Code und die Sperre für zukünftige Türchen passieren nur im Browser, und das Repository ist öffentlich. Wer es auf GitHub findet, sieht dort alle Ordnernamen (also alle Codes) und alle Bilder, auch die von zukünftigen Tagen. Für einen Kalender unter Freunden reicht das meistens. Nach und nach hochladen schützt zukünftige Bilder; für wirklich private Bilder ist GitHub Pages nicht geeignet.
