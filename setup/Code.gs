/**
 * My Own Hit — order + signup handler (Google Apps Script web app)
 *
 * What it does on every song request from the site:
 *   1. Logs the order as a new row in this Google Sheet ("Orders" tab)
 *   2. Emails Alejandro the full order (Reply goes straight to the customer)
 *   3. Emails the customer a welcome: we got it, price within a day, song in 2-5 days
 * On every demo signup: logs it ("Signups" tab) and sends a short welcome.
 *
 * Emails send from the Google account that deploys this (alejandro@ojedaworks.com).
 * Setup steps are in setup/SETUP.md.
 */

var OWNER = "alejandro@ojedaworks.com";
var SENDER_NAME = { en: "My Own Hit", es: "Mi Propio Hit" };
var SITE = { en: "https://myownhit.com", es: "https://myownhit.com/es.html" };
var DELIVERY = { en: "2–5 days", es: "2 a 5 días" };

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data._honey) return reply_({ success: "true" }); // bot filled the hidden field: pretend OK, do nothing
    var lang = data.site_language === "es" ? "es" : "en";
    if (!isEmail_(data.email)) return reply_({ success: "false", message: "bad email" });

    if (data.form === "signup") {
      logRow_("Signups", ["Date", "Email", "Language"], [new Date(), data.email, lang]);
      sendSignupWelcome_(data, lang);
      MailApp.sendEmail({ to: OWNER, subject: "New demo signup: " + data.email, body: data.email + " (" + lang + ")" });
      return reply_({ success: "true" });
    }

    var fields = ORDER_FIELDS;
    var headers = ["Date", "Status"].concat(fields.map(function (f) { return f[1]; }));
    var row = [new Date(), "New"].concat(fields.map(function (f) { return data[f[0]] || ""; }));
    logRow_("Orders", headers, row);
    notifyOwner_(data, lang);
    sendWelcome_(data, lang);
    return reply_({ success: "true" });
  } catch (err) {
    console.error(err);
    return reply_({ success: "false", message: String(err) });
  }
}

// [form field name, label for the sheet + Alejandro's email]
var ORDER_FIELDS = [
  ["your_name", "Customer"], ["email", "Email"], ["phone", "Phone"],
  ["recipient_name", "Song for"], ["relationship", "Relationship"], ["occasion", "Occasion"],
  ["needed_by", "Needed by"], ["language", "Language"], ["style", "Style"], ["mood", "Mood"],
  ["voice", "Voice"], ["reference", "Sounds like"], ["story", "Story"], ["moments", "Must-have moments"],
  ["words_to_include", "Words to include"], ["avoid", "Keep out"], ["send_examples", "Wants example first"],
  ["business_use", "Business use"], ["heard_from", "Found us through"], ["site_language", "Site language"]
];

function notifyOwner_(d, lang) {
  var lines = ORDER_FIELDS.map(function (f) { return f[1] + ": " + (d[f[0]] || "-"); });
  MailApp.sendEmail({
    to: OWNER,
    replyTo: d.email,
    subject: "New song request: " + (d.recipient_name || "?") + " (" + (d.occasion || "") + ")",
    body: lines.join("\n") + "\n\nHit Reply to answer the customer. The welcome email already went out."
  });
}

function sendWelcome_(d, lang) {
  var t = WELCOME[lang];
  var name = esc_(first_(d.your_name));
  var who = esc_(d.recipient_name || "");
  var extras = [];
  if (d.send_examples) extras.push(t.example);
  if (d.needed_by) extras.push(t.date.replace("{date}", esc_(d.needed_by)));
  var tr = function (v) { return lang === "es" ? String(v || "").split(", ").map(function (x) { return ES_VALUES[x] || x; }).join(", ") : v; };
  var recap = [
    [t.r_for, who], [t.r_occ, esc_(d.occasion)], [t.r_lang, esc_(tr(d.language))],
    [t.r_style, esc_(tr(d.style) || t.youPick)], [t.r_mood, esc_(tr(d.mood))]
  ].filter(function (r) { return r[1]; })
   .map(function (r) { return '<tr><td style="padding:4px 16px 4px 0;color:#6b6790">' + r[0] + '</td><td style="padding:4px 0">' + r[1] + "</td></tr>"; }).join("");

  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#16133d;max-width:560px">' +
    "<p>" + t.hi.replace("{name}", name) + "</p>" +
    "<p>" + t.got.replace("{who}", "<b>" + who + "</b>") + "</p>" +
    "<p><b>" + t.nextTitle + "</b></p>" +
    "<ol style=\"padding-left:20px\">" +
      "<li>" + t.step1 + "</li>" +
      "<li>" + t.step2.replace("{eta}", "<b>" + DELIVERY[lang] + "</b>") + "</li>" +
      "<li>" + t.step3 + "</li>" +
    "</ol>" +
    extras.map(function (x) { return "<p>" + x + "</p>"; }).join("") +
    '<table style="border-collapse:collapse;font-size:15px;margin:8px 0 16px">' + recap + "</table>" +
    "<p>" + t.reply + "</p>" +
    "<p>" + t.sign + "<br>Alejandro<br><span style=\"color:#6b6790\">" + SENDER_NAME[lang] + " · " +
    '<a href="' + SITE[lang] + '" style="color:#e4007c">' + SITE[lang].replace("https://", "") + "</a></span></p>" +
    "</div>";

  GmailApp.sendEmail(d.email, t.subject.replace("{who}", d.recipient_name || ""), stripHtml_(html), {
    htmlBody: html, name: SENDER_NAME[lang], replyTo: OWNER
  });
}

