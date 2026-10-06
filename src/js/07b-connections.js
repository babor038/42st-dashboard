/* ---------- live connections ---------- */
var CONN=[
  {id:'gsc',name:'Google Search Console',color:'var(--google)',how:'google',field:'gsc',fieldLabel:'Search Console property',find:true,pulls:'Daily clicks and impressions, top queries and top pages'},
  {id:'ga4',name:'Google Analytics 4',color:'var(--ga)',how:'google',field:'ga4Property',fieldLabel:'GA4 property ID',find:true,pulls:'Daily sessions, engaged sessions and key events, plus traffic channels'},
  {id:'gbp',name:'Google Business Profile',color:'var(--gbp)',how:'google',field:'gbpLocationId',fieldLabel:'Business Profile location ID',find:true,pulls:'Profile views, calls, direction requests and website clicks',note:'Google must approve Business Profile API access for your Cloud project first.'},
  {id:'gads',name:'Google Ads',color:'var(--ads)',how:'google',field:'googleAds',fieldLabel:'Google Ads customer ID',find:true,pulls:'Daily spend, clicks, impressions and conversions',note:'The Cloud project needs a Google Ads API access level (Explorer or higher).'},
  {id:'bing',name:'Bing Webmaster Tools',color:'var(--bing)',how:'key',field:'bwt',fieldLabel:'Bing site URL',pulls:'Daily clicks and impressions, top queries and top pages',note:'Create the API key in Bing Webmaster Tools under Settings, API access.'}
];
var CONN_NOT_LIVE=[
  ['Microsoft Advertising','Import the CSV report on the Data page'],
  ['Meta Ads','Import a CSV, or send it through the ads dataset'],
  ['Rank tracker','Import the rank export, or log ranks by hand'],
  ['AI visibility','Manual log. AI assistants have no official API for brand mentions']
];
var connState={cid:null,list:null,error:'',days:'90'};
function connApi(){var A=window.FS42Adapters&&window.FS42Adapters.supabase;return (cloud.kind==='supabase'&&A&&A.api)?A.api:null;}
function loadConnections(c){
  var api=connApi();if(!api)return;
  api.connections(c.id).then(function(rows){if(connState.cid===c.id){connState.list=rows;connState.error='';softRender();}},function(e){connState.list=[];connState.error=(e&&e.message)||'Could not load connections.';softRender();});
}
function connErr(e){toast((e&&e.message)||'That did not work. Please try again.');}
function connWhen(iso){if(!iso)return 'Never synced';var d=new Date(iso);return isNaN(d.getTime())?'Synced':'Last synced '+longDate(isoOf(d));}
function viewConnections(c){
  var api=connApi();
  var h='<p class="lead" style="margin-top:14px">Connect a client\u2019s accounts and the dashboard pulls their numbers automatically. Read-only access, and each source asks only for the permission it needs.</p>';
  if(!api){
    h+='<div class="card tint"><h3>Live connections need the cloud backend</h3><p class="note">'+
      (cloud.kind==='claude'?'This copy runs inside claude.ai, which cannot hold Google or Bing sign-ins securely. ':'This copy is running in demo mode. ')+
      'Deploy the Supabase backend from the repository (see supabase/README.md) and point the dashboard at it. Until then, import CSV exports on the Data page and everything else works the same.</p><div class="savebar"><button class="btn" data-act="nav" data-v="data">Import data</button></div></div>';
    h+='<div class="section"><h2>What will connect</h2><div class="grid2">'+CONN.map(function(p){return '<div class="card" style="border-left:3px solid '+p.color+'"><h3>'+esc(p.name)+'</h3><p class="note" style="margin:0">'+esc(p.pulls)+'</p></div>';}).join('')+'</div></div>';
    return h;
  }
  if(connState.cid!==c.id){connState.cid=c.id;connState.list=null;setTimeout(function(){loadConnections(c);},0);}
  var list=connState.list||[],by={};list.forEach(function(r){by[r.provider]=r;});
  h+='<div class="card" style="margin-top:12px"><div class="form"><label class="f">When you press Sync, pull the last<select id="connDays">'+[['7','7 days'],['28','28 days'],['90','90 days'],['180','180 days'],['365','12 months']].map(function(o){return '<option value="'+o[0]+'"'+(connState.days===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></label>'+
    '<div><button class="btn primary" data-act="conn-sync">Sync everything connected</button></div><div><button class="btn" data-act="conn-refresh">Refresh status</button></div></div>'+
    '<p class="note" style="margin:10px 0 0">Pull 90 days or more the first time to build history. Daily rows merge into what is already stored, and the scheduler keeps them current.</p>'+(connState.error?'<div class="err" style="margin-top:8px">'+esc(connState.error)+'</div>':'')+'</div>';
  h+='<div class="grid2">';
  CONN.forEach(function(p){
    var r=by[p.id],idv=String(c.info[p.field]||'').trim();
    var pill=!r?'<span class="d flat">Not connected</span>':(r.status==='connected'?'<span class="d up">Connected</span>':'<span class="d soft">'+(r.status==='needs_reconnect'?'Needs reconnecting':'Needs attention')+'</span>');
    h+='<div class="card" style="border-left:3px solid '+p.color+'"><div class="ds-h"><h3>'+esc(p.name)+'</h3>'+pill+'</div><p class="note">'+esc(p.pulls)+'</p>';
    h+='<div class="mini" style="margin-bottom:8px">'+esc(p.fieldLabel)+': <b style="color:var(--ink)">'+(idv?esc(idv):'not set')+'</b> <button class="btn small" data-act="nav" data-v="clientinfo">Edit on Client info</button>'+((p.find&&r&&r.status==='connected')?' <button class="btn small" data-act="conn-find" data-p="'+p.id+'">Find mine</button>':'')+'</div>';
    if(r){h+='<div class="mini">'+esc(r.account_label?r.account_label+'. ':'')+esc(connWhen(r.last_sync_at))+'</div>';if(r.last_error)h+='<div class="err" style="margin-top:8px">'+esc(r.last_error)+'</div>';}
    if(p.note)h+='<div class="mini" style="margin-top:6px">'+esc(p.note)+'</div>';
    h+='<div class="savebar">';
    if(p.how==='google')h+='<button class="btn'+(r?'':' primary')+'" data-act="conn-google" data-p="'+p.id+'">'+(r?'Reconnect':'Connect Google')+'</button>';
    else h+='<input type="password" id="bing_key" autocomplete="off" placeholder="Paste Bing API key" style="min-width:200px"><button class="btn'+(r?'':' primary')+'" data-act="conn-bing">'+(r?'Replace key':'Save key')+'</button>';
    if(r)h+='<button class="btn" data-act="conn-sync" data-p="'+p.id+'">Sync now</button><button class="btn warn" data-act="conn-disc" data-p="'+p.id+'">Disconnect</button>';
    h+='</div></div>';
  });
  h+='</div><div class="section"><h2>Not live yet</h2><div class="card"><div class="tbl-wrap"><table><tbody>'+CONN_NOT_LIVE.map(function(r){return '<tr><td>'+esc(r[0])+'</td><td class="wrap" style="color:var(--muted)">'+esc(r[1])+'</td></tr>';}).join('')+'</tbody></table></div></div></div>';
  return h;
}
function connAction(a,t,c){
  var api=connApi();if(!api){toast('Live connections need the cloud backend.');return;}
  if(a==='conn-refresh'){loadConnections(c);toast('Refreshing.');return;}
  if(a==='conn-google'){
    api.invoke('connect',{action:'google-start',clientId:c.id,product:t.dataset.p}).then(function(r){window.location.href=r.url;},connErr);return;
  }
  if(a==='conn-bing'){
    var key=($('#bing_key')||{}).value;if(!key||!key.trim()){toast('Paste the Bing API key first.');return;}
    api.invoke('connect',{action:'bing-save',clientId:c.id,apiKey:key.trim()}).then(function(){toast('Bing key saved.');loadConnections(c);},connErr);return;
  }
  if(a==='conn-sync'){
    var only=t.dataset.p?[t.dataset.p]:null;toast('Syncing. This can take a minute.');
    api.invoke('sync',{clientId:c.id,providers:only,days:Number(connState.days)||90}).then(function(r){
      var res=[];(r.synced||[]).forEach(function(x){res=res.concat(x.results||[]);});
      var ok=res.filter(function(x){return x.ok;}).length,bad=res.filter(function(x){return !x.ok;});
      toast(!res.length?'Nothing connected to sync yet.':(ok+' source'+(ok===1?'':'s')+' updated'+(bad.length?', '+bad.length+' need attention.':'.')));
      loadConnections(c);
    },connErr);return;
  }
  if(a==='conn-disc'){
    var p=t.dataset.p;
    confirmDlg('Disconnect '+p.toUpperCase()+'?','The stored sign-in is deleted. Data already pulled stays in the dashboard.','Disconnect',function(){api.invoke('connect',{action:'disconnect',clientId:c.id,provider:p}).then(function(){toast('Disconnected.');loadConnections(c);},connErr);});return;
  }
  if(a==='conn-find'){
    var prov=CONN.filter(function(x){return x.id===t.dataset.p;})[0];
    api.invoke('connect',{action:'discover',clientId:c.id,provider:prov.id}).then(function(r){
      var opts=r.options||[];
      if(!opts.length){toast('Nothing found for that Google account.');return;}
      openDialog('Choose '+prov.fieldLabel.toLowerCase(),'<label class="f">'+esc(prov.fieldLabel)+'<select id="disc_sel">'+opts.map(function(o,i){return '<option value="'+i+'">'+esc(o.label)+'</option>';}).join('')+'</select></label>',
        [{label:'Cancel'},{label:'Use this',primary:true,fn:function(d){var o=opts[Number($('#disc_sel',d).value)];c.info[prov.field]=o.value;saveClient(c);render();toast('Saved to Client info.');}}]);
    },connErr);
  }
}
