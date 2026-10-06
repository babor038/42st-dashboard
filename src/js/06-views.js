/* ---------- views ---------- */
var VIEWS=[
  {id:'overview',label:'Overview',title:'Overview',icon:'<path d="M3 13h7V3H3v10zm0 8h7v-6H3v6zm11 0h7V11h-7v10zm0-18v6h7V3h-7z"/>'},
  {id:'clientinfo',label:'Client info',title:'Client info',icon:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/>'},
  {id:'search',label:'Google and Bing',title:'Search performance',icon:'<path d="M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 14 15.5l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/>'},
  {id:'tracking',label:'Keywords and areas',title:'Keywords and service areas',icon:'<path d="M3 3v18h18v-2H5V3H3zm4 10h3v5H7v-5zm5-6h3v11h-3V7zm5 3h3v8h-3v-8z"/>'},
  {id:'traffic',label:'Website traffic',title:'Website traffic',icon:'<path d="M3 17l6-6 4 4 8-8v6h2V3h-9v2h6l-7 7-4-4-7 7 1 1z"/>'},
  {id:'localpaid',label:'Local and paid',title:'Local and paid',icon:'<path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'},
  {id:'ai',label:'AI visibility',title:'AI visibility',icon:'<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2zm7 12l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14zM5 15l.9 2.6 2.6.9-2.6.9L5 22l-.9-2.6-2.6-.9 2.6-.9L5 15z"/>'},
  {id:'technical',label:'Technical and schema',title:'Technical and schema',icon:'<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>'},
  {id:'connections',label:'Live connections',title:'Live connections',icon:'<path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z"/>'},
  {id:'data',label:'Data and workspace',title:'Data and workspace',icon:'<path d="M12 3C7 3 3 4.3 3 6v12c0 1.7 4 3 9 3s9-1.3 9-3V6c0-1.7-4-3-9-3zm0 2c4.2 0 6.8 1 7 1-.2 0-2.8 1-7 1S5.2 6 5 6c.2 0 2.8-1 7-1zm7 13c0 .1-2.6 1-7 1s-7-.9-7-1v-2.2c1.6.8 4.1 1.2 7 1.200s5.4-.4 7-1.2V18zm0-5c0 .1-2.6 1-7 1s-7-.9-7-1V10.8C6.6 11.6 9.1 12 12 12s5.4-.4 7-1.2V13z"/>'}
];
function hasAny(c){return Object.keys(c.data).some(function(k){return c.data[k]&&c.data[k].length;});}
function emptyHero(){
  return '<div class="hero"><h2>Add your first export</h2><p>This dashboard shows only the numbers you bring in. Upload CSV exports from Google Search Console, Bing Webmaster Tools, Google Analytics 4, Google Business Profile and your ad platforms, or log AI visibility checks by hand. Column names from the native exports are recognised automatically.</p><button class="btn" data-act="nav" data-v="data">Go to Data and clients</button> <button class="btn" data-act="sample">Preview with sample data</button></div>';
}
function emptyState(msg){return '<div class="card tint"><h3>Nothing to show yet</h3><p class="note">'+esc(msg)+'</p><button class="btn" data-act="nav" data-v="data">Import data</button></div>';}
function windowNote(c,w){
  if(!w.end)return '';
  if(w.all)return '<p class="note" style="color:var(--muted);font-size:13px;margin-top:14px">Showing all available daily data, '+esc(longDate(w.start))+' to '+esc(longDate(w.end))+'.</p>';
  return '<p class="note" style="color:var(--muted);font-size:13px;margin-top:14px">Showing '+esc(longDate(w.start))+' to '+esc(longDate(w.end))+' ('+w.n+' days), compared with '+esc(longDate(w.pStart))+' to '+esc(longDate(w.pEnd))+'. Ranges end on the most recent date in your imported data.</p>';
}
function seriesOf(rows,w,k,name,color,fn){return {name:name,color:color,pts:byDate(inWin(rows,w.start,w.end),fn||function(r){return +r[k]||0;})};}

function viewOverview(c){
  if(!hasAny(c))return emptyHero();
  var w=windowFor(c),K=kpis(c,w),h=windowNote(c,w);
  var order=['o_clicks','g_clicks','g_imp','g_pos','b_clicks','b_imp','b_pos','ga_sessions','ga_events','ads_cost','ads_conv','gbp_actions','ai_mention','ai_cite'];
  var cards=order.filter(function(id){return K[id];}).map(function(id){return kpiCard(K[id]);});
  h+=cards.length?'<div class="kpis" style="margin-top:12px">'+cards.join('')+'</div>':'<div style="margin-top:12px">'+emptyState('Import a daily dataset (Search Console, Bing, GA4, Business Profile or ads) to see period totals and comparisons.')+'</div>';
  var gd=D(c,'gsc_daily'),bd=D(c,'bing_daily'),ga=D(c,'ga4_daily'),ch=D(c,'ga4_channels'),ai=D(c,'ai_log');
  h+='<div class="grid2">';
  if(gd.length||bd.length){
    var s=[];if(gd.length)s.push(seriesOf(gd,w,'clicks','Google','var(--google)'));if(bd.length)s.push(seriesOf(bd,w,'clicks','Bing','var(--bing)'));
    h+='<div class="card"><h3>Organic clicks by engine</h3><p class="note">Daily clicks from search results.</p>'+chartSlot(function(el){drawLine(el,s,{label:'Organic clicks by engine',legend:true});})+'</div>';
    var s2=[];if(gd.length)s2.push(seriesOf(gd,w,'impressions','Google','var(--google)'));if(bd.length)s2.push(seriesOf(bd,w,'impressions','Bing','var(--bing)'));
    h+='<div class="card"><h3>Impressions by engine</h3><p class="note">How often your pages appeared in results.</p>'+chartSlot(function(el){drawLine(el,s2,{label:'Impressions by engine',legend:true});})+'</div>';
  }
  if(ga.length){
    var s3=[seriesOf(ga,w,'sessions','Sessions','var(--ga)')];
    h+='<div class="card"><h3>Sessions</h3><p class="note">Daily sessions from Google Analytics 4.</p>'+chartSlot(function(el){drawLine(el,s3,{label:'Sessions',legend:true});})+'</div>';
  }
  if(ch.length){
    var items=ch.map(function(r){return {l:r.channel,v:r.sessions,c:'var(--ga)'};}).sort(function(a,b){return b.v-a.v;}).slice(0,8);
    h+='<div class="card"><h3>Sessions by channel</h3><p class="note">From your channel export, as exported.</p>'+barList(items)+'</div>';
  }
  if(ai.length)h+='<div class="card"><h3>AI visibility by platform</h3><p class="note">Share of logged checks where the brand appeared.</p>'+aiStackHTML(ai)+'</div>';
  h+=highlightsCard(c,K);
  h+='</div>';
  return h;
}
function highlightsCard(c,K){
  var out=[];
  Object.keys(K).forEach(function(id){
    var k=K[id];if(k.prev==null||k.cur==null||state.range==='all'||k.o.neutral)return;
    if(k.o.pos){if(k.prev-k.cur>=0.1)out.push(k.label+' improved by '+(k.prev-k.cur).toFixed(1)+' positions versus the previous period.');return;}
    if(k.prev>0){var p=(k.cur-k.prev)/k.prev*100;var good=k.o.inverse?p<=-1:p>=1;if(good)out.push(k.label+' '+(k.o.inverse?'came down':'grew')+' '+Math.abs(p).toFixed(1)+'% versus the previous period.');}
  });
  [['gsc_queries','Google'],['bing_queries','Bing']].forEach(function(p){
    var rows=D(c,p[0]);if(!rows.length)return;var t=rows.slice().sort(function(a,b){return b.clicks-a.clicks;})[0];
    if(t&&t.clicks>0)out.push('Top '+p[1]+' query by clicks: "'+t.query+'" with '+fmtNum(t.clicks)+' clicks.');
  });
  [['gsc_pages','Google'],['bing_pages','Bing']].forEach(function(p){
    var rows=D(c,p[0]);if(!rows.length)return;var t=rows.slice().sort(function(a,b){return b.clicks-a.clicks;})[0];
    if(t&&t.clicks>0)out.push('Top '+p[1]+' page by clicks: '+t.page+' with '+fmtNum(t.clicks)+' clicks.');
  });
  if(!out.length)return '';
  return '<div class="card"><h3>Highlights</h3><p class="note">Generated from your imported numbers.</p><ul class="hl">'+out.slice(0,8).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul></div>';
}

function searchTableCols(dimKey,dimLabel){
  return [
    {k:dimKey,l:dimLabel,wrap:true},
    {k:'clicks',l:'Clicks',num:true,f:function(r){return fmtNum(r.clicks);}},
    {k:'impressions',l:'Impressions',num:true,f:function(r){return fmtNum(r.impressions);}},
    {k:'ctr',l:'CTR',num:true,f:function(r){return fmtPct(r.ctr!=null?r.ctr:(r.impressions?r.clicks/r.impressions:null));}},
    {k:'position',l:'Avg. position',num:true,f:function(r){return fmtPos(r.position);}}
  ];
}
function withCtr(rows){return rows.map(function(r){var o=Object.assign({},r);if(o.ctr==null&&o.impressions)o.ctr=o.clicks/o.impressions;return o;});}

function viewSearch(c){
  var ks=['gsc_daily','bing_daily','gsc_queries','bing_queries','gsc_pages','bing_pages'];
  if(!ks.some(function(k){return D(c,k).length;}))return emptyState('Import Google Search Console and Bing Webmaster Tools exports to compare search performance.');
  var w=windowFor(c),K=kpis(c,w),h=windowNote(c,w);
  var gd=D(c,'gsc_daily'),bd=D(c,'bing_daily');
  [['Google Search Console','var(--google)',['g_clicks','g_imp','g_ctr','g_pos']],['Bing Webmaster Tools','var(--bing)',['b_clicks','b_imp','b_ctr','b_pos']]].forEach(function(g){
    var cards=g[2].filter(function(id){return K[id];}).map(function(id){return kpiCard(K[id]);});
    if(cards.length)h+='<div class="group-h"><i class="dot" style="background:'+g[1]+'"></i>'+esc(g[0])+'</div><div class="kpis">'+cards.join('')+'</div>';
  });
  if(gd.length||bd.length){
    h+='<div class="grid2">';
    var defs=[['Clicks by engine','clicks',fmtNum,{}],['Impressions by engine','impressions',fmtNum,{}],['Click-through rate by engine','ctr',fmtPct,{zero:true}],['Average position by engine','position',function(v){return v.toFixed(1);},{invert:true,zero:false,axis:function(v){return v.toFixed(0);}}]];
    defs.forEach(function(d){
      var s=[];
      [[gd,'Google','var(--google)'],[bd,'Bing','var(--bing)']].forEach(function(e){
        if(!e[0].length)return;
        var rows=inWin(e[0],w.start,w.end),pts;
        if(d[1]==='ctr')pts=byDate(rows,function(r){return 0;}).map(function(p){var day=rows.filter(function(r){return r.date===p.x;});var a=sum(day,'clicks'),b=sum(day,'impressions');return {x:p.x,y:b?a/b:null};});
        else if(d[1]==='position')pts=rows.filter(function(r){return r.position!=null;}).map(function(r){return {x:r.date,y:r.position};});
        else pts=byDate(rows,function(r){return +r[d[1]]||0;});
        s.push({name:e[1],color:e[2],pts:pts});
      });
      var o=Object.assign({label:d[0],legend:true,fmt:d[2]},d[3]);
      if(d[1]==='ctr')o.axis=function(v){return (v*100).toFixed(1)+'%';};
      h+='<div class="card"><h3>'+esc(d[0])+'</h3>'+(d[1]==='position'?'<p class="note">Lower numbers are higher in results, so the chart shows better positions nearer the top.</p>':'<p class="note">Daily values in the selected range.</p>')+chartSlot(function(el){drawLine(el,s,o);})+'</div>';
    });
    h+='</div>';
  }
  var brand=(c.brand||'').split(',').map(function(x){return x.trim().toLowerCase();}).filter(Boolean);
  if(brand.length){
    var bh='';
    [['Google','gsc_queries','var(--google)'],['Bing','bing_queries','var(--bing)']].forEach(function(e){
      var rows=D(c,e[1]);if(!rows.length)return;
      var br=0,nb=0;rows.forEach(function(r){var q=String(r.query).toLowerCase();if(brand.some(function(t){return q.indexOf(t)>=0;}))br+=r.clicks;else nb+=r.clicks;});
      bh+='<div style="margin-bottom:12px"><b>'+e[0]+'</b>'+barList([{l:'Branded queries',v:br,c:e[2]},{l:'Non-branded queries',v:nb,c:'var(--gold)'}])+'</div>';
    });
    if(bh)h+='<div class="section"><div class="card"><h3>Branded and non-branded clicks</h3><p class="note">Based on the brand terms saved for this client, applied to the queries export.</p>'+bh+'</div></div>';
  }
  var eng=state.eng==='bing'?'bing':'google',pre=eng==='bing'?'bing':'gsc';
  var q=D(c,pre+'_queries'),p=D(c,pre+'_pages');
  h+='<div class="section"><h2>Queries and pages</h2><div class="chips" role="group" aria-label="Search engine">'+
     '<button class="chip" data-act="eng" data-e="google" aria-pressed="'+(eng==='google')+'">Google</button><button class="chip" data-act="eng" data-e="bing" aria-pressed="'+(eng==='bing')+'">Bing</button></div>';
  if(!q.length&&!p.length)h+='<div style="margin-top:12px">'+emptyState('Import the '+(eng==='bing'?'Bing':'Google')+' Queries or Pages export to see this table.')+'</div>';
  else{
    h+='<div class="grid2">';
    if(q.length){
      var opp=withCtr(q).filter(function(r){return r.position!=null&&r.position>=4&&r.position<=15&&r.impressions>0;});
      h+='<div class="card" style="grid-column:1/-1"><h3>Growth opportunities: queries at positions 4 to 15</h3><p class="note">These queries already earn impressions and sit close to the top results. Sorted by impressions, so the biggest opportunities come first.</p>'+
        (opp.length?tableSlot('opp_'+pre,{cols:searchTableCols('query','Query'),rows:opp,sort:'impressions'}):'<div class="empty-s">No queries in the 4 to 15 range in this export.</div>')+'</div>';
      h+='<div class="card" style="grid-column:1/-1"><h3>Top queries</h3><p class="note">As exported, not limited by the date range above.</p>'+tableSlot('q_'+pre,{cols:searchTableCols('query','Query'),rows:withCtr(q),sort:'clicks'})+'</div>';
    }
    if(p.length)h+='<div class="card" style="grid-column:1/-1"><h3>Top pages</h3><p class="note">As exported, not limited by the date range above.</p>'+tableSlot('p_'+pre,{cols:searchTableCols('page','Page'),rows:withCtr(p),sort:'clicks'})+'</div>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

function viewTraffic(c){
  var ga=D(c,'ga4_daily'),ch=D(c,'ga4_channels');
  if(!ga.length&&!ch.length)return emptyState('Import a Google Analytics 4 daily export, a channel export, or both.');
  var w=windowFor(c),K=kpis(c,w),h='';
  if(ga.length){
    h+=windowNote(c,w);
    var cards=['ga_sessions','ga_engaged','ga_erate','ga_events','ga_krate'].filter(function(id){return K[id];}).map(function(id){return kpiCard(K[id]);});
    h+='<div class="kpis" style="margin-top:12px">'+cards.join('')+'</div><div class="grid2">';
    var s1=[seriesOf(ga,w,'sessions','Sessions','var(--ga)')],s2=[seriesOf(ga,w,'engaged','Engaged sessions','var(--good)')],s3=[seriesOf(ga,w,'events','Key events','var(--gold)')];
    h+='<div class="card"><h3>Sessions</h3>'+chartSlot(function(el){drawLine(el,s1,{label:'Sessions',legend:true});})+'</div>';
    h+='<div class="card"><h3>Engaged sessions</h3>'+chartSlot(function(el){drawLine(el,s2,{label:'Engaged sessions',legend:true});})+'</div>';
    if(sum(D(c,'ga4_daily'),'events')>0)h+='<div class="card"><h3>Key events</h3>'+chartSlot(function(el){drawLine(el,s3,{label:'Key events',legend:true});})+'</div>';
    h+='</div>';
  }
  if(ch.length){
    var items=ch.map(function(r){return {l:r.channel,v:r.sessions,c:'var(--ga)'};}).sort(function(a,b){return b.v-a.v;});
    h+='<div class="section"><h2>Channels</h2><div class="grid2"><div class="card"><h3>Sessions by channel</h3>'+barList(items.slice(0,10))+'</div><div class="card"><h3>Channel detail</h3>'+
      tableSlot('channels',{search:false,rows:ch.map(function(r){return Object.assign({},r,{rate:r.sessions?r.events/r.sessions:null});}),sort:'sessions',cols:[
        {k:'channel',l:'Channel',wrap:true},{k:'sessions',l:'Sessions',num:true,f:function(r){return fmtNum(r.sessions);}},{k:'engaged',l:'Engaged',num:true,f:function(r){return fmtNum(r.engaged);}},{k:'events',l:'Key events',num:true,f:function(r){return fmtNum(r.events);}},{k:'rate',l:'Key event rate',num:true,f:function(r){return fmtPct(r.rate);}}]})+'</div></div></div>';
  }
  return h;
}

function viewLocalPaid(c){
  var gb=D(c,'gbp_daily'),ad=D(c,'ads_daily');
  if(!gb.length&&!ad.length)return emptyState('Import Google Business Profile actions, ad platform reports, or both.');
  var w=windowFor(c),K=kpis(c,w),h=windowNote(c,w);
  if(gb.length){
    h+='<div class="group-h"><i class="dot" style="background:var(--gbp)"></i>Google Business Profile</div><div class="kpis">'+['gbp_views','gbp_calls','gbp_dir','gbp_web','gbp_actions'].filter(function(id){return K[id];}).map(function(id){return kpiCard(K[id]);}).join('')+'</div>';
    var s=[seriesOf(gb,w,'calls','Calls','var(--gbp)'),seriesOf(gb,w,'directions','Directions','var(--google)'),seriesOf(gb,w,'website','Website clicks','var(--ga)')];
    h+='<div class="grid2"><div class="card"><h3>Profile actions</h3><p class="note">Calls, direction requests and website clicks over time.</p>'+chartSlot(function(el){drawLine(el,s,{label:'Profile actions',legend:true});})+'</div>';
    if(sum(gb,'views')>0){var sv=[seriesOf(gb,w,'views','Views','var(--gbp)')];h+='<div class="card"><h3>Profile views</h3>'+chartSlot(function(el){drawLine(el,sv,{label:'Profile views',legend:true});})+'</div>';}
    h+='</div>';
  }
  if(ad.length){
    h+='<div class="group-h"><i class="dot" style="background:var(--ads)"></i>Paid search</div><div class="kpis">'+['ads_cost','ads_clicks','ads_imp','ads_conv','ads_cpc','ads_cpa'].filter(function(id){return K[id];}).map(function(id){return kpiCard(K[id]);}).join('')+'</div>';
    var plats=Array.from(new Set(ad.map(function(r){return r.platform;})));
    var pal=['var(--ads)','var(--bing)','var(--ga)','var(--google)'];
    var sc=plats.map(function(p,i){return {name:p,color:pal[i%pal.length],pts:byDate(inWin(ad,w.start,w.end).filter(function(r){return r.platform===p;}),function(r){return +r.cost||0;})};});
    var sv2=plats.map(function(p,i){return {name:p,color:pal[i%pal.length],pts:byDate(inWin(ad,w.start,w.end).filter(function(r){return r.platform===p;}),function(r){return +r.conversions||0;})};});
    h+='<div class="grid2"><div class="card"><h3>Spend</h3><p class="note">Daily spend'+(plats.length>1?' by platform':'')+'.</p>'+chartSlot(function(el){drawLine(el,sc,{label:'Ad spend',legend:true,fmt:money});})+'</div>';
    h+='<div class="card"><h3>Conversions</h3><p class="note">Daily conversions'+(plats.length>1?' by platform':'')+'.</p>'+chartSlot(function(el){drawLine(el,sv2,{label:'Ad conversions',legend:true});})+'</div></div>';
    var rows=plats.map(function(p){var r=inWin(ad,w.start,w.end).filter(function(x){return x.platform===p;});var co=sum(r,'cost'),cl=sum(r,'clicks'),cv=sum(r,'conversions');return {platform:p,cost:co,clicks:cl,impressions:sum(r,'impressions'),conversions:cv,cpc:cl?co/cl:null,cpa:cv?co/cv:null};});
    h+='<div class="section"><div class="card"><h3>By platform</h3>'+tableSlot('adplat',{search:false,rows:rows,sort:'cost',cols:[
      {k:'platform',l:'Platform'},{k:'cost',l:'Spend',num:true,f:function(r){return money(r.cost);}},{k:'clicks',l:'Clicks',num:true,f:function(r){return fmtNum(r.clicks);}},{k:'impressions',l:'Impressions',num:true,f:function(r){return fmtNum(r.impressions);}},{k:'conversions',l:'Conversions',num:true,f:function(r){return fmtNum(r.conversions);}},{k:'cpc',l:'Cost per click',num:true,f:function(r){return money(r.cpc);}},{k:'cpa',l:'Cost per conversion',num:true,f:function(r){return money(r.cpa);}}]})+'</div></div>';
  }
  return h;
}

function aiStackHTML(rows){
  var plats=Array.from(new Set(rows.map(function(r){return r.platform;})));
  return '<div class="bars stack">'+plats.map(function(p){
    var r=rows.filter(function(x){return x.platform===p;}),n=r.length;
    var ci=r.filter(function(x){return x.cited;}).length,mo=r.filter(function(x){return x.mentioned&&!x.cited;}).length,no=n-ci-mo;
    return '<div class="bar-row"><div class="bar-label" title="'+esc(p)+'">'+esc(p)+'</div><div class="bar-track" title="'+ci+' cited, '+mo+' mentioned, '+no+' not yet appearing"><div class="bar-fill" style="width:'+(ci/n*100)+'%;background:var(--good)"></div><div class="bar-fill" style="width:'+(mo/n*100)+'%;background:var(--gold)"></div></div><div class="bar-val">'+fmtPct((ci+mo)/n)+'</div></div>';
  }).join('')+'</div><div class="lc-legend" style="margin-top:8px"><span><i class="dot" style="background:var(--good)"></i>Cited</span><span><i class="dot" style="background:var(--gold)"></i>Mentioned</span><span><i class="dot" style="background:var(--surface2)"></i>Not yet appearing</span></div>';
}
function viewAI(c){
  var rows=D(c,'ai_log');
  var today=isoOf(new Date());
  var h='';
  if(rows.length){
    var n=rows.length,m=rows.filter(function(r){return r.mentioned||r.cited;}).length,ci=rows.filter(function(r){return r.cited;}).length;
    var plats=Array.from(new Set(rows.map(function(r){return r.platform;}))),prompts=Array.from(new Set(rows.map(function(r){return r.prompt.toLowerCase();})));
    h+='<div class="kpis" style="margin-top:14px">'+
      kpiCard({label:'Checks logged',color:'var(--ai)',cur:n,prev:null,fmt:fmtNum,o:{sub:prompts.length+' prompts, '+plats.length+' platforms'}})+
      kpiCard({label:'Brand mention rate',color:'var(--ai)',cur:m/n,prev:null,fmt:fmtPct,o:{sub:m+' of '+n+' checks'}})+
      kpiCard({label:'Citation rate',color:'var(--ai)',cur:ci/n,prev:null,fmt:fmtPct,o:{sub:ci+' of '+n+' checks'}})+'</div>';
    h+='<div class="grid2"><div class="card"><h3>Visibility by platform</h3><p class="note">Share of checks where the brand was mentioned or cited.</p>'+aiStackHTML(rows)+'</div>';
    var dates=Array.from(new Set(rows.map(function(r){return r.date;}))).sort();
    var pts=dates.map(function(d){var r=rows.filter(function(x){return x.date===d;});return {x:d,y:r.filter(function(x){return x.mentioned||x.cited;}).length/r.length};});
    h+='<div class="card"><h3>Mention rate by check date</h3><p class="note">Each point is the share of that day\u2019s checks where the brand appeared.</p>'+chartSlot(function(el){drawLine(el,[{name:'Mention rate',color:'var(--ai)',pts:pts}],{label:'Mention rate by check date',legend:true,fmt:fmtPct,axis:function(v){return Math.round(v*100)+'%';}});})+'</div></div>';
    var latest={};
    rows.forEach(function(r){var k=r.prompt.toLowerCase()+'|'+r.platform;if(!latest[k]||r.date>=latest[k].date)latest[k]=r;});
    var pn={};rows.forEach(function(r){if(!pn[r.prompt.toLowerCase()])pn[r.prompt.toLowerCase()]=r.prompt;});
    h+='<div class="section"><div class="card"><h3>Prompt coverage</h3><p class="note">Latest result for each prompt on each platform.</p><div class="tbl-wrap"><table class="matrix"><thead><tr><th>Prompt</th>'+plats.map(function(p){return '<th style="cursor:default">'+esc(p)+'</th>';}).join('')+'</tr></thead><tbody>'+
      prompts.map(function(pk){return '<tr><td class="wrap">'+esc(pn[pk])+'</td>'+plats.map(function(p){var r=latest[pk+'|'+p];if(!r)return '<td><span class="cell n">Not checked</span></td>';return '<td>'+(r.cited?'<span class="cell c">Cited</span>':r.mentioned?'<span class="cell m">Mentioned</span>':'<span class="cell n">Not yet</span>')+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div></div></div>';
    var comp={};rows.forEach(function(r){String(r.competitors||'').split(/[,;]/).map(function(x){return x.trim();}).filter(Boolean).forEach(function(x){comp[x]=(comp[x]||0)+1;});});
    var ci2=Object.keys(comp).map(function(k){return {l:k,v:comp[k],c:'var(--ai)'};}).sort(function(a,b){return b.v-a.v;}).slice(0,8);
    if(ci2.length)h+='<div class="section"><div class="card"><h3>Other brands appearing in answers</h3><p class="note">Number of logged checks where each competitor was noted.</p>'+barList(ci2)+'</div></div>';
  }else{
    h+='<div style="margin-top:14px">'+emptyState('Log the prompts you test in AI assistants below, or import a CSV of past checks.')+'</div>';
  }
  h+='<div class="section"><div class="card"><h3>Log a check</h3><p class="note">Run a prompt in an AI assistant, then record what you saw. Logging the same prompt, platform and date again updates that entry.</p>'+
    '<div class="form"><label class="f">Date<input type="date" id="ai_date" value="'+today+'"></label>'+
    '<label class="f">Platform<input type="text" id="ai_plat" list="ai_plats" placeholder="ChatGPT"><datalist id="ai_plats">'+AI_PLATFORMS.map(function(p){return '<option value="'+esc(p)+'">';}).join('')+'</datalist></label>'+
    '<label class="f" style="grid-column:span 2">Prompt<input type="text" id="ai_prompt" placeholder="best plumber in Cebu City"></label>'+
    '<div class="chk"><label><input type="checkbox" id="ai_men"> Brand mentioned</label><label><input type="checkbox" id="ai_cit"> Site cited</label></div>'+
    '<label class="f">Other brands noted<input type="text" id="ai_comp" placeholder="Comma separated"></label>'+
    '<label class="f">Notes<input type="text" id="ai_notes"></label>'+
    '<div><button class="btn primary" data-act="ai-add">Add to log</button></div></div></div></div>';
  if(rows.length){
    var lg=rows.slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0;});
    h+='<div class="section"><div class="card"><h3>Check log</h3>'+tableSlot('ailog',{rows:lg.map(function(r){return Object.assign({},r,{res:r.cited?'Cited':r.mentioned?'Mentioned':'Not yet'});}),sort:'date',cols:[
      {k:'date',l:'Date'},{k:'platform',l:'Platform'},{k:'prompt',l:'Prompt',wrap:true},{k:'res',l:'Result'},{k:'competitors',l:'Other brands',wrap:true},{k:'notes',l:'Notes',wrap:true},
      {k:'id',l:'',raw:true,f:function(r){return '<button class="btn small" data-act="ai-del" data-id="'+esc(r.id)+'">Remove</button>';}}]})+'</div></div>';
  }
  return h;
}

function viewTechnical(c){
  var groups=[],seen={};CHECKS.forEach(function(x){if(!seen[x[0]]){seen[x[0]]=1;groups.push(x[0]);}});
  var counts={pass:0,work:0,na:0,none:0};
  CHECKS.forEach(function(x){var s=(c.checks[x[1]]||{}).s||'';if(s==='pass')counts.pass++;else if(s==='work')counts.work++;else if(s==='na')counts.na++;else counts.none++;});
  var applicable=CHECKS.length-counts.na,pct=applicable?Math.round(counts.pass/applicable*100):0;
  var h='<div class="card" style="margin-top:14px"><h3>'+counts.pass+' of '+applicable+' checks confirmed</h3><p class="note">Mark each item as you verify it on the live site. '+counts.work+' marked as growth opportunities, '+counts.none+' not yet reviewed.</p><div class="prog" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div></div>';
  groups.forEach(function(g){
    h+='<div class="section"><h2>'+esc(g)+'</h2><div class="card">';
    CHECKS.filter(function(x){return x[0]===g;}).forEach(function(x){
      var cur=c.checks[x[1]]||{};
      h+='<div class="chk-row"><div>'+esc(x[2])+'</div><select data-check="'+x[1]+'" aria-label="Status for: '+esc(x[2])+'">'+
        [['','Not yet reviewed'],['pass','Confirmed'],['work','Growth opportunity'],['na','Not applicable']].map(function(o){return '<option value="'+o[0]+'"'+((cur.s||'')===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+
        '</select><input type="text" data-cnote="'+x[1]+'" placeholder="Note" value="'+esc(cur.n||'')+'" aria-label="Note"></div>';
    });
    h+='</div></div>';
  });
  return h;
}
