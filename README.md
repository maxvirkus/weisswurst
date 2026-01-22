# 🥨 Weißwurst Einstand Tracker

Eine moderne Web-App zum Tracken von Weißwürsten und Brezeln beim Team-Einstand. Bayrisch, einfach, übersichtlich!

## ✨ Features

- **🎯 Interaktive 3D-Animation** - Klick auf Wurst oder Brezel zum Zählen
- **👥 Kollegen-Management** - Einfach Namen hinzufügen, bearbeiten, löschen
- **💰 Kosten-Splitting** - Automatische Preisberechnung pro Person
- **📱 Mobile-First** - Perfekt optimiert für Handy und Desktop
- **💾 LocalStorage** - Deine Daten bleiben lokal gespeichert
- **🎨 Bayrisches Design** - Mit Liebe zum Detail gestaltet

## 🚀 Live Demo

[weisswurst.vercel.app](https://weisswurst.vercel.app) *(Link nach Deployment)*

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Three.js / React Three Fiber** - 3D Graphics
- **Vite** - Build Tool
- **CSS Modules** - Styling

## 🏃‍♂️ Lokale Installation

```bash
# Repository klonen
git clone https://github.com/maxvirkus/weisswurst.git
cd weisswurst

# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build
```

## 📝 Verwendung

1. **Kollege hinzufügen** - Namen eingeben und Enter drücken
2. **Person auswählen** - Auf Kollegen-Karte klicken
3. **Wurst/Brezel klicken** - Zähler erhöht sich automatisch
4. **Kosten aufteilen** - "Kosten teilen" aktivieren und Preise eingeben
5. **Fertig!** - Übersicht zeigt totale Kosten an

## 🎮 Features im Detail

### Kollegen-Management
- ✏️ Namen bearbeiten
- 🗑️ Kollegen löschen
- 🔄 Zähler zurücksetzen
- ↕️ Sortierung (alphabetisch oder nach Anzahl)

### Preisberechnung
- Separater Preis für Würste und Brezeln
- Automatische Gesamtkostenberechnung
- Individuelle Kosten pro Person

### Mobile Experience
- Responsive Layout
- Touch-optimiert
- Keine horizontalen Scrollbalken
- Optimierte Schriftgrößen

## 🚀 Deployment

### Vercel (Empfohlen)

1. Gehe zu [vercel.com](https://vercel.com)
2. Klicke "New Project"
3. Importiere dein GitHub Repository
4. Deploy! (Automatische Konfiguration)

### Netlify

```bash
npm run build
# Uploade den 'dist' Ordner auf Netlify
```

## 📄 Lizenz

MIT License

## 👨‍💻 Autor

**Max Virkus**
- GitHub: [@maxvirkus](https://github.com/maxvirkus)

## 🤝 Contributing

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue öffnen.

---

Made with 🥨 in Bayern • Servus!