function sendSignupWelcome_(d, lang) {
  var t = SIGNUP[lang];
  var html = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#16133d;max-width:560px">' +
    "<p>" + t.body + "</p><p>" + t.cta.replace("{url}", '<a href="' + SITE[lang] + '#start" style="color:#e4007c">' + SITE[lang].replace("https://", "") + "</a>") + "</p>" +
    "<p>Alejandro<br><span style=\"color:#6b6790\">" + SENDER_NAME[lang] + "</span></p></div>";
  GmailApp.sendEmail(d.email, t.subject, stripHtml_(html), { htmlBody: html, name: SENDER_NAME[lang], replyTo: OWNER });
}

var WELCOME = {
  en: {
    subject: "We got your story: {who}'s song",
    hi: "Hi {name},",
    got: "Thanks for telling us about {who}. Your story is in, and I read every word of these myself.",
    nextTitle: "Here's what happens next:",
    step1: "Within 1 day, I'll email you the price. Nothing gets made until you say yes.",
    step2: "Once you say yes, your song is usually ready in {eta}.",
    step3: "It comes to this inbox as an MP3. It's yours to keep, play, and share.",
    example: "You asked to hear an example first, so I'll send one in your style with the price.",
    date: "You need it by {date}. Got it. If that's tight, I'll tell you straight in my reply.",
    r_for: "Song for", r_occ: "Occasion", r_lang: "Language", r_style: "Style", r_mood: "Mood", youPick: "You pick",
    reply: "Remembered something else? Just reply to this email and add it. The more real detail, the better the song.",
    sign: "Talk soon,"
  },
  es: {
    subject: "Ya llegó tu historia: la canción de {who}",
    hi: "Hola {name}:",
    got: "Gracias por contarnos de {who}. Tu historia ya llegó, y yo mismo leo cada palabra.",
    nextTitle: "Lo que sigue:",
    step1: "En menos de 1 día te mando el precio por correo. No se hace nada hasta que tú digas que sí.",
    step2: "Cuando digas que sí, tu canción normalmente está lista en {eta}.",
    step3: "Te llega a este correo en MP3. Es tuya para guardarla, ponerla y compartirla.",
    example: "Pediste escuchar un ejemplo primero, así que te mando uno en tu estilo junto con el precio.",
    date: "La necesitas para el {date}. Anotado. Si está muy justo, te lo digo claro en mi respuesta.",
    r_for: "Canción para", r_occ: "Ocasión", r_lang: "Idioma", r_style: "Estilo", r_mood: "Ambiente", youPick: "Tú decide",
    reply: "¿Te acordaste de algo más? Solo responde a este correo y agrégalo. Entre más detalles reales, mejor sale la canción.",
    sign: "Hablamos pronto,"
  }
};

// The form sends some answers in English; show them in Spanish in the Spanish email.
var ES_VALUES = {
  "English": "Inglés", "Spanish": "Español", "Both": "Los dos", "You pick": "Tú decide",
  "Happy": "Alegre", "Romantic": "Romántico", "Emotional": "Emotivo", "Funny": "Chistoso", "Epic": "Épico",
  "Lowrider oldies": "Oldies lowrider"
};

var SIGNUP = {
  en: { subject: "You're on the list for new demos",
        body: "Thanks for signing up. When a new song is up, you'll get one email about it. That's it.",
        cta: "Ready to make one for someone? Start here: {url}" },
  es: { subject: "Ya estás en la lista de nuevos demos",
        body: "Gracias por registrarte. Cuando salga una canción nueva, te llega un correo. Nada más.",
        cta: "¿Listo para hacerle una a alguien? Empieza aquí: {url}" }
};

// ---------- helpers
function logRow_(tab, headers, row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tab) || ss.insertSheet(tab);
  if (sh.getLastRow() === 0) { sh.appendRow(headers); sh.setFrozenRows(1); sh.getRange(1, 1, 1, headers.length).setFontWeight("bold"); }
  sh.appendRow(row);
}
function reply_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function isEmail_(s) { return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function first_(s) { return String(s || "").trim().split(/\s+/)[0]; }
function esc_(s) { return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function stripHtml_(h) { return h.replace(/<li>/g, "\n- ").replace(/<\/td><td[^>]*>/g, ": ").replace(/<\/p>|<br>|<\/tr>|<\/ol>|<\/table>/g, "\n").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim(); }

// Run this once from the editor to test: it sends both emails to you, not a customer.
function testWelcome() {
  var fake = { your_name: "Alejandro Test", email: OWNER, recipient_name: "Rosa", occasion: "Birthday",
               language: "Spanish", style: "Cumbia", mood: "Happy", needed_by: "2026-10-20", send_examples: "Yes", site_language: "en" };
  sendWelcome_(fake, "en");
  sendWelcome_(fake, "es");
}
