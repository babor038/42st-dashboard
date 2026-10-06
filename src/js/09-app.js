/* ---------- shell ---------- */
function brandLogo(){return state.agency.logo||(window.FS42_CONFIG||{}).logoUrl||window.FS42_DEFAULT_LOGO||'';}
function renderBrand(){
  var b=$('#brand');if(!b)return;
  b.innerHTML='';
  var logo=brandLogo();
  if(logo){
    var w=document.createElement('div');w.className='logo-wrap'+(state.agency.plate==='light'?' plate-light':'');
    var im=document.createElement('img');im.className='logo';im.alt='Forty-Second Street';im.src=logo;w.appendChild(im);b.appendChild(w);
  }else{
    var t=document.createElement('div');t.className='bw';t.textContent='Forty-Second Street';b.appendChild(t);
  }
  var s=document.createElement('div');s.className='bs';s.textContent='Marketing, SEO and AI visibility dashboard';b.appendChild(s);
}
function renderNav(){
  $('#nav').innerHTML=VIEWS.map(function(v){return '<button data-act="nav" data-v="'+v.id+'"'+(state.view===v.id?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+v.icon+'</svg>'+esc(v.label)+'</button>';}).join('');
}
function currentView(){return VIEWS.filter(function(x){return x.id===state.view;})[0]||VIEWS[0];}
function renderTop(){
  var c=C(),v=currentView();
  var subtitle=c?esc(c.name)+(c.domain?' \u2022 '+esc(c.domain):''):'';
  var ctrls='';
  if(c){
    ctrls+='<select id="clientSel" aria-label="Client">'+state.order.map(function(id){return '<option value="'+id+'"'+(id===state.active?' selected':'')+'>'+esc(state.clients[id].name)+'</option>';}).join('')+'</select>'+
      '<select id="rangeSel" aria-label="Date range">'+[['7','Last 7 days'],['28','Last 28 days'],['90','Last 90 days'],['180','Last 180 days'],['365','Last 12 months'],['all','All data']].map(function(o){return '<option value="'+o[0]+'"'+(state.range===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>';
  }
  ctrls+='<span class="sync" id="syncStat" role="status"></span><button class="btn" data-act="theme" aria-label="Switch light or dark theme">Theme</button><button class="btn" data-act="print">Print or save PDF</button>';
  $('#top').innerHTML='<div><h1>'+esc(v.title)+'</h1><div class="sub">'+subtitle+'</div></div><div class="ctrls">'+ctrls+'</div>';
  setSync(syncState);
  var p=$('#printHead');p.innerHTML='';
  if(brandLogo()){var im=document.createElement('img');im.src=brandLogo();im.alt='';im.style.cssText='max-height:44px;max-width:220px;vertical-align:middle;margin-right:12px;'+(state.agency.plate==='light'?'':'background:#121314;padding:6px 8px;border-radius:4px');p.appendChild(im);}
  p.appendChild(document.createTextNode('42nd Street | '+(c?c.name:'')+' | '+v.title+(c&&c.sample?' | SAMPLE DATA':'')));
}
function emptyWorkspace(){
  return '<div class="hero"><h2>Add your first client</h2><p>Each client gets its own profile, imported data, keyword and service area tracking, AI visibility log and technical checklist. Start with a name, then fill in the Client info page.</p><button class="btn" data-act="newclient">Add client</button> <button class="btn" data-act="sample">Preview with sample data</button></div>';
}
function render(){
  post=[];tables={};
  var c=C();
  renderNav();renderTop();
  var html;
  if(!state.loaded){
    html='<div class="card tint" style="margin-top:14px"><h3>Connecting to storage</h3><p class="note" style="margin:0">Loading your workspace.</p></div>';
  }else if(!c&&state.view!=='data'){
    html=emptyWorkspace();
  }else{
    var fn={overview:viewOverview,clientinfo:viewClientInfo,search:viewSearch,tracking:viewTracking,traffic:viewTraffic,localpaid:viewLocalPaid,ai:viewAI,technical:viewTechnical,connections:viewConnections,data:viewData}[state.view]||viewOverview;
    try{html=fn(c);}catch(e){html='<div class="card"><h3>This view could not be drawn</h3><p class="note">'+esc(e.message)+'</p></div>';if(window.console)console.error(e);}
    if(c&&c.sample)html='<div class="card tint" style="margin-top:14px"><h3>Sample data</h3><p class="note" style="margin-bottom:0">Every number and name in this client was invented to show how the dashboard looks. Do not use it in a client report. Delete this client from Data and workspace when you are done.</p></div>'+html;
    if(c&&!c._loaded&&state.view!=='data')html='<div class="card tint" style="margin-top:14px"><p class="note" style="margin:0">Loading this client\u2019s data from storage.</p></div>'+html;
  }
  $('#view').innerHTML=html;
  post.forEach(function(f){try{f();}catch(e){if(window.console)console.error(e);}});
  $('#footNote').textContent='Prepared by 42nd Street. Figures come from the exports you import and are shown as provided by each platform.';
}
function applyTheme(){
  var r=document.documentElement;
  if(state.theme)r.setAttribute('data-theme',state.theme);else r.removeAttribute('data-theme');
}

/* ---------- events ---------- */
var pendingUpload=null;
function doImport(key,text){
  var c=C(),res=ingest(c,key,text,mergePref(key));
  if(res.err)return res;
  saveDataset(c,key);render();
  toast('Imported '+res.added+' rows into '+DS[key].grp+': '+DS[key].title+(res.skipped?' ('+res.skipped+' skipped)':'')+'.');
  return res;
}
function readFile(file,key){
  var fr=new FileReader();
  fr.onload=function(){var res=doImport(key,String(fr.result));if(res&&res.err)openDialog('Import problem','<div class="err">'+esc(res.err)+'</div>',[{label:'Close',primary:true}]);};
  fr.onerror=function(){toast('That file could not be read.');};
  fr.readAsText(file);
}
function setLogo(url){state.agency.logo=url;saveAgency();renderBrand();render();toast('Logo saved.');}
function processLogo(file){
  var isSvg=/svg/i.test(file.type)||/\.svg$/i.test(file.name),fr=new FileReader();
  if(isSvg){
    fr.onload=function(){
      var txt=String(fr.result);
      if(txt.length>180000){toast('That SVG is too large. Use one under about 180 KB.');return;}
      txt=txt.replace(/<script[\s\S]*?<\/script>/gi,'');
      var b64;try{b64=btoa(unescape(encodeURIComponent(txt)));}catch(e){toast('That SVG could not be read.');return;}
      setLogo('data:image/svg+xml;base64,'+b64);
    };
    fr.readAsText(file);
  }else{
    fr.onload=function(){
      var img=new Image();
      img.onload=function(){
        try{
          var sc=Math.min(1,520/img.width,160/img.height),cv=document.createElement('canvas');
          cv.width=Math.max(1,Math.round(img.width*sc));cv.height=Math.max(1,Math.round(img.height*sc));
          cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
          var url=cv.toDataURL('image/png');
          if(url.length>190000)url=cv.toDataURL('image/webp',0.85);
          if(url.length>190000){toast('That image is too large. Try a smaller or simpler file, or an SVG.');return;}
          setLogo(url);
        }catch(e){toast('That image could not be processed.');}
      };
      img.onerror=function(){toast('That image could not be read.');};
      img.src=String(fr.result);
    };
    fr.readAsDataURL(file);
  }
}
function slug(s){return String(s||'client').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'client';}
var NEEDS_NO_CLIENT=['nav','theme','print','newclient','sample','restore','logo-up','logo-rm','migrate','signout','more'];
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');
  if(!t){var th=e.target.closest('[data-sort]');if(th){var p=th.dataset.sort.split('|'),tb=tables[p[0]];if(tb){if(tb.sort===p[1])tb.dir=-tb.dir;else{tb.sort=p[1];tb.dir=tb.cols.filter(function(c){return c.k===p[1];})[0].num?-1:1;}drawTable(p[0]);}}return;}
  var a=t.dataset.act,c=C();
  if(!c&&NEEDS_NO_CLIENT.indexOf(a)<0)return;
  switch(a){
    case 'nav':state.view=t.dataset.v;formDirty=false;savePrefs();render();window.scrollTo(0,0);break;
    case 'theme':state.theme=state.theme==='light'?'dark':'light';applyTheme();savePrefs();break;
    case 'print':try{window.print();}catch(err){toast('Use your browser print shortcut (Ctrl or Cmd + P) to save a PDF.');}break;
    case 'eng':state.eng=t.dataset.e;savePrefs();render();break;
    case 'more':{var tb2=tables[t.dataset.tid];if(tb2){tb2.size+=25;drawTable(t.dataset.tid);}break;}
    case 'newclient':askText('Add client','Client name','',function(name){var nc=newClient(name);createClient(nc);state.view='clientinfo';savePrefs();render();toast('Added '+name+'. Fill in the client info to get started.');});break;
    case 'sample':{
      var old=state.order.filter(function(i){return state.clients[i].sample;})[0];
      if(old){state.active=old;subscribeData(old);}else createClient(buildSample());
      state.range='28';state.view='overview';savePrefs();render();window.scrollTo(0,0);toast('Sample client loaded. All numbers are invented.');break;}
    case 'delclient':confirmDlg('Delete '+c.name+'?','This permanently removes this client, its client info, tracking lists and all imported data from storage. Back it up first if you might need it.','Delete client',function(){deleteClient(c.id);render();toast('Client deleted.');});break;
    case 'backup':showText('Backup for '+c.name,JSON.stringify(stripClient(c)),'Copy or download this text and keep it somewhere safe. Use Restore from backup to load it again as a new client.',slug(c.name)+'-backup.json');break;
    case 'restore':openDialog('Restore from backup','<p>Paste a backup you saved earlier. It will be added as a new client.</p><textarea id="rtext" rows="8"></textarea><div id="rerr"></div>',[{label:'Cancel'},{label:'Restore',primary:true,fn:function(d){
      try{
        var o=JSON.parse($('#rtext',d).value);if(!o||typeof o!=='object'||!o.data)throw new Error('This does not look like a backup from this dashboard.');
        var nc=newClient(String(o.name||'Restored client')+' (restored)');
        nc.domain=String(o.domain||'');nc.brand=String(o.brand||'');nc.currency=String(o.currency||'$');nc.sample=!!o.sample;
        nc.info=o.info||{};nc.tracking=o.tracking||{};nc.checks=o.checks||{};nc.data=o.data||{};
        createClient(nc);render();toast('Backup restored as a new client.');
      }catch(err){$('#rerr',d).innerHTML='<div class="err">'+esc(err.message)+'</div>';return false;}}}]);break;
    case 'upload':pendingUpload=t.dataset.k;$('#file').accept='.csv,.tsv,.txt,text/csv,text/plain';$('#file').value='';$('#file').click();break;
    case 'paste':{var k=t.dataset.k;openDialog('Paste '+DS[k].grp+': '+DS[k].title,'<p>Paste CSV or tab separated text including the header row.</p><textarea id="ptext" rows="10" placeholder="'+esc(DS[k].cols.map(function(x){return x.al[0];}).join(','))+'"></textarea><div id="perr"></div>',[{label:'Cancel'},{label:'Import',primary:true,fn:function(d){var res=doImport(k,$('#ptext',d).value);if(res&&res.err){$('#perr',d).innerHTML='<div class="err">'+esc(res.err)+'</div>';return false;}}}]);break;}
    case 'template':{var k2=t.dataset.k;showText('Template: '+DS[k2].grp+', '+DS[k2].title,DS[k2].cols.map(function(x){return x.al[0];}).join(',')+'\n','Use this header row in a spreadsheet, add your data underneath, save as CSV and upload it. Native exports from the platform work without changes.',k2+'-template.csv');break;}
    case 'clear':{var k3=t.dataset.k;confirmDlg('Clear '+DS[k3].title+'?','This removes the imported '+DS[k3].grp+' '+DS[k3].title.toLowerCase()+' data for '+c.name+'.','Clear data',function(){delete c.data[k3];saveDataset(c,k3);render();toast('Data cleared.');});break;}
    case 'ai-add':{
      var date=parseDate($('#ai_date').value),plat=$('#ai_plat').value.trim(),prompt=$('#ai_prompt').value.trim();
      if(!date||!plat||!prompt){toast('Add a date, a platform and the prompt you tested.');break;}
      var row={date:date,platform:plat,prompt:prompt,mentioned:$('#ai_men').checked,cited:$('#ai_cit').checked,competitors:$('#ai_comp').value.trim(),notes:$('#ai_notes').value.trim(),id:uid()};
      var list=(c.data.ai_log||[]).slice(),kk=keyOf(DS.ai_log,row),idx=-1;
      list.forEach(function(r,i){if(keyOf(DS.ai_log,r)===kk)idx=i;});
      if(idx>=0)list[idx]=row;else list.push(row);
      c.data.ai_log=list;saveDataset(c,'ai_log');render();toast('Check added to the log.');break;}
    case 'ai-del':c.data.ai_log=(c.data.ai_log||[]).filter(function(r){return r.id!==t.dataset.id;});saveDataset(c,'ai_log');render();break;
    case 'save-info':saveInfo(c);render();toast('Client info saved.');break;
    case 'tr-bulk':{
      var kind=t.dataset.kind,ta=$('#bulk_'+kind),items=parseBulk(kind,ta?ta.value:'');
      if(!items.length){toast('Enter at least one line first.');break;}
      var cur=c.tracking[kind];
      if(cur.length+items.length>TRACK_MAX){toast('You can track up to '+TRACK_MAX+' in this list. Remove some first.');break;}
      c.tracking[kind]=cur.concat(items);saveClient(c);render();toast('Added '+items.length+'.');break;}
    case 'tr-del':{var kd=t.dataset.kind,did=t.dataset.id;c.tracking[kd]=c.tracking[kd].filter(function(x){return x.id!==did;});saveClient(c);render();break;}
    case 'tr-edit':editItem(c,t.dataset.kind,t.dataset.id);break;
    case 'rank-add':{
      var rd=parseDate($('#rk_date').value),ri=$('#rk_item').value,re=$('#rk_eng').value.trim()||'Google',rp=parseNum($('#rk_pos').value);
      if(!rd||!ri||rp==null||rp<=0){toast('Add a date, an item and a position.');break;}
      var rrow={date:rd,item:ri,engine:re,position:rp,impressions:parseNum($('#rk_imp').value),clicks:parseNum($('#rk_clk').value)};
      var rl=(c.data.rank_log||[]).slice(),rk=keyOf(DS.rank_log,rrow),ri2=-1;
      rl.forEach(function(r,i){if(keyOf(DS.rank_log,r)===rk)ri2=i;});
      if(ri2>=0)rl[ri2]=rrow;else rl.push(rrow);
      rl.sort(function(x,y){return x.date<y.date?-1:x.date>y.date?1:0;});
      c.data.rank_log=rl;saveDataset(c,'rank_log');state.rankItem=ri;render();toast('Ranking logged.');break;}
    case 'logo-up':pendingUpload='__logo__';$('#file').accept='image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp';$('#file').value='';$('#file').click();break;
    case 'logo-rm':state.agency.logo='';saveAgency();renderBrand();render();toast('Custom logo removed. The default logo is back.');break;
    case 'migrate':{var n=migrateLegacy();render();toast(n?'Moved '+n+' client'+(n===1?'':'s')+' to cloud storage.':'Nothing to move.');break;}
    case 'conn-refresh':case 'conn-google':case 'conn-bing':case 'conn-sync':case 'conn-disc':case 'conn-find':connAction(a,t,c);break;
    case 'signout':if(window.FS42Adapters&&FS42Adapters.supabase)FS42Adapters.supabase.signOut();break;
  }
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='clientSel'){state.active=t.value;formDirty=false;subscribeData(t.value);savePrefs();render();}
  else if(t.id==='rangeSel'){state.range=t.value;savePrefs();render();}
  else if(t.id==='file'){
    var f=t.files&&t.files[0];
    if(f&&pendingUpload==='__logo__')processLogo(f);
    else if(f&&pendingUpload)readFile(f,pendingUpload);
  }
  else if(t.id==='connDays'){connState.days=t.value;}
  else if(t.id==='plateSel'){state.agency.plate=t.value;saveAgency();renderBrand();render();}
  else if(t.id==='variantsChk'){state.variants=t.checked;savePrefs();render();}
  else if(t.id==='rankSel'){state.rankItem=t.value;render();}
  else if(t.dataset&&t.dataset.check){var c=C();c.checks[t.dataset.check]=Object.assign({},c.checks[t.dataset.check],{s:t.value});saveClient(c);render();}
  else if(t.dataset&&t.dataset.merge){mergePrefs[t.dataset.merge]=t.checked;}
});
var noteTimer=null;
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.dataset&&t.dataset.tq){var tb=tables[t.dataset.tq];if(tb){tb.q=t.value;tb.size=25;drawTable(t.dataset.tq);}}
  else if(t.dataset&&t.dataset.cnote){var c=C(),id=t.dataset.cnote,val=t.value;clearTimeout(noteTimer);noteTimer=setTimeout(function(){c.checks[id]=Object.assign({},c.checks[id],{n:val});saveClient(c);},400);}
  else if(t.dataset&&(t.dataset.info||t.dataset.comp))formDirty=true;
});
document.addEventListener('focusout',function(){
  if(!needRender)return;
  setTimeout(function(){if(needRender&&!formDirty&&!inputFocused())softRender();},60);
});
['dragover','dragleave','drop'].forEach(function(ev){
  document.addEventListener(ev,function(e){
    var z=e.target.closest&&e.target.closest('[data-drop]');
    if(ev==='dragover'){if(z){e.preventDefault();z.classList.add('drop');}return;}
    if(ev==='dragleave'){if(z)z.classList.remove('drop');return;}
    if(z){e.preventDefault();z.classList.remove('drop');var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];if(f)readFile(f,z.dataset.drop);}
  });
});

/* ---------- start ---------- */
(function(){
  try{
    var q=new URLSearchParams(location.search),ok=q.get('connected'),er=q.get('connect_error');
    if(ok||er){
      window.__fs42Return=ok?('Connected '+ok.toUpperCase()+'. Press Sync to pull the data.'):('Connection did not finish: '+er.replace(/_/g,' '));
      history.replaceState(null,'',location.pathname+location.hash);
    }
  }catch(e){}
})();
applyTheme();
renderBrand();
render();
initStorage();
