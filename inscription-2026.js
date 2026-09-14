(function (global) {
  'use strict';
  var base='https://www.helloasso.com/associations/ojnice/adhesions/';
  var links={
    A:base+'saison-2026-2027-zone-a-inscription-et-re-inscription',
    B:base+'saison-2026-2027-zone-b-inscription-et-re-inscription',
    min:base+'saison-2026-2027-minimes',
    loisir:base+'judo-loisirs-et-veterans-2026-2027',
    competition:base+'inscriptions-elite-cadet-junior-senior'
  };
  var categories=[
    {id:'mat',name:'Maternelles',detail:'Éveil au judo'},
    {id:'prim',name:'Primaires',detail:'Judo enfants'},
    {id:'benj',name:'Benjamins',detail:'Judo jeunes'},
    {id:'min',name:'Minimes',detail:'Judo jeunes'},
    {id:'elite',name:'Poussins · Benjamins élite',detail:'Parcours compétition'},
    {id:'cadet',name:'Cadets',detail:'Loisirs ou compétition'},
    {id:'junior',name:'Juniors',detail:'Loisirs ou compétition'},
    {id:'senior',name:'Seniors',detail:'Loisirs ou compétition'},
    {id:'veteran',name:'Vétérans',detail:'Judo loisirs'},
    {id:'loisir',name:'Judo loisirs',detail:'Cadets à vétérans'},
    {id:'jjenf',name:'Jujitsu enfants',detail:'Découvrir les cours'},
    {id:'jjado',name:'Jujitsu ados · adultes',detail:'Découvrir les cours'}
  ];
  function adult(cat){return ['cadet','junior','senior'].indexOf(cat)!==-1;}
  function category(id){return categories.find(function(c){return c.id===id;});}
  function escape(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function eligible(d,cat,practice){
    var h=(d.h||'').toLowerCase();
    if(!category(cat))return false;
    if(cat==='mat')return /maternelle|4–8/.test(h);
    if(cat==='prim')return /primaire|4–8|6–9|cp/.test(h);
    if(cat==='benj')return /benjamin|9–14|10–15|cm1–6e/.test(h);
    if(cat==='min')return /minime|9–14|10–15/.test(h);
    if(cat==='elite')return /poussins/.test(h)&&/benjamins/.test(h);
    if(cat==='loisir'||cat==='veteran'||(adult(cat)&&practice==='loisir'))return /loisirs|vétérans/.test(h);
    if(adult(cat)&&practice==='competition')return /compétition/.test(h);
    return false;
  }
  function resolve(state,dojos){
    var cat=category(state.cat);
    if(!cat)return null;
    if(adult(cat.id)&&['loisir','competition'].indexOf(state.practice)===-1)return null;
    // A category-wide form always takes priority over a dojo's tariff area.
    if(cat.id==='min')return {url:links.min,title:'Judo minimes',price:'350 €',note:'Tarif annuel',kind:'fixed'};
    if(cat.id==='loisir'||cat.id==='veteran'||(adult(cat.id)&&state.practice==='loisir'))return {url:links.loisir,title:'Judo loisirs',price:'350 €',note:'Cadets, juniors, seniors et vétérans · tarif annuel',kind:'fixed'};
    if(adult(cat.id)&&state.practice==='competition')return {url:links.competition,title:'Élite & compétition',price:'Selon votre classement',note:'Même grille pour les cadets, juniors et seniors. Le montant correspondant à votre niveau est indiqué sur HelloAsso.',kind:'competition'};
    if(cat.id==='jjenf'||cat.id==='jjado')return {url:'#jjb',title:cat.name,price:'Découvrez les cours',note:'Horaires, lieux et inscription sur la page dédiée au jiu-jitsu brésilien.',kind:'jjb'};
    var dojo=dojos.find(function(d){return d.n===state.dojo;});
    if(!dojo||!eligible(dojo,cat.id,state.practice)||!links[dojo.zn])return null;
    return {url:links[dojo.zn],title:cat.name,price:dojo.zn==='A'?'395 € / 355 €':'265 €',note:dojo.zn==='A'?'395 € pour une première inscription · 355 € en réinscription.':'Tarif annuel d’inscription et de réinscription.',kind:'dojo',dojo:dojo};
  }
  function mount(config){
    var doc=global.document, root=doc.getElementById('registration-guide');
    var dojos=config.dojos, educators=config.educators;
    var state={cat:'',practice:'',dojo:''};
    var arrow='<span aria-hidden="true">↗</span>';
    var coaches=Array.prototype.slice.call(doc.querySelectorAll('#coach-grid .coach'));
    function compatible(){return dojos.filter(function(d){return eligible(d,state.cat,state.practice);}).sort(function(a,b){return a.n.localeCompare(b.n,'fr');});}
    function clearIncompatible(){if(state.dojo&&!compatible().some(function(d){return d.n===state.dojo;}))state.dojo='';}
    function render(focus){
      var cat=category(state.cat), needsPractice=cat&&adult(cat.id), ready=cat&&(!needsPractice||state.practice);
      var jjb=cat&&(cat.id==='jjenf'||cat.id==='jjado');
      var available=ready&&!jjb?compatible():[];
      var result=resolve(state,dojos);
      var selected=dojos.find(function(d){return d.n===state.dojo;});
      root.innerHTML='<div class="reg-intro"><span class="eyebrow">Saison 2026 / 2027</span><span class="reg-simple">Votre cours. Votre inscription.</span></div>'
        +'<section class="reg-step" aria-labelledby="reg-cat-title"><div class="reg-step-heading"><span class="reg-number">1</span><div><h2 id="reg-cat-title">Quelle est votre catégorie ?</h2><p>Un choix suffit pour commencer.</p></div></div>'
        +'<div class="reg-categories" role="group" aria-label="Catégorie obligatoire">'+categories.map(function(c){return '<button type="button" class="reg-category'+(state.cat===c.id?' selected':'')+'" data-cat="'+c.id+'" aria-pressed="'+(state.cat===c.id)+'"><b>'+escape(c.name)+'</b><span>'+escape(c.detail)+'</span><i aria-hidden="true">'+(state.cat===c.id?'✓':'↗')+'</i></button>';}).join('')+'</div>'
        +(!cat&&selected?'<p class="reg-pending">Dojo présélectionné : <strong>'+escape(selected.n)+'</strong>. Choisissez votre catégorie pour continuer.</p>':'')
        +'<p class="reg-help">Un doute sur votre catégorie ? <a href="tel:0650858881">Appelez-nous au 06 50 85 88 81</a>.</p></section>'
        +(needsPractice?'<section class="reg-step reg-practice"><h3>Vous pratiquez…</h3><div class="reg-practices" role="group" aria-label="Type de pratique"><button type="button" data-practice="loisir" class="'+(state.practice==='loisir'?'selected':'')+'" aria-pressed="'+(state.practice==='loisir')+'">Judo loisirs <span>Pratiquer pour le plaisir</span></button><button type="button" data-practice="competition" class="'+(state.practice==='competition'?'selected':'')+'" aria-pressed="'+(state.practice==='competition')+'">Élite / compétition <span>Parcours compétiteurs</span></button></div></section>':'')
        +(ready&&!jjb?'<section class="reg-step reg-dojo-step" aria-labelledby="reg-dojo-title"><div class="reg-step-heading"><span class="reg-number">2</span><div><h2 id="reg-dojo-title">Un dojo en tête ? <small>Facultatif</small></h2><p>'+(result&&result.kind!=='dojo'?'Votre formulaire est déjà prêt. Précisez un dojo pour voir ses horaires.':'Vous pouvez explorer les cours avant de choisir votre dojo.')+'</p></div></div><label class="reg-select-label" for="reg-dojo">Dojo souhaité</label><select id="reg-dojo"><option value="">Je ne sais pas encore</option>'+available.map(function(d){return '<option value="'+escape(d.n)+'"'+(state.dojo===d.n?' selected':'')+'>'+escape(d.n)+'</option>';}).join('')+'</select></section>':'')
        +'<div id="reg-result" aria-live="polite" aria-atomic="true">'+(result?'<section class="reg-result"><div class="reg-result-copy"><span class="eyebrow">'+(result.kind==='jjb'?'Votre discipline':'Votre inscription')+'</span><h2>'+escape(result.title)+'</h2><div class="reg-price'+(result.kind==='competition'||result.kind==='jjb'?' words':'')+'">'+escape(result.price)+'</div><p>'+escape(result.note)+'</p>'+(selected?'<p class="reg-selected-dojo"><b>'+escape(selected.n)+'</b><br>'+escape(selected.a)+'</p>':'')+'</div><div class="reg-result-action"><a id="registration-payment" class="btn btn-white" href="'+result.url+'"'+(result.kind==='jjb'?'':' target="_blank" rel="noopener noreferrer"')+'>'+(result.kind==='jjb'?'Voir les cours de JJB':'Continuer mon inscription')+arrow+'</a>'+(result.kind==='jjb'?'':'<span>Paiement sécurisé sur HelloAsso</span><a class="reg-trial" href="https://app.ojnice.com/essai">2 cours d’essai gratuits →</a>')+'</div></section>':ready?'<div class="reg-next"><b>Trouvez le cours qui vous convient.</b><p>Consultez les dojos ci-dessous. Une fois votre dojo choisi, son tarif et son formulaire s’affichent ici.</p></div>':'')+'</div>'
        +(ready&&!jjb?'<section class="reg-dojos" aria-labelledby="reg-dojos-title"><div class="reg-list-heading"><div><span class="eyebrow">Horaires & lieux</span><h2 id="reg-dojos-title">'+(selected?'Votre dojo':'Les dojos pour vous')+'</h2></div><span>'+available.length+' dojo'+(available.length>1?'s':'')+'</span></div><div class="reg-dojo-grid">'+available.filter(function(d){return !selected||selected.n===d.n;}).map(function(d){return '<article class="reg-dojo"><h3>'+escape(d.n)+'</h3><p class="reg-address">'+escape(d.a)+'</p><p class="reg-hours"><b>'+escape(d.j)+'</b><br>'+escape(d.h)+'</p><p class="reg-educators">'+d.e.map(function(k){var e=educators[k];return '<a href="tel:'+escape(e.tel)+'">'+escape(e.n)+'</a>';}).join(' · ')+'</p>'+(selected?'<button type="button" data-clear-dojo>Voir les autres dojos</button>':'<button type="button" data-choose-dojo="'+escape(d.n)+'">Choisir ce dojo <span aria-hidden="true">→</span></button>')+'</article>';}).join('')+'</div>'+(available.length?'':'<p>Contactez le club pour trouver le créneau adapté à votre catégorie.</p>')+'</section>':'');
      var coachKeys=[];
      available.filter(function(d){return !selected||selected.n===d.n;}).forEach(function(d){d.e.forEach(function(k){if(coachKeys.indexOf(k)<0)coachKeys.push(k);});});
      var n=0;
      coaches.forEach(function(el){var name=el.getAttribute('data-n');var ok=!!ready&&coachKeys.some(function(k){return name===educators[k].n;});el.style.display=ok?'':'none';if(ok){el.classList.add('in');n++;}});
      doc.getElementById('registration-coaches').hidden=!n;
      doc.getElementById('coach-count').textContent=n+' professeur'+(n>1?'s':'');
      if(focus){var target=root.querySelector(focus);if(target)target.focus({preventScroll:true});}
    }
    root.addEventListener('click',function(event){
      var cat=event.target.closest('[data-cat]'), practice=event.target.closest('[data-practice]'), choice=event.target.closest('[data-choose-dojo]'), clear=event.target.closest('[data-clear-dojo]');
      if(cat){state.cat=cat.dataset.cat;state.practice='';clearIncompatible();render('[data-cat="'+state.cat+'"]');}
      else if(practice){state.practice=practice.dataset.practice;clearIncompatible();render('[data-practice="'+state.practice+'"]');}
      else if(choice){var d=choice.dataset.chooseDojo;if(compatible().some(function(x){return x.n===d;})){state.dojo=d;render('#reg-dojo');doc.getElementById('reg-result').scrollIntoView({behavior:'smooth',block:'center'});}}
      else if(clear){state.dojo='';render('#reg-dojo');}
    });
    root.addEventListener('change',function(event){if(event.target.id==='reg-dojo'){state.dojo=event.target.value;clearIncompatible();render('#reg-dojo');}});
    render();
    return {selectDojo:function(name){if(!dojos.some(function(d){return d.n===name;}))return;state.dojo=name;if(state.cat)clearIncompatible();render();root.scrollIntoView({behavior:'smooth',block:'start'});}};
  }
  var api={mount:mount,resolve:resolve,eligible:eligible,categories:categories,links:links};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else global.OJNRegistration=api;
})(typeof window!=='undefined'?window:globalThis);
