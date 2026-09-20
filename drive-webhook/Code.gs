/**
 * OJNice — réception dans Google Drive des inscriptions envoyées depuis ojnice.com
 * (formulaire du stage CJS, et tout autre formulaire de type « stage »).
 *
 * À chaque inscription :
 *   1. une ligne est ajoutée à la feuille de calcul récapitulative ;
 *   2. un document Google est créé pour la personne, dans un sous-dossier par stage.
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

    return json_({ ok: true });
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

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
