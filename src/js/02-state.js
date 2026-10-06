/* ---------- state and storage ----------
   All persistence goes through a "doc store" with the same shape as the claude.ai
   `db` capability: db.doc(path).get/set/delete/onSnapshot and db.collection(path).get/onSnapshot.
   Three adapters implement it (see src/adapters): claude (claude.ai artifact), supabase (SaaS),
   local (browser demo mode). The rest of the app never knows which one is active. */
var LKEY='fs42_dashboard_v1'; /* legacy single-file local key, read only for one-time migration */
var state={v:2,loaded:false,active:null,order:[],clients:{},range:'28',theme:'',view:'overview',eng:'google',variants:false,rankItem:'',agency:{logo:'',plate:'dark'},readOnly:false};
var cloud={db:null,kind:'',dl:null,uid:null,mode:'loading'};
var syncState='loading';
function syncText(s){
  if(s==='loading')return 'Connecting to storage';
  if(s==='saving')return 'Saving';
  if(s==='error')return 'Could not save, please retry';
  return cloud.kind==='local'?'Saved in this browser (demo mode)':'Saved to cloud';
}
function setSync(s){syncState=s;var e=document.getElementById('syncStat');if(e){e.setAttribute('data-s',s==='saved'&&cloud.kind==='local'?'local':s);e.textContent=syncText(s);}}
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function blankClient(id){return {id:id,name:'New client',domain:'',brand:'',currency:'$',sample:false,created:Date.now(),info:{},tracking:{keywords:[],areas:[],services:[]},checks:{},data:{},_cc:{},_ver:{},_dirty:{}};}
function normClient(c){
  c.info=c.info||{};c.tracking=c.tracking||{};
  ['keywords','areas','services'].forEach(function(k){if(!Array.isArray(c.tracking[k]))c.tracking[k]=[];});
  c.checks=c.checks||{};c.data=c.data||{};c._cc=c._cc||{};c._ver=c._ver||{};c._dirty=c._dirty||{};
  if(!c.created)c.created=Date.now();
  return c;
}
function newClient(name){var c=blankClient(uid());c.name=name||'New client';return c;}
function C(){return state.clients[state.active]||null;}
function D(c,k){return (c&&c.data&&c.data[k])||[];}
function clientDoc(c){return {name:c.name,domain:c.domain,brand:c.brand,currency:c.currency,sample:!!c.sample,created:c.created,info:c.info,tracking:c.tracking,checks:c.checks};}
function stripClient(c){var o={};Object.keys(c).forEach(function(k){if(k.charAt(0)!=='_')o[k]=c[k];});return o;}
function readLegacy(){try{var raw=localStorage.getItem(LKEY);if(!raw)return null;var s=JSON.parse(raw);return (s&&s.clients&&s.order&&s.order.length)?s:null;}catch(e){return null;}}

/* write queue: one write at a time per path, latest change wins */
var wq={},pending=0,tomb={};
function handleErr(e){
  var code=e&&e.code;setSync('error');
  if(code==='quota_exceeded')toast('Storage is full. Delete old clients or data to free space.');
  else if(code==='invalid_argument')toast('Storage could not save that change'+(e&&e.message?': '+e.message:'.'));
  else if(code==='revoked'||code==='not_granted')toast('Your access to storage ended. Reload the page.');
  else toast('Could not reach storage. Your last change may not be saved.');
  if(window.console)console.error(e);
}
function qwrite(path,build){
  if(cloud.mode!=='cloud')return;
  if(state.readOnly){toast('You have view-only access, so this change was not saved.');return;}
  var q=wq[path]||(wq[path]={busy:false,next:null});
  q.next=build;if(q.busy)return;
  q.busy=true;pending++;setSync('saving');
  (function run(){
    var f=q.next;q.next=null;
    if(!f){q.busy=false;pending--;if(!pending&&syncState==='saving')setSync('saved');return;}
    var pr;try{pr=f();}catch(e){pr=Promise.reject(e);}
    Promise.resolve(pr).then(run,function(e){handleErr(e);run();});
  })();
}
function isBusy(path){var q=wq[path];return !!(q&&q.busy);}

