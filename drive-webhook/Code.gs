/**
 * OJNice — réception dans Google Drive des inscriptions envoyées depuis ojnice.com
 * (formulaire du stage CJS, et tout autre formulaire de type « stage »).
 *
 * À chaque inscription :
 *   1. une ligne est ajoutée à la feuille de calcul récapitulative ;
 *   2. un document Google est créé pour la personne, dans un sous-dossier par stage.
 *   3. une notification est envoyée par e-mail au club si le site ne l'a pas déjà fait.
 *
 * Arborescence créée automatiquement dans le Drive du compte qui déploie ce script :
 *   OJNice — Inscriptions stages/
 *     Inscriptions — récapitulatif   (feuille de calcul)
 *     Inscription stage CJS — vacances d'automne 2026/
 *        DUPONT Léa — 2026-10-02 18h40   (un document par personne)
 *
 * Déploiement : voir README.md dans ce dossier.
 */

// Même valeur que la variable DRIVE_WEBHOOK_TOKEN dans Netlify. Mettez une phrase longue et secrète.
var TOKEN = 'CHANGE-MOI';

var FOLDER_NAME = 'OJNice — Inscriptions stages';
var SHEET_NAME  = 'Inscriptions — récapitulatif';
var EMAIL_TO   = 'infos.ojnice@gmail.com';
var TZ          = 'Europe/Paris';

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (TOKEN && data.token !== TOKEN) {
      return json_({ ok: false, error: 'unauthorized' });
    }

    var fields = data.fields || {};
    var when = new Date();
    var stageName = String(fields['Objet'] || data.label || 'Stage').trim();

    var root = folder_(FOLDER_NAME);
    var stageFolder = subfolder_(root, stageName);

    // 1. Ligne dans la feuille récapitulative
    var ss = sheet_(root, SHEET_NAME);
    var sh = ss.getSheets()[0];
    var headers = ensureHeaders_(sh, ['Reçu le', 'Type'].concat(Object.keys(fields)));
    sh.appendRow(headers.map(function (hname) {
      if (hname === 'Reçu le') return when;
      if (hname === 'Type') return data.label || data.type || '';
      return fields[hname] || '';
    }));

    // 2. Un document par personne
    var person = [fields['Nom'], fields['Prénom']].filter(Boolean).join(' ') || 'Inscription';
    var doc = DocumentApp.create(person + ' — ' + Utilities.formatDate(when, TZ, 'yyyy-MM-dd HH\'h\'mm'));
    var body = doc.getBody();
    body.appendParagraph(stageName).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    body.appendParagraph('Reçu le ' + Utilities.formatDate(when, TZ, 'dd/MM/yyyy à HH\'h\'mm') + ' depuis ojnice.com').setItalic(true);
    Object.keys(fields).forEach(function (k) {
      if (k === 'Objet') return;
      var p = body.appendParagraph('');
      p.appendText(k + ' : ').setBold(true);
      p.appendText(String(fields[k] || '—')).setBold(false);
    });
    doc.saveAndClose();
    DriveApp.getFileById(doc.getId()).moveTo(stageFolder);

    // 3. Notification e-mail sans mot de passe SMTP : Apps Script l'envoie
    // avec le compte Google qui possède et exécute ce déploiement.
    var emailSent = false;
    var emailError = '';
    if (data.notifyEmail !== false) {
      try {
        sendNotification_(data, fields, stageName);
        emailSent = true;
      } catch (mailErr) {
        emailError = String(mailErr);
      }
    }

    return json_({
      ok: true,
      driveSent: true,
      emailSent: emailSent,
      emailError: emailError
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Permet de vérifier que le déploiement répond (ouvrir l'URL /exec dans un navigateur).
function doGet() {
  return json_({ ok: true, service: 'ojnice-drive-webhook' });
}

function folder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function subfolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function sheet_(folder, name) {
  var it = folder.getFilesByName(name);
  if (it.hasNext()) return SpreadsheetApp.open(it.next());
  var ss = SpreadsheetApp.create(name);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  return ss;
}

// Ajoute les colonnes manquantes et renvoie l'ordre réel des colonnes de la feuille.
function ensureHeaders_(sh, wanted) {
  var last = sh.getLastColumn();
  var current = last ? sh.getRange(1, 1, 1, last).getValues()[0].map(String) : [];
  if (!current.length) {
    sh.getRange(1, 1, 1, wanted.length).setValues([wanted]).setFontWeight('bold');
    sh.setFrozenRows(1);
    return wanted.slice();
  }
  var missing = wanted.filter(function (w) { return current.indexOf(w) < 0; });
  if (missing.length) {
    sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return current.concat(missing);
}

function sendNotification_(data, fields, stageName) {
  var label = String(data.label || data.type || 'Stage');
  var subject = '[OJNice.com] ' + label + (stageName ? ' — ' + stageName : '');
  var keys = Object.keys(fields);
  var body = 'Nouvelle inscription depuis ojnice.com\n\nType : ' + label + '\n\n' +
    keys.map(function (key) {
      return key + ' : ' + String(fields[key] || '—');
    }).join('\n\n');
  var htmlBody = '<h2>Nouvelle inscription depuis ojnice.com</h2>' +
    '<p><strong>Type :</strong> ' + escapeHtml_(label) + '</p>' +
    keys.map(function (key) {
      return '<p><strong>' + escapeHtml_(key) + '</strong><br>' +
        escapeHtml_(String(fields[key] || '—')).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  var replyTo = String(fields['E-mail'] || fields['Email'] || '').trim();
  var message = {
    to: EMAIL_TO,
    subject: subject,
    body: body,
    htmlBody: htmlBody,
    name: 'Site Olympic Judo Nice'
  };
  if (replyTo) message.replyTo = replyTo;
  MailApp.sendEmail(message);
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Fonction manuelle sans envoi : elle sert uniquement à autoriser MailApp
// lors de l'installation initiale du script.
function authorizeMail() {
  return MailApp.getRemainingDailyQuota();
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
