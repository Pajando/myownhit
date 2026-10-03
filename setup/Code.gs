/**
 * My Own Hit — lead + order handler (Google Apps Script web app)
 *
 * When someone enters their email on the site ("lead"):
 *   - Logs it in the "Leads" tab with Status "Started"
 *   - Emails them every question, so they can answer by replying (or with a voice memo)
 *     instead of on the site, whichever is easier
 * When they finish the questions ("song"):
 *   1. Logs the order as a new row in the "Orders" tab
 *   2. Marks their lead "Finished" (so "Started" rows = people who didn't finish)
 *   3. Emails Alejandro the full order (Reply goes straight to the customer)
 *   4. Emails the customer a welcome: we got it, we confirm within 2-3 days, song in 2-5 days after that
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

    if (data.form === "lead") {
      logRow_("Leads", ["Date", "Status", "Email", "Song for", "Language"], [new Date(), "Started", data.email, data.recipient_name || "", lang]);
      sendQuestions_(data, lang);
      return reply_({ success: "true" });
    }

    var fields = ORDER_FIELDS;
    var headers = ["Date", "Status"].concat(fields.map(function (f) { return f[1]; }));
    var row = [new Date(), "New"].concat(fields.map(function (f) { return data[f[0]] || ""; }));
    logRow_("Orders", headers, row);
    markLeadFinished_(data.email);
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
  ["songs", "Songs ordered"], ["song_number", "This is song"], ["about", "About (me / someone)"],
  ["recipient_name", "Song for"], ["relationship", "Relationship"], ["occasion", "Occasion"],
  ["needed_by", "Needed by"], ["language", "Language"], ["style", "Style"], ["mood", "Mood"],
  ["voice", "Voice"], ["reference", "Sounds like"], ["story", "Story"], ["moments", "Must-have moments"],
  ["words_to_include", "Words to include"], ["pronunciation", "How to say the names"], ["avoid", "Keep out"], ["lyrics", "Cursing OK?"], ["title_idea", "Title idea"], ["send_examples", "Wants demos first"],
  ["heard_from", "Found us through"], ["site_language", "Site language"]
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
    [t.r_for, d.about === "me" ? "" : who], [t.r_occ, esc_(d.occasion)], [t.r_lang, esc_(tr(d.language))],
    [t.r_style, esc_(tr(d.style) || t.youPick)], [t.r_mood, esc_(tr(d.mood))]
  ].filter(function (r) { return r[1]; })
   .map(function (r) { return '<tr><td style="padding:4px 16px 4px 0;color:#6b6790">' + r[0] + '</td><td style="padding:4px 0">' + r[1] + "</td></tr>"; }).join("");

  var html =
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55;color:#16133d;max-width:560px">' +
    "<p>" + t.hi.replace("{name}", name) + "</p>" +
    "<p>" + (d.about === "me" ? t.gotMe : t.got.replace("{who}", "<b>" + who + "</b>")) + "</p>" +
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

var START = { en: "https://myownhit.com/start.html", es: "https://myownhit.com/empezar.html" };

// Plain text on purpose: it's meant to be replied to, with answers typed under each question.
function sendQuestions_(d, lang) {
  var q = QUESTIONS[lang];
  var link = START[lang] + "?about=" + (d.about === "someone" ? "someone" : "me") + (d.recipient_name ? "&name=" + encodeURIComponent(d.recipient_name) : "");
  var body = q.intro.replace("{link}", link) + "\n\n" +
    q.list.map(function (x, i) { return (i + 1) + ". " + x + "\n\n"; }).join("") +
    q.outro;
  GmailApp.sendEmail(d.email, q.subject, body, { name: SENDER_NAME[lang], replyTo: OWNER });
}

var QUESTIONS = {
  en: {
    subject: "Your song: the questions (answer here or on the site)",
    intro: "Hi! Thanks for starting your song. Two ways to give us the details. Pick whichever is easier:\n\n" +
      "ON THE SITE (about 5 minutes):\n{link}\n\n" +
      "BY EMAIL: hit Reply and type your answers under each question. Short answers are fine. Skip anything you're not sure about.\n" +
      "Easier to talk than type? Record a voice memo telling the story and attach it to your reply.\n\n" +
      "----------",
    list: [
      "Who is the song about? You, or someone else? (If someone else: their name and who they are to you)",
      "How do you say the names? Spell them the way they sound.",
      "What's the occasion? (Your life story, something you overcame, family, birthday, wedding, anniversary, tribute...)",
      "The story: where you (or they) come from, what you've been through, who matters most.",
      "Moments that HAVE to be in the song:",
      "Nicknames or things you (or they) always say:",
      "Anything to keep out of the song?",
      "Language: English, Spanish, or both?",
      "Style: corrido, oldies, R&B, country, banda, cumbia, hip-hop, rock... or \"you pick\"",
      "Mood: happy, romantic, emotional, funny, or epic?",
      "Voice: male, female, duet, or no preference?",
      "A song or artist it should feel like:",
      "Is cursing OK in the song? Yes or no. (We need an answer on this one.)",
      "Song title idea (optional):",
      "When do you need it?",
      "How many songs?",
      "Your name and phone number:"
    ],
    outro: "----------\n\nWhat happens next: I'll send you a link to pay, then within 2–3 days I'll go over your answers. If anything needs clarifying, I'll text or email you a quick question. After that, your song (3–4 minutes) is usually ready in 2–5 days.\n\nAlejandro\nMy Own Hit"
  },
  es: {
    subject: "Tu canción: las preguntas (contesta aquí o en la página)",
    intro: "¡Hola! Gracias por empezar tu canción. Hay dos formas de darnos los detalles. Escoge la más fácil:\n\n" +
      "EN LA PÁGINA (unos 5 minutos):\n{link}\n\n" +
      "POR CORREO: dale Responder y escribe tus respuestas debajo de cada pregunta. Respuestas cortas están bien. Sáltate lo que no sepas.\n" +
      "¿Es más fácil hablar que escribir? Graba una nota de voz contando la historia y mándala en tu respuesta.\n\n" +
      "----------",
    list: [
      "¿De quién es la canción? ¿Tuya o de alguien más? (Si es de alguien más: su nombre y qué es de ti)",
      "¿Cómo se pronuncian los nombres? Escríbelos como suenan.",
      "¿Cuál es la ocasión? (La historia de tu vida, algo que superaste, la familia, cumpleaños, boda, aniversario, homenaje...)",
      "La historia: de dónde vienes (o viene), lo que has vivido, quién importa más.",
      "Momentos que TIENEN que estar en la canción:",
      "Apodos o cosas que siempre dices (o dice):",
      "¿Algo que no deba ir en la canción?",
      "Idioma: ¿español, inglés o los dos?",
      "Estilo: corrido, oldies, R&B, country, banda, cumbia, hip-hop, rock... o \"tú decide\"",
      "Ambiente: ¿alegre, romántico, emotivo, chistoso o épico?",
      "Voz: ¿hombre, mujer, dueto o te da igual?",
      "Una canción o artista que se parezca:",
      "¿Está bien que la canción tenga groserías? Sí o no. (Esta sí necesitamos que la contestes.)",
      "Idea para el título (opcional):",
      "¿Para cuándo la necesitas?",
      "¿Cuántas canciones?",
      "Tu nombre y número de teléfono:"
    ],
    outro: "----------\n\nLo que sigue: te mando un link para pagar, y en 2 a 3 días reviso tus respuestas. Si algo necesita aclararse, te escribo o te mando un mensaje con una pregunta rápida. Después, tu canción (de 3 a 4 minutos) normalmente está lista en 2 a 5 días.\n\nAlejandro\nMi Propio Hit"
  }
};

var WELCOME = {
  en: {
    subject: "We got your story: {who}'s song",
    hi: "Hi {name},",
    got: "Thanks for telling us about {who}. Your story is in, and I read every word of these myself.",
    gotMe: "Thanks for trusting us with your story. It's in, and I read every word of these myself.",
    nextTitle: "Here's what happens next:",
    step1: "Within 2–3 days I'll go over your story. If anything needs clarifying, I'll text or email you a quick question.",
    step2: "Once everything's set, your song (3–4 minutes) is usually ready in {eta}.",
    step3: "It comes to this inbox as an MP3. It's yours to keep, play, and share.",
    example: "You asked to hear demos first, so I'll send some in your style when I confirm the details.",
    date: "You need it by {date}. Got it. If that's tight, I'll tell you straight in my reply.",
    r_for: "Song for", r_occ: "Occasion", r_lang: "Language", r_style: "Style", r_mood: "Mood", youPick: "You pick",
    reply: "Remembered something else? Just reply to this email and add it. The more real detail, the better the song.",
    sign: "Talk soon,"
  },
  es: {
    subject: "Ya llegó tu historia: la canción de {who}",
    hi: "Hola {name}:",
    got: "Gracias por contarnos de {who}. Tu historia ya llegó, y yo mismo leo cada palabra.",
    gotMe: "Gracias por confiarnos tu historia. Ya llegó, y yo mismo leo cada palabra.",
    nextTitle: "Lo que sigue:",
    step1: "En 2 a 3 días reviso tu historia. Si algo necesita aclararse, te escribo o te mando un mensaje con una pregunta rápida.",
    step2: "Cuando todo esté listo, tu canción (de 3 a 4 minutos) normalmente está lista en {eta}.",
    step3: "Te llega a este correo en MP3. Es tuya para guardarla, ponerla y compartirla.",
    example: "Pediste escuchar demos primero, así que te mando algunos en tu estilo cuando confirme los detalles.",
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

// ---------- helpers
function markLeadFinished_(email) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads");
  if (!sh || sh.getLastRow() < 2) return;
  var vals = sh.getRange(2, 2, sh.getLastRow() - 1, 2).getValues(); // Status, Email
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][1]).toLowerCase() === String(email).toLowerCase()) { sh.getRange(i + 2, 2).setValue("Finished"); return; }
  }
}
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