var prefTimer=null;
function savePrefsNow(){
  if(cloud.mode!=='cloud'||!cloud.uid)return;
  qwrite('prefs',function(){return cloud.db.doc('data/users/'+cloud.uid+'/prefs').set({theme:state.theme,range:state.range,view:state.view,active:state.active||'',eng:state.eng,variants:!!state.variants});});
}
function savePrefs(){clearTimeout(prefTimer);prefTimer=setTimeout(savePrefsNow,600);}
function saveClient(c){
  if(cloud.mode!=='cloud')return;
  qwrite('clients/'+c.id,function(){return cloud.db.doc('clients/'+c.id).set(clientDoc(c));});
}
function saveAgency(){
  if(cloud.mode!=='cloud')return;
  qwrite('agency',function(){return cloud.db.doc('agency/main').set({logo:state.agency.logo||'',plate:state.agency.plate||'dark'});});
}
/* Datasets are split into chunk documents so each stays well under the 256 KiB document limit. */
function chunkRows(rows){
  var out=[],cur=[],size=0;
  rows.forEach(function(r){var l=JSON.stringify(r).length+1;if(cur.length&&size+l>80000){out.push(cur);cur=[];size=0;}cur.push(r);size+=l;});
  if(cur.length)out.push(cur);return out;
}
function writeDataset(c,key){
  var rows=c.data[key]||[],chunks=chunkRows(rows),v=Date.now(),base='clients/'+c.id+'/data/',old=c._cc[key]||0,p=Promise.resolve();
  chunks.forEach(function(ch,i){p=p.then(function(){return cloud.db.doc(base+key+'-'+i).set({key:key,i:i,of:chunks.length,v:v,rows:ch});});});
  for(var j=chunks.length;j<old;j++){(function(j){p=p.then(function(){return cloud.db.doc(base+key+'-'+j).delete();});})(j);}
  return p.then(function(){c._cc[key]=chunks.length;if(chunks.length)c._ver[key]=v;else delete c._ver[key];});
}
function saveDataset(c,key){
  if(cloud.mode!=='cloud')return;
  c._dirty[key]=1;
  qwrite('data:'+c.id,function(){
    var keys=Object.keys(c._dirty);c._dirty={};
    return keys.reduce(function(p,k){return p.then(function(){return writeDataset(c,k);});},Promise.resolve());
  });
}
function createClient(c){
  normClient(c);state.clients[c.id]=c;state.order.push(c.id);state.active=c.id;
  if(cloud.mode!=='cloud')return;
  c._creating=true;
  qwrite('clients/'+c.id,function(){return cloud.db.doc('clients/'+c.id).set(clientDoc(c)).then(function(){c._creating=false;});});
  Object.keys(c.data).forEach(function(k){if(c.data[k]&&c.data[k].length)saveDataset(c,k);});
  subscribeData(c.id);savePrefs();
}
function deleteClient(id){
  delete state.clients[id];state.order=state.order.filter(function(i){return i!==id;});
  if(state.active===id)state.active=state.order[0]||null;
  if(cloud.mode!=='cloud')return;
  tomb[id]=1;
  if(dataFor===id){if(dataUnsub){try{dataUnsub();}catch(e){}}dataUnsub=null;dataFor=null;}
  subscribeData(state.active);
  qwrite('del:'+id,function(){
    var base='clients/'+id+'/data';
    var A=window.FS42Adapters&&window.FS42Adapters.supabase;
    var drop=(cloud.kind==='supabase'&&A&&A.api)?A.api.invoke('connect',{action:'disconnect-all',clientId:id}).catch(function(){}):Promise.resolve();
    return drop.then(function(){return cloud.db.collection(base).get();}).then(function(snap){
      return snap.docs.reduce(function(p,d){return p.then(function(){return cloud.db.doc(base+'/'+d.id).delete();});},Promise.resolve());
    }).then(function(){return cloud.db.doc('clients/'+id).delete();}).then(function(){delete tomb[id];});
  });
  savePrefs();
}

