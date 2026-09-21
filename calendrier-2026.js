/* Calendrier en lecture seule : aucune inscription, aucun accès aux données privées. */
(() => {
  'use strict';
  const data = window.OJN_CALENDAR_DATA;
  const results = document.getElementById('cal-results');
  if (!results) return;
  if (!data) { results.textContent = 'Le calendrier est temporairement indisponible. Consultez les liens officiels ci-dessus.'; return; }
  const cats = {benjamins:'Benjamins',minimes:'Minimes',cadets:'Cadets',juniors:'Juniors',seniors:'Seniors'};
  const levels = {national:'National',regional:'Régional',departemental:'Départemental'};
  const kinds = {competition:'Compétition',stage:'Stage / regroupement',arbitrage:'Arbitrage',echeance:'Échéance de classement'};
  const state = {category:'',month:'',level:'',kind:'',status:'',search:''};
  const esc = s => String(s || '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const date = s => new Date(s + 'T12:00:00Z');
  const format = (s, options) => date(s).toLocaleDateString('fr-FR',{...options,timeZone:'UTC'});
  const months = Array.from({length:12},(_,i)=>`${i<4?2026:2027}-${String((i+8)%12+1).padStart(2,'0')}`);
  let visible = [];
  const overlaps = (e,m) => !m || (e.start.slice(0,7)<=m && e.end.slice(0,7)>=m);
  function matches(e, ignoreMonth=false) {
    const haystack = [e.title,e.place,e.note,...e.cats.map(c=>cats[c])].join(' ');
    return (!state.category || e.cats.includes(state.category)) && (!state.level || e.level===state.level) && (!state.kind || e.kind===state.kind) && (!state.status || e.status===state.status) && (ignoreMonth || overlaps(e,state.month)) && (!state.search || normalize(haystack).includes(normalize(state.search)));
  }
  function badge(e) {
    if(e.status!=='published') return 'À confirmer';
    return 'Publié · ' + (e.sources.some(s=>s.startsWith('france'))?'France Judo':e.sources.some(s=>s.startsWith('cd'))?'CD06':'Ligue Sud');
  }
  function eventHTML(e) {
    const sameMonth=e.start.slice(0,7)===e.end.slice(0,7);
    const day = e.start===e.end?format(e.start,{day:'numeric'}):sameMonth?`${format(e.start,{day:'numeric'})}–${format(e.end,{day:'numeric'})}`:format(e.start,{day:'numeric'});
    const month = sameMonth?format(e.start,{month:'short',year:'numeric'}):`${format(e.start,{month:'short'})} → ${format(e.end,{day:'numeric',month:'short',year:'numeric'})}`;
    return `<article class="cal-event" data-event-id="${esc(e.id)}"><div class="cal-event-main"><div class="cal-date"><strong>${esc(day)}</strong><span>${esc(month)}</span>${e.status==='provisional'?'<small>Date à confirmer</small>':''}</div><div><h3>${esc(e.title)}</h3><p class="cal-place">${esc(e.place)}</p><div class="cal-tags">${e.cats.map(c=>`<span>${cats[c]}</span>`).join('')}<span>${kinds[e.kind]}</span></div></div><div class="cal-event-flags"><span class="cal-level ${e.level}">${levels[e.level]}</span><span class="cal-status ${e.status}">${badge(e)}</span></div></div><details class="cal-detail"><summary>Détails et sources</summary><div class="cal-detail-content"><p><strong>Horaires :</strong> ${esc(e.time)}</p><p><strong>Participation :</strong> ${esc(e.access)}</p>${e.note?`<p>${esc(e.note)}</p>`:''}<ul>${e.sources.map(key=>{const s=data.sources[key];return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`;}).join('')}</ul><p>Vérifié le ${format(data.checkedAt,{day:'numeric',month:'long',year:'numeric'})}. Les organisateurs peuvent modifier les dates et lieux.</p></div></details></article>`;
  }
  document.getElementById('cal-categories').innerHTML = Object.entries({'':'Toutes',...cats}).map(([key,label])=>`<button type="button" data-category="${key}" aria-pressed="${key===''}">${label}</button>`).join('');
  document.getElementById('cal-months').innerHTML = [''].concat(months).map(m=>`<button type="button" data-month="${m}" aria-pressed="${!m}">${m?esc(format(m+'-01',{month:'short'})):'Toute l’année'}<span>${m?m.slice(0,4):data.season}</span><span class="cal-month-count"></span></button>`).join('');
  function render() {
    visible=data.events.filter(e=>matches(e));
    const provisional=visible.filter(e=>e.status==='provisional').length;
    document.getElementById('cal-count').textContent=`${visible.length} rendez-vous${state.category?' · '+cats[state.category]:''}${provisional?' · '+provisional+' à confirmer':''}`;
    document.getElementById('cal-export').disabled=!visible.length;
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===state.category)));
    document.querySelectorAll('[data-month]').forEach(b=>{
      b.setAttribute('aria-pressed',String(b.dataset.month===state.month));
      b.querySelector('.cal-month-count').textContent=data.events.filter(e=>matches(e,true)&&overlaps(e,b.dataset.month)).length+' RDV';
    });
    const groups = new Map();
    visible.forEach(e=>{const m=state.month||e.start.slice(0,7);if(!groups.has(m)) groups.set(m,[]);groups.get(m).push(e);});
    results.innerHTML=visible.length?Array.from(groups,([m,events])=>`<section class="cal-month-section"><h2>${esc(format(m+'-01',{month:'long',year:'numeric'}))} <small>${events.length} RDV</small></h2>${events.map(eventHTML).join('')}</section>`).join(''):'<div class="cal-empty"><h2>Aucun rendez-vous dans cette sélection</h2><p>Modifiez les filtres. Cela ne signifie pas qu’aucune épreuve n’aura lieu : les calendriers officiels continuent de se compléter.</p></div>';
  }
  document.getElementById('cal-categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(b){state.category=b.dataset.category;render();}});
  document.getElementById('cal-months').addEventListener('click',e=>{const b=e.target.closest('[data-month]');if(b){state.month=b.dataset.month;render();}});
  ['level','kind','status'].forEach(key=>document.getElementById('cal-'+key).addEventListener('change',e=>{state[key]=e.target.value;render();}));
  document.getElementById('cal-search').addEventListener('input',e=>{state.search=e.target.value.trim();render();});
  document.getElementById('cal-reset').addEventListener('click',()=>{Object.keys(state).forEach(k=>state[k]='');['level','kind','status','search'].forEach(k=>document.getElementById('cal-'+k).value='');render();});
  const icsEscape = s => String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  function fold(line) {
    let out='',part='',bytes=0;
    for(const char of line){const n=new TextEncoder().encode(char).length;if(bytes+n>75){out+=part+'\r\n';part=' ';bytes=1;}part+=char;bytes+=n;}
    return out+part;
  }
  document.getElementById('cal-export').addEventListener('click',()=>{
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//OJNice//Calendrier 2026-2027//FR','CALSCALE:GREGORIAN','X-WR-CALNAME:OJNice 2026-2027'];
    visible.forEach(e=>{
      const end=date(e.end);end.setUTCDate(end.getUTCDate()+1);
      const sources=e.sources.map(k=>new URL(data.sources[k].url,location.href).href);
      const description=[badge(e),e.cats.map(c=>cats[c]).join(' / '),levels[e.level],e.time,e.access,e.note,'Dates susceptibles de modification. Import ponctuel, non synchronisé.',...sources].filter(Boolean).join('\n');
      lines.push('BEGIN:VEVENT',`UID:${e.id}@ojnice.com`,`DTSTAMP:${data.checkedAt.replace(/-/g,'')}T000000Z`,`DTSTART;VALUE=DATE:${e.start.replace(/-/g,'')}`,`DTEND;VALUE=DATE:${end.toISOString().slice(0,10).replace(/-/g,'')}`,`SUMMARY:${icsEscape((e.status==='provisional'?'[À confirmer] ':'')+e.title)}`,`LOCATION:${icsEscape(e.place)}`,`DESCRIPTION:${icsEscape(description)}`,`URL:${sources[0]}`,'TRANSP:TRANSPARENT','END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const url=URL.createObjectURL(new Blob([lines.map(fold).join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`ojnice-calendrier-2026-2027${state.category?'-'+state.category:''}.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  document.getElementById('cal-print').addEventListener('click',()=>{document.body.classList.add('cal-printing');window.print();});
  window.addEventListener('beforeprint',()=>{if(location.hash==='#calendrier') document.body.classList.add('cal-printing');});
  window.addEventListener('afterprint',()=>document.body.classList.remove('cal-printing'));
  render();
})();
