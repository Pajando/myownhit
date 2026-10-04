/*
  DEMO SONGS — the only file you edit to add a demo.

  1. Put the MP3 in the /demos folder (example: demos/rosa-birthday.mp3)
  2. Add or edit an entry below. Set "file" to the path.
  3. Entries with file: null show as "coming soon" and can't be played.

  title / note have an English and a Spanish version (en / es).
  style: one of these, or a list for a mix, e.g.  style: ["Hip-hop", "Salsa"]
  Spell them exactly like this (they power the style buttons):
    Lowrider oldies, Soul, R&B, Funk, Doo-wop, Motown, Hip-hop, Rap, Trap, Boom bap, Corrido, Corrido tumbado,
    Norteño, Banda, Mariachi, Ranchera, Cumbia, Bachata, Salsa, Reggaeton, Bolero, Balada, Rock, Classic rock,
    Indie, Alternative, Punk, Metal, Country, Folk, Bluegrass, Pop, Dance, Electronic, Jazz, Blues, Gospel, Classical, Acoustic
  A style button only shows once at least one demo in that style has a file.
  Only post a demo you have the right to share: either made for this site,
  or a customer's song they said yes to in writing.
*/
window.DEMOS = [
  {
    file: "demos/hiphop-salsa-clip.m4a",
    style: ["Hip-hop", "Salsa"],
    title: { en: "The AO Story", es: "The AO Story" },
    note:  { en: "My story, hip-hop & salsa, English & Spanish", es: "Mi historia, hip-hop y salsa, en inglés y español" },
    label: "The AO Story"
  },
  {
    file: null,
    style: "Lowrider oldies",
    title: { en: "Low and Slow", es: "Low and Slow" },
    note:  { en: "My story, lowrider oldies, English", es: "Mi historia, oldies lowrider, en inglés" },
    label: "Low & Slow"
  },
  {
    file: null,
    style: "Hip-hop",
    title: { en: "Fourth Street", es: "Fourth Street" },
    note:  { en: "My story, hip-hop, English", es: "Mi historia, hip-hop, en inglés" },
    label: "Fourth Street"
  },
  {
    file: null,
    style: "Corrido",
    title: { en: "El Corrido de Mi Vida", es: "El corrido de mi vida" },
    note:  { en: "My story, corrido, Spanish", es: "Mi historia, corrido, en español" },
    label: "Mi Vida"
  },
  {
    file: null,
    style: "Pop",
    title: { en: "First Dance: Sofía & Marco", es: "Primer baile: Sofía y Marco" },
    note:  { en: "Wedding, Spanish and English", es: "Boda, en español e inglés" },
    label: "Sofía & Marco"
  },
  {
    file: null,
    style: "Balada",
    title: { en: "Mamá, Gracias", es: "Mamá, gracias" },
    note:  { en: "For mom, balada, Spanish", es: "Para mamá, balada, en español" },
    label: "Mamá"
  },
  {
    file: null,
    style: "Country",
    title: { en: "My Old Man's Hands", es: "Las manos de mi papá" },
    note:  { en: "For dad, country, English", es: "Para papá, country, en inglés" },
    label: "Dad"
  }
];