/* live subscriptions */
var needRender=false,formDirty=false;
function inputFocused(){var a=document.activeElement,v=document.getElementById('view');return !!(a&&v&&v.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName));}
function softRender(){if(formDirty||inputFocused()){needRender=true;return;}needRender=false;render();}
var dataUnsub=null,dataFor=null;
function subscribeData(id){
  if(cloud.mode!=='cloud'||dataFor===id)return;
  if(dataUnsub){try{dataUnsub();}catch(e){}dataUnsub=null;}
  dataFor=id;if(!id)return;
  dataUnsub=cloud.db.collection('clients/'+id+'/data').onSnapshot(function(snap){onData(id,snap);},function(e){handleErr(e);});
}
function onData(id,snap){
  var c=state.clients[id];if(!c)return;
  var store={};
  snap.docs.forEach(function(d){var x=d.data();if(x&&x.key&&DS[x.key]&&Array.isArray(x.rows))(store[x.key]=store[x.key]||[]).push(x);});
  var busy=isBusy('data:'+id),changed=false;
  Object.keys(store).forEach(function(k){
    var arr=store[k];
    c._cc[k]=Math.max.apply(null,arr.map(function(x){return x.i+1;}));
    if(busy||c._dirty[k])return;
    var vs=Array.from(new Set(arr.map(function(x){return x.v;}))).sort(function(a,b){return b-a;});
    for(var vi=0;vi<vs.length;vi++){
      var set=arr.filter(function(x){return x.v===vs[vi];}),of=set[0].of,idx={};
      set.forEach(function(x){idx[x.i]=x;});
      var ok=set.length===of;for(var j=0;j<of&&ok;j++)if(!idx[j])ok=false;
      if(!ok)continue;
      if(c._ver[k]!==vs[vi]){
        var rows=[];for(var j2=0;j2<of;j2++)rows=rows.concat(idx[j2].rows);
        rows=clone(rows);
        if(JSON.stringify(rows)!==JSON.stringify(c.data[k]||[])){c.data[k]=rows;changed=true;}
        c._ver[k]=vs[vi];
      }
      break;
    }
  });
  if(!busy)Object.keys(c._ver).forEach(function(k){if(!store[k]&&!c._dirty[k]){delete c._ver[k];delete c._cc[k];if(c.data[k]){delete c.data[k];changed=true;}}});
  var first=!c._loaded;c._loaded=true;
  if(changed||first)softRender();
}
function onClients(snap){
  var seen={};
  snap.docs.forEach(function(d){
    if(tomb[d.id])return;
    var x=d.data()||{};seen[d.id]=1;
    var c=state.clients[d.id];if(!c){c=blankClient(d.id);state.clients[d.id]=c;}
    if(isBusy('clients/'+d.id)||c._creating)return;
    c.name=x.name||c.name;c.domain=x.domain||'';c.brand=x.brand||'';c.currency=x.currency||'$';c.sample=!!x.sample;c.created=x.created||c.created;
    c.info=clone(x.info)||{};c.tracking=clone(x.tracking)||{};c.checks=clone(x.checks)||{};normClient(c);
  });
  Object.keys(state.clients).forEach(function(id){
    if(!seen[id]&&!isBusy('clients/'+id)&&!state.clients[id]._creating)delete state.clients[id];
  });
  state.order=Object.keys(state.clients).sort(function(a,b){return (state.clients[a].created||0)-(state.clients[b].created||0);});
  if(!state.active||!state.clients[state.active]){
    state.active=(state._prefActive&&state.clients[state._prefActive])?state._prefActive:(state.order[0]||null);
  }
  subscribeData(state.active);
  state.loaded=true;softRender();
}
function startStore(){
  setSync('saved');
  if(window.__fs42Return){state.view='connections';var rm=window.__fs42Return;window.__fs42Return=null;setTimeout(function(){toast(rm);},400);}
  cloud.db.doc('agency/main').onSnapshot(function(s){
    var d=s.exists?s.data():null;
    if(d){if(typeof d.logo==='string')state.agency.logo=d.logo;state.agency.plate=d.plate||'dark';}
    renderBrand();if(state.view==='data')softRender();
  },function(e){handleErr(e);});
  cloud.db.collection('clients').onSnapshot(onClients,function(e){handleErr(e);});
}
function loadPrefs(){
  if(!cloud.uid)return Promise.resolve();
  return cloud.db.doc('data/users/'+cloud.uid+'/prefs').get().then(function(s){
    if(!s.exists)return;var d=s.data()||{};
    if(d.theme!=null)state.theme=d.theme;
    if(d.range)state.range=d.range;
    if(d.view&&VIEWS.some(function(v){return v.id===d.view;}))state.view=d.view;
    if(d.active)state._prefActive=d.active;
    if(d.eng)state.eng=d.eng;
    state.variants=!!d.variants;
    applyTheme();
  });
}
function useStore(db,kind,uid,readOnly){
  cloud.db=db;cloud.kind=kind;cloud.uid=uid||null;cloud.mode='cloud';state.readOnly=!!readOnly;
  return loadPrefs().then(startStore,startStore);
}
/* Pick the storage backend: claude.ai db when inside a claude.ai artifact, otherwise Supabase when
   configured (window.FS42_CONFIG), otherwise browser-only demo storage. */
function initStorage(){
  var A=window.FS42Adapters||{},cfg=window.FS42_CONFIG||{};
  function fallback(){
    if(cfg.supabaseUrl&&cfg.supabaseAnonKey&&A.supabase){
      return A.supabase.init(cfg).then(function(r){return useStore(r.db,'supabase',r.uid,false);});
    }
    return A.local.init().then(function(r){return useStore(r.db,'local',r.uid,false);});
  }
  function fatal(e){state.loaded=true;cloud.mode='error';setSync('error');var v=document.getElementById('view');if(v)v.innerHTML='<div class="card tint"><h3>Storage could not start</h3><p class="note">'+esc((e&&e.message)||'Unknown error')+'</p></div>';if(window.console)console.error(e);}
  var cl=window.claude;
  if(cl&&typeof cl.use==='function'){
    Promise.all([cl.use('db'),cl.use('user'),cl.use('downloads')]).then(function(r){
      cloud.dl=r[2]||null;
      if(!r[0])return fallback();
      var user=r[1];
      var p1=(user&&user.id)?user.id().catch(function(){return null;}):Promise.resolve(null);
      var p2=(user&&user.can)?user.can('data.write').catch(function(){return null;}):Promise.resolve(null);
      return Promise.all([p1,p2]).then(function(x){return useStore(r[0],'claude',x[0],x[1]===false);});
    }).catch(function(e){fallback().catch(fatal);});
  }else fallback().catch(fatal);
}
function migrateLegacy(){
  var s=readLegacy();if(!s||cloud.mode!=='cloud')return 0;
  var n=0;
  s.order.forEach(function(id){
    var src=s.clients[id];if(!src)return;
    var c=normClient(Object.assign(blankClient(uid()),clone(src)));c.id=uid();c._cc={};c._ver={};c._dirty={};c.created=Date.now()+n;
    createClient(c);n++;
  });
  if(s.agency&&s.agency.logo&&!state.agency.logo){state.agency.logo=s.agency.logo;state.agency.plate=s.agency.plate||'dark';saveAgency();renderBrand();}
  try{localStorage.removeItem(LKEY);}catch(e){}
  return n;
}
