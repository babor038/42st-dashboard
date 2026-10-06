/* ---------- client info ---------- */
var TRADES=['HVAC','Plumbing','Roofing','Electrical','Remodeling','General contracting','Home builders','Restoration','Septic and excavation','Concrete and paving','Fencing','Flooring','Windows and doors','Garage doors','Gutters','Painting','Pressure washing','Landscaping','Tree service','Pool service','Pest control','Cleaning services','Handyman','Solar','Property management','Medical and dental','Legal and finance','Professional services','Beauty and wellness','Auto services','Pet services','Retail and local','Other'];
function T(k,l,o){var f={k:k,l:l};if(o)for(var x in o)f[x]=o[x];return f;}
var INFO=[
  {id:'basics',t:'Account basics',n:'These drive the page header, the branded query split and currency formatting.',f:[
    T('_name','Client display name',{core:1}),T('_domain','Primary website',{ph:'example.com',core:1}),
    T('_brand','Brand terms to track',{ph:'Comma separated, used to split branded and non-branded queries',w:1}),
    T('_currency','Currency symbol',{max:4}),
    T('status','Account status',{t:'select',o:['Prospect','Onboarding','Active','Paused','Ended']}),
    T('accountManager','42nd Street account manager')]},
  {id:'business',t:'Business profile',n:'Use the details the business uses publicly so schema, listings and content stay consistent.',f:[
    T('legalName','Legal business name',{core:1}),T('dba','Name used publicly (DBA)'),
    T('industry','Industry or trade',{list:'trades',core:1}),
    T('businessType','Business type',{t:'select',o:['Service area business','Storefront','Both storefront and service area','Online only','Multi-location']}),
    T('founded','Year founded',{ph:'2010'}),
    T('employees','Team size',{t:'select',o:['1 to 5','6 to 15','16 to 50','51 to 200','200 or more']}),
    T('description','Business description',{t:'textarea',ph:'Two or three plain sentences about what the business does and for whom.'}),
    T('differentiators','What makes them different',{t:'textarea'}),
    T('licenses','Licenses, certifications and awards',{t:'textarea',ph:'Only list items the client has confirmed.'})]},
  {id:'location',t:'Contact, location and hours',n:'Keep this identical to the Google Business Profile and the sitewide schema.',f:[
    T('phone','Main phone',{core:1}),T('trackingPhone','Call tracking number'),T('email','Main email',{core:1}),
    T('street','Street address',{core:1}),T('suite','Suite or unit'),T('city','City',{core:1}),T('state','State',{core:1}),T('zip','ZIP code',{core:1}),T('country','Country'),
    T('serviceAreaType','Customers visit or you travel',{t:'select',o:['Customers visit the location','We travel to customers','Both']}),
    T('hours','Hours of operation',{t:'textarea',core:1,ph:'Monday to Thursday 9:00 AM to 5:00 PM'}),
    T('serviceAreaNotes','Counties and cities served',{t:'textarea',core:1,ph:'Full list by county and city'}),
    T('otherLocations','Other locations',{t:'textarea'})]},
  {id:'people',t:'People and contacts',n:'Who we talk to, who approves work and who controls access to the website and accounts.',f:[
    T('primaryName','Primary contact',{core:1}),T('primaryTitle','Title'),T('primaryEmail','Email',{core:1}),T('primaryPhone','Phone'),
    T('preferredContact','Preferred contact method',{t:'select',o:['Email','Phone','Text message']}),T('bestTime','Best time to reach them'),
    T('decisionMaker','Final decision maker'),
    T('billingName','Billing contact'),T('billingEmail','Billing email'),
    T('techName','Website and DNS contact'),T('techEmail','Website and DNS email')]},
  {id:'profiles',t:'Online profiles and listings',n:'Used for sameAs links, citation consistency and AI visibility.',f:[
    T('gbpUrl','Google Business Profile URL',{core:1}),T('bingPlaces','Bing Places URL'),
    T('facebook','Facebook'),T('instagram','Instagram'),T('linkedin','LinkedIn'),T('youtube','YouTube'),T('tiktok','TikTok'),T('x','X'),
    T('yelp','Yelp'),T('nextdoor','Nextdoor'),T('bbb','Better Business Bureau'),T('angi','Angi'),T('homeadvisor','HomeAdvisor'),T('thumbtack','Thumbtack'),
    T('otherProfiles','Other directories and profiles',{t:'textarea'})]},
  {id:'accounts',t:'Accounts and tracking IDs',n:'IDs only. Never enter passwords, security codes or card numbers in this form.',f:[
    T('gsc','Search Console property',{core:1}),T('bwt','Bing Webmaster Tools site'),
    T('ga4Property','GA4 property ID',{core:1,ph:'Digits only'}),T('ga4Stream','GA4 measurement ID'),T('gtm','Tag Manager container ID'),
    T('gbpLocationId','Business Profile location ID',{ph:'Numeric ID, used by Live connections'}),
    T('googleAds','Google Ads customer ID'),T('googleAdsManager','Google Ads manager (MCC) ID',{ph:'Only if you reach this account through a manager account'}),
    T('msAds','Microsoft Advertising account ID'),T('lsa','Local Services Ads account'),
    T('metaPixel','Meta pixel ID'),T('metaAdAccount','Meta ad account ID'),
    T('callTracking','Call tracking provider'),T('crm','CRM'),T('booking','Booking or scheduling tool'),
    T('vault','Where credentials are stored',{ph:'Name of the password manager vault, not the passwords',w:1})]},
  {id:'website',t:'Website and technology',n:'The technical facts we need before touching schema, speed or hosting.',f:[
    T('cms','Website platform',{t:'select',o:['Webflow','WordPress','Wix','Squarespace','Shopify','Custom code','Other']}),
    T('hosting','Hosting provider'),T('registrar','Domain registrar'),T('domainExpiry','Domain renewal date',{t:'date'}),
    T('dns','DNS provider'),T('emailHost','Email provider'),T('sitemap','Sitemap URL'),T('pageCount','Approximate page count'),
    T('schemaStatus','Structured data status',{t:'select',o:['Not started','Partial','Full @graph with @id anchors']}),
    T('llmsTxt','llms.txt',{t:'select',o:['Not published','Published','Not applicable']}),
    T('techNotes','Technical notes',{t:'textarea'})]},
  {id:'brand',t:'Brand and voice',n:'So content, ads and design sound and look like the client.',f:[
    T('brandColors','Brand colors',{ph:'Hex codes'}),T('fonts','Fonts'),T('tagline','Tagline'),T('tone','Tone of voice'),
    T('styleGuide','Style guide URL'),T('assetsFolder','Shared assets folder URL'),
    T('logoNotes','Logo and usage notes',{t:'textarea'})]},
  {id:'goals',t:'Audience and goals',n:'What success looks like for this client.',f:[
    T('audience','Target audience',{t:'textarea',core:1}),T('idealCustomer','Ideal customer',{t:'textarea'}),
    T('goals','Goals for the next 12 months',{t:'textarea',core:1}),T('kpis','KPIs that matter most',{t:'textarea'}),
    T('avgJob','Average job value',{ph:'Client supplied'}),T('closeRate','Lead to job close rate',{ph:'Client supplied'}),
    T('adBudget','Monthly ad budget',{ph:'Client supplied'}),
    T('seasonality','Busy and slow seasons',{t:'textarea'}),T('offLimits','Topics, claims or services to avoid',{t:'textarea'})]},
  {id:'engagement',t:'Engagement details',n:'Our side of the relationship.',f:[
    T('package','Package or plan'),T('servicesPurchased','Services included',{t:'textarea'}),
    T('startDate','Start date',{t:'date'}),T('renewalDate','Renewal date',{t:'date'}),
    T('billingCycle','Billing cycle',{t:'select',o:['Monthly','Quarterly','Annual','One time']}),
    T('reportCadence','Report cadence',{t:'select',o:['Weekly','Monthly','Quarterly']}),T('reportRecipients','Report recipients'),
    T('notes','Internal notes',{t:'textarea'})]}
];
function infoVal(c,k){
  if(k==='_name')return c.name;if(k==='_domain')return c.domain;if(k==='_brand')return c.brand;if(k==='_currency')return c.currency;
  return c.info[k]||'';
}
function fieldHTML(c,f){
  var v=infoVal(c,f.k),wide=(f.t==='textarea'||f.w)?' wide':'',inner;
  if(f.t==='textarea')inner='<textarea rows="3" data-info="'+f.k+'" placeholder="'+esc(f.ph||'')+'">'+esc(v)+'</textarea>';
  else if(f.t==='select')inner='<select data-info="'+f.k+'"><option value=""></option>'+f.o.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
  else inner='<input type="'+(f.t==='date'?'date':'text')+'" data-info="'+f.k+'" value="'+esc(v)+'" placeholder="'+esc(f.ph||'')+'"'+(f.list?' list="dl_'+f.list+'"':'')+(f.max?' maxlength="'+f.max+'"':'')+'>';
  return '<label class="f'+wide+'">'+esc(f.l)+inner+'</label>';
}
function infoCompleteness(c){
  var core=[],filled=0;
  INFO.forEach(function(s){s.f.forEach(function(f){if(f.core)core.push(f);});});
  core.forEach(function(f){if(String(infoVal(c,f.k)||'').trim())filled++;});
  var comps=(c.info.competitors||[]).filter(function(x){return x&&x.name;}).length;
  return {filled:filled+(comps?1:0),total:core.length+1};
}
function viewClientInfo(c){
  var cp=infoCompleteness(c),pct=Math.round(cp.filled/cp.total*100);
  var h='<datalist id="dl_trades">'+TRADES.map(function(t){return '<option value="'+esc(t)+'">';}).join('')+'</datalist>';
  h+='<div class="card" style="margin-top:14px"><h3>'+pct+'% of key details captured</h3><p class="note">'+cp.filled+' of '+cp.total+' priority fields are filled in. Everything here is saved with the client and shared with your team. Do not enter passwords or card numbers.</p><div class="prog" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div><div class="savebar"><button class="btn primary" data-act="save-info">Save client info</button><span class="note" style="margin:0" id="infoStamp">'+(c.info._saved?'Last saved '+esc(longDate(c.info._saved)):'')+'</span></div></div>';
  INFO.forEach(function(s){
    h+='<div class="section" style="margin-top:22px"><div class="card"><h3>'+esc(s.t)+'</h3><p class="note">'+esc(s.n)+'</p><div class="form">'+s.f.map(function(f){return fieldHTML(c,f);}).join('')+'</div></div></div>';
  });
  var comp=c.info.competitors||[];
  h+='<div class="section" style="margin-top:22px"><div class="card"><h3>Competitors</h3><p class="note">Up to five businesses the client competes with in search. Used when reviewing rankings and AI answers.</p>';
  for(var i=0;i<5;i++){
    var x=comp[i]||{};
    h+='<div class="form" style="margin-bottom:10px"><label class="f">Name<input type="text" data-comp="n'+i+'" value="'+esc(x.name||'')+'"></label><label class="f">Website<input type="text" data-comp="u'+i+'" value="'+esc(x.url||'')+'"></label><label class="f">Notes<input type="text" data-comp="t'+i+'" value="'+esc(x.notes||'')+'"></label></div>';
  }
  h+='</div></div><div class="savebar" style="margin-top:16px"><button class="btn primary" data-act="save-info">Save client info</button></div>';
  return h;
}
function saveInfo(c){
  var inf=Object.assign({},c.info);
  $$('[data-info]').forEach(function(el){
    var k=el.dataset.info,v=el.value.trim();
    if(k==='_name')c.name=v||c.name;
    else if(k==='_domain')c.domain=v;
    else if(k==='_brand')c.brand=v;
    else if(k==='_currency')c.currency=v||'$';
    else inf[k]=v;
  });
  var comps=[];
  for(var i=0;i<5;i++){
    var n=$('[data-comp="n'+i+'"]'),u=$('[data-comp="u'+i+'"]'),t=$('[data-comp="t'+i+'"]');
    var o={name:n?n.value.trim():'',url:u?u.value.trim():'',notes:t?t.value.trim():''};
    if(o.name||o.url||o.notes)comps.push(o);
  }
  inf.competitors=comps;inf._saved=isoOf(new Date());
  c.info=inf;formDirty=false;saveClient(c);
}

/* ---------- keyword and service area tracking ---------- */
var TRACK_MAX=25,TRACK_TARGET=10;
function nq(s){return String(s==null?'':s).toLowerCase().replace(/\s+/g,' ').trim();}
function pageIs(rowPage,target){
  var t=String(target||'').trim().toLowerCase();if(!t)return false;
  var a=String(rowPage||'').trim().toLowerCase().replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/[?#].*$/,'').replace(/\/+$/,'');
  if(t.charAt(0)==='/'){var tp=t.replace(/[?#].*$/,'').replace(/\/+$/,''),i=a.indexOf('/'),path=i<0?'':a.slice(i);return path===tp;}
  return a===t.replace(/^https?:\/\//,'').replace(/^www\./,'').replace(/[?#].*$/,'').replace(/\/+$/,'');
}
function aggRows(rows,fn){
  var n=0,clicks=0,imp=0,pw=0,pi=0,one=null;
  rows.forEach(function(r){if(!fn(r))return;n++;one=r;clicks+=r.clicks||0;imp+=r.impressions||0;if(r.position!=null&&r.impressions){pw+=r.position*r.impressions;pi+=r.impressions;}});
  if(!n)return {n:0,clicks:null,imp:null,ctr:null,pos:null};
  var pos=pi?pw/pi:(n===1&&one.position!=null?one.position:null);
  return {n:n,clicks:clicks,imp:imp,ctr:imp?clicks/imp:null,pos:pos};
}
function engRows(c,eng,kind){return D(c,(eng==='bing'?'bing':'gsc')+'_'+kind);}
function kwStats(c,eng,text){var t=nq(text);return aggRows(engRows(c,eng,'queries'),function(r){var q=nq(r.query);return state.variants?q.indexOf(t)>=0:q===t;});}
function areaStats(c,eng,a){
  var terms=[a.name].concat(String(a.terms||'').split(',')).map(nq).filter(Boolean);
  return aggRows(engRows(c,eng,'queries'),function(r){var q=nq(r.query);return terms.some(function(t){return q.indexOf(t)>=0;});});
}
function pageStats(c,eng,page){return aggRows(engRows(c,eng,'pages'),function(r){return pageIs(r.page,page);});}
function logFor(c,item){
  var t=nq(item),rows=D(c,'rank_log').filter(function(r){return nq(r.item)===t;}).sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  if(!rows.length)return null;
  var cur=rows[rows.length-1],same=rows.filter(function(r){return nq(r.engine)===nq(cur.engine);}),prev=same.length>1?same[same.length-2]:null;
  return {cur:cur,prev:prev};
}
function posCell(p){
  if(p==null||!isFinite(p))return '<span class="cell n">Not in export</span>';
  var cl=p<=3.49?'c':(p<=10.49?'m':'n');
  return '<span class="cell '+cl+'">'+p.toFixed(1)+'</span>';
}
function nz(v,f){return v==null?'-':f(v);}
function logCell(lg){
  if(!lg)return '<span class="cell n">Not logged</span>';
  var h=posCell(lg.cur.position)+' <span class="mini">'+esc(lg.cur.engine)+'</span>';
  if(lg.prev){var d=lg.prev.position-lg.cur.position;if(Math.abs(d)>=0.05)h+=' <span class="d '+(d>0?'up':'soft')+'">'+(d>0?'\u25B2 ':'\u25BC ')+Math.abs(d).toFixed(1)+'</span>';}
  return h;
}
function bestGoogle(g,lg){
  if(lg&&/google/i.test(lg.cur.engine)&&!/map/i.test(lg.cur.engine))return lg.cur.position;
  return g.pos;
}
function rowBtns(kind,id){return '<span class="rowbtns"><button class="btn small" data-act="tr-edit" data-kind="'+kind+'" data-id="'+esc(id)+'">Edit</button><button class="btn small warn" data-act="tr-del" data-kind="'+kind+'" data-id="'+esc(id)+'">Remove</button></span>';}
function trackingUnion(c){
  var out=[];
  c.tracking.keywords.forEach(function(k){out.push(k.text);});
  c.tracking.areas.forEach(function(a){out.push(a.name);});
  c.tracking.services.forEach(function(s){out.push(s.name);});
  return out;
}
function viewTracking(c){
  var T0=c.tracking,w=windowFor(c);
  var h='<p class="lead" style="margin-top:14px">Choose the keywords, service areas and main services you want us to track. Search Console and Bing numbers are matched automatically from your imported Queries and Pages exports. Rankings from a rank tracker or map checks can be logged below.</p>';
  h+='<div class="chips" style="margin-bottom:6px"><label style="display:inline-flex;gap:8px;align-items:center;font-size:15.5px;color:var(--muted)"><input type="checkbox" id="variantsChk"'+(state.variants?' checked':'')+'> Include close variants (queries that contain the keyword or area)</label></div>';

  /* keywords */
  var kw=T0.keywords.map(function(k){
    var g=kwStats(c,'google',k.text),b=kwStats(c,'bing',k.text),lg=logFor(c,k.text);
    return {id:k.id,text:k.text,page:k.page||'',note:k.note||'',gpos:g.pos,gimp:g.imp,gclk:g.clicks,gctr:g.ctr,bpos:b.pos,bimp:b.imp,bclk:b.clicks,bctr:b.ctr,lgpos:lg?lg.cur.position:null,lg:lg,best:bestGoogle(g,lg)};
  });
  var top3=kw.filter(function(r){return r.best!=null&&r.best<=3.49;}).length,top10=kw.filter(function(r){return r.best!=null&&r.best<=10.49;}).length;
  var tclk=0,timp=0;kw.forEach(function(r){tclk+=(r.gclk||0)+(r.bclk||0);timp+=(r.gimp||0)+(r.bimp||0);});
  h+='<div class="kpis" style="margin-top:12px">'+
    kpiCard({label:'Keywords tracked',color:'var(--gold)',cur:T0.keywords.length,prev:null,fmt:fmtNum,o:{sub:'Recommended: '+TRACK_TARGET}})+
    kpiCard({label:'In the top 3',color:'var(--google)',cur:top3,prev:null,fmt:fmtNum,o:{sub:'Best known Google position'}})+
    kpiCard({label:'In the top 10',color:'var(--google)',cur:top10,prev:null,fmt:fmtNum,o:{sub:'Best known Google position'}})+
    kpiCard({label:'Clicks on tracked keywords',color:'var(--gold)',cur:tclk,prev:null,fmt:fmtNum,o:{sub:'Google and Bing exports'}})+
    kpiCard({label:'Impressions on tracked keywords',color:'var(--gold)',cur:timp,prev:null,fmt:fmtNum,o:{sub:'Google and Bing exports'}})+'</div>';
  h+='<div class="section"><h2>The '+T0.keywords.length+' keywords we are tracking</h2><div class="card">';
  if(kw.length){
    h+='<p class="note">Search Console and Bing exports list top queries only, so a keyword can read Not in export even when it ranks. Log its rank below to keep the picture complete.</p>'+
      tableSlot('kw',{search:false,rows:kw,sort:'gclk',cols:[
        {k:'text',l:'Keyword',wrap:true,raw:true,f:function(r){return esc(r.text)+(r.note?'<div class="mini">'+esc(r.note)+'</div>':'');}},
        {k:'page',l:'Target page',wrap:true},
        {k:'gpos',l:'Google position',num:true,raw:true,f:function(r){return posCell(r.gpos);}},
        {k:'gimp',l:'Google impressions',num:true,f:function(r){return nz(r.gimp,fmtNum);}},
        {k:'gclk',l:'Google clicks',num:true,f:function(r){return nz(r.gclk,fmtNum);}},
        {k:'gctr',l:'Google CTR',num:true,f:function(r){return nz(r.gctr,fmtPct);}},
        {k:'bpos',l:'Bing position',num:true,raw:true,f:function(r){return posCell(r.bpos);}},
        {k:'bimp',l:'Bing impressions',num:true,f:function(r){return nz(r.bimp,fmtNum);}},
        {k:'bclk',l:'Bing clicks',num:true,f:function(r){return nz(r.bclk,fmtNum);}},
        {k:'bctr',l:'Bing CTR',num:true,f:function(r){return nz(r.bctr,fmtPct);}},
        {k:'lgpos',l:'Logged rank',num:true,raw:true,f:function(r){return logCell(r.lg);}},
        {k:'id',l:'',raw:true,f:function(r){return rowBtns('keywords',r.id);}}]});
  }else h+='<div class="empty-s">No keywords yet. Add the ones you want tracked below.</div>';
  h+='</div><div class="card" style="margin-top:12px"><h3>Add keywords</h3><p class="note">One per line. Optional parts after a bar: target page, then a note. Up to '+TRACK_MAX+' keywords.</p><textarea rows="4" id="bulk_keywords" placeholder="your keyword | /target-page/ | optional note"></textarea><div class="savebar"><button class="btn primary" data-act="tr-bulk" data-kind="keywords">Add keywords</button></div></div></div>';

  /* service areas */
  var ar=T0.areas.map(function(a){
    var g=areaStats(c,'google',a),b=areaStats(c,'bing',a),pg=a.page?pageStats(c,'google',a.page):{clicks:null,imp:null,pos:null},lg=logFor(c,a.name);
    return {id:a.id,name:a.name,type:a.type||'',page:a.page||'',note:a.note||'',gn:g.n,gimp:g.imp,gclk:g.clicks,gpos:g.pos,bn:b.n,bimp:b.imp,bclk:b.clicks,bpos:b.pos,pclk:pg.clicks,pimp:pg.imp,lg:lg,lgpos:lg?lg.cur.position:null,any:(g.n+b.n)>0};
  });
  var withVis=ar.filter(function(r){return r.any;}).length;
  h+='<div class="kpis" style="margin-top:22px">'+
    kpiCard({label:'Service areas tracked',color:'var(--gold)',cur:T0.areas.length,prev:null,fmt:fmtNum,o:{sub:'Recommended: '+TRACK_TARGET}})+
    kpiCard({label:'Areas appearing in search',color:'var(--gbp)',cur:withVis,prev:null,fmt:fmtNum,o:{sub:'Matched in Google or Bing queries'}})+'</div>';
  h+='<div class="section"><h2>The '+T0.areas.length+' service areas we are tracking</h2><div class="card">';
  if(ar.length){
    h+='<p class="note">Area numbers add up every exported query that mentions the area name or its extra match terms. Page numbers come from the target page in your Pages export.</p>'+
      tableSlot('ar',{search:false,rows:ar,sort:'gclk',cols:[
        {k:'name',l:'Service area',wrap:true,raw:true,f:function(r){return esc(r.name)+(r.type?' <span class="tag">'+esc(r.type)+'</span>':'')+(r.note?'<div class="mini">'+esc(r.note)+'</div>':'');}},
        {k:'page',l:'Target page',wrap:true},
        {k:'gn',l:'Google queries',num:true,f:function(r){return fmtNum(r.gn);}},
        {k:'gimp',l:'Google impressions',num:true,f:function(r){return nz(r.gimp,fmtNum);}},
        {k:'gclk',l:'Google clicks',num:true,f:function(r){return nz(r.gclk,fmtNum);}},
        {k:'gpos',l:'Google avg. position',num:true,raw:true,f:function(r){return posCell(r.gpos);}},
        {k:'bn',l:'Bing queries',num:true,f:function(r){return fmtNum(r.bn);}},
        {k:'bimp',l:'Bing impressions',num:true,f:function(r){return nz(r.bimp,fmtNum);}},
        {k:'bclk',l:'Bing clicks',num:true,f:function(r){return nz(r.bclk,fmtNum);}},
        {k:'bpos',l:'Bing avg. position',num:true,raw:true,f:function(r){return posCell(r.bpos);}},
        {k:'pclk',l:'Page clicks (Google)',num:true,f:function(r){return nz(r.pclk,fmtNum);}},
        {k:'lgpos',l:'Logged rank',num:true,raw:true,f:function(r){return logCell(r.lg);}},
        {k:'id',l:'',raw:true,f:function(r){return rowBtns('areas',r.id);}}]});
  }else h+='<div class="empty-s">No service areas yet. Add the cities, counties or neighborhoods you want tracked below.</div>';
  h+='</div><div class="card" style="margin-top:12px"><h3>Add service areas</h3><p class="note">One per line: area name | type | target page | extra match terms (comma separated). Up to '+TRACK_MAX+' areas.</p><textarea rows="4" id="bulk_areas" placeholder="Area name | City | /areas/area-name/ | nearby name, county name"></textarea><div class="savebar"><button class="btn primary" data-act="tr-bulk" data-kind="areas">Add service areas</button></div></div></div>';

  /* main services */
  var sv=T0.services.map(function(s){
    var kws=s.keyword?kwStats(c,'google',s.keyword):{pos:null,clicks:null,imp:null},kwb=s.keyword?kwStats(c,'bing',s.keyword):{pos:null,clicks:null,imp:null};
    var pg=s.page?pageStats(c,'google',s.page):{pos:null,clicks:null,imp:null},lg=logFor(c,s.name)||(s.keyword?logFor(c,s.keyword):null);
    var best=bestGoogle(kws,lg);if(best==null&&pg.pos!=null)best=pg.pos;
    return {id:s.id,name:s.name,keyword:s.keyword||'',page:s.page||'',note:s.note||'',gpos:kws.pos,bpos:kwb.pos,kclk:(kws.clicks||0)+(kwb.clicks||0)||(kws.clicks==null&&kwb.clicks==null?null:0),kimp:(kws.imp||0)+(kwb.imp||0)||(kws.imp==null&&kwb.imp==null?null:0),pclk:pg.clicks,pimp:pg.imp,ppos:pg.pos,lg:lg,best:best};
  });
  var svTop10=sv.filter(function(r){return r.best!=null&&r.best<=10.49;}).length;
  h+='<div class="kpis" style="margin-top:22px">'+
    kpiCard({label:'Main services tracked',color:'var(--gold)',cur:T0.services.length,prev:null,fmt:fmtNum,o:{sub:'Recommended: '+TRACK_TARGET+' or fewer'}})+
    kpiCard({label:'Services ranking in the top 10',color:'var(--google)',cur:svTop10,prev:null,fmt:fmtNum,o:{sub:'Best known position'}})+'</div>';
  h+='<div class="section"><h2>Main services and current ranking</h2><div class="card">';
  if(sv.length){
    h+='<p class="note">Current ranking uses the latest logged Google rank for the service or its primary keyword, then the Search Console position for that keyword, then the target page position.</p>'+
      tableSlot('sv',{search:false,rows:sv,sort:'best',dir:1,cols:[
        {k:'name',l:'Main service',wrap:true,raw:true,f:function(r){return esc(r.name)+(r.note?'<div class="mini">'+esc(r.note)+'</div>':'');}},
        {k:'keyword',l:'Primary keyword',wrap:true},
        {k:'page',l:'Target page',wrap:true},
        {k:'best',l:'Current ranking',num:true,raw:true,f:function(r){return posCell(r.best);}},
        {k:'gpos',l:'Google keyword position',num:true,raw:true,f:function(r){return posCell(r.gpos);}},
        {k:'bpos',l:'Bing keyword position',num:true,raw:true,f:function(r){return posCell(r.bpos);}},
        {k:'kimp',l:'Keyword impressions',num:true,f:function(r){return nz(r.kimp,fmtNum);}},
        {k:'kclk',l:'Keyword clicks',num:true,f:function(r){return nz(r.kclk,fmtNum);}},
        {k:'pimp',l:'Page impressions',num:true,f:function(r){return nz(r.pimp,fmtNum);}},
        {k:'pclk',l:'Page clicks',num:true,f:function(r){return nz(r.pclk,fmtNum);}},
        {k:'ppos',l:'Page avg. position',num:true,raw:true,f:function(r){return posCell(r.ppos);}},
        {k:'id',l:'',raw:true,f:function(r){return rowBtns('services',r.id);}}]});
  }else h+='<div class="empty-s">No main services yet. Add the services you want ranked below.</div>';
  h+='</div><div class="card" style="margin-top:12px"><h3>Add main services</h3><p class="note">One per line: service name | primary keyword | target page. Up to '+TRACK_MAX+' services.</p><textarea rows="4" id="bulk_services" placeholder="Service name | primary keyword | /services/service-name/"></textarea><div class="savebar"><button class="btn primary" data-act="tr-bulk" data-kind="services">Add services</button></div></div></div>';

  /* rank log and history */
  var items=trackingUnion(c);
  h+='<div class="section"><h2>Rank log</h2><div class="grid2" style="margin-top:8px"><div class="card"><h3>Log a ranking</h3><p class="note">Record a position from your rank tracker, a map check or a manual search. Logging the same item, engine and date again updates that entry. You can also import a CSV from the Data page.</p>';
  if(items.length){
    h+='<div class="form"><label class="f">Date<input type="date" id="rk_date" value="'+isoOf(new Date())+'"></label>'+
      '<label class="f">Tracked item<select id="rk_item">'+items.map(function(x){return '<option>'+esc(x)+'</option>';}).join('')+'</select></label>'+
      '<label class="f">Engine<input type="text" id="rk_eng" list="rk_engs" value="Google"><datalist id="rk_engs"><option value="Google"><option value="Bing"><option value="Google Maps"><option value="Apple Maps"><option value="Other"></datalist></label>'+
      '<label class="f">Position<input type="text" id="rk_pos" inputmode="decimal" placeholder="4"></label>'+
      '<label class="f">Impressions (optional)<input type="text" id="rk_imp" inputmode="numeric"></label>'+
      '<label class="f">Clicks (optional)<input type="text" id="rk_clk" inputmode="numeric"></label>'+
      '<div><button class="btn primary" data-act="rank-add">Add to rank log</button></div></div>';
  }else h+='<div class="empty-s">Add keywords, areas or services first, then log their rankings here.</div>';
  h+='</div>';
  var logged=Array.from(new Set(D(c,'rank_log').map(function(r){return r.item;})));
  var sel=state.rankItem&&logged.indexOf(state.rankItem)>=0?state.rankItem:(logged[0]||'');
  h+='<div class="card"><h3>Rank history</h3>';
  if(sel){
    var rows=D(c,'rank_log').filter(function(r){return r.item===sel;}),engs=Array.from(new Set(rows.map(function(r){return r.engine;})));
    var pal=['var(--google)','var(--bing)','var(--gold)','var(--ai)','var(--gbp)'];
    var series=engs.map(function(e,i){var m={};rows.filter(function(r){return r.engine===e;}).forEach(function(r){m[r.date]=r.position;});return {name:e,color:pal[i%pal.length],pts:Object.keys(m).sort().map(function(d){return {x:d,y:m[d]};})};});
    h+='<p class="note">Lower is better, so improvements move up the chart.</p><label class="f" style="margin-bottom:8px">Item<select id="rankSel">'+logged.map(function(x){return '<option'+(x===sel?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select></label>'+
      chartSlot(function(el){drawLine(el,series,{label:'Rank history',legend:true,invert:true,zero:false,fmt:function(v){return v.toFixed(1);},axis:function(v){return v.toFixed(0);}});});
  }else h+='<div class="empty-s">Logged rankings will chart here.</div>';
  h+='</div></div></div>';
  return h;
}
function parseBulk(kind,text){
  var out=[];
  String(text).split(/\r?\n/).forEach(function(line){
    var p=line.split('|').map(function(x){return x.trim();});
    if(!p[0])return;
    if(kind==='keywords')out.push({id:uid(),text:p[0],page:p[1]||'',note:p[2]||''});
    else if(kind==='areas')out.push({id:uid(),name:p[0],type:p[1]||'',page:p[2]||'',terms:p[3]||'',note:''});
    else out.push({id:uid(),name:p[0],keyword:p[1]||'',page:p[2]||'',note:''});
  });
  return out;
}
var EDIT_FIELDS={
  keywords:[['text','Keyword'],['page','Target page'],['note','Note']],
  areas:[['name','Service area'],['type','Type (city, county, neighborhood)'],['page','Target page'],['terms','Extra match terms (comma separated)'],['note','Note']],
  services:[['name','Main service'],['keyword','Primary keyword'],['page','Target page'],['note','Note']]
};
function editItem(c,kind,id){
  var list=c.tracking[kind],item=list.filter(function(x){return x.id===id;})[0];if(!item)return;
  var fields=EDIT_FIELDS[kind];
  openDialog('Edit '+(kind==='keywords'?'keyword':kind==='areas'?'service area':'service'),
    fields.map(function(f,i){return '<label class="f">'+esc(f[1])+'<input type="text" id="ed_'+i+'" value="'+esc(item[f[0]]||'')+'"></label>';}).join(''),
    [{label:'Cancel'},{label:'Save',primary:true,fn:function(d){
      fields.forEach(function(f,i){item[f[0]]=$('#ed_'+i,d).value.trim();});
      if(!(item.text||item.name))return false;
      saveClient(c);render();
    }}]);
}

/* ---------- data and workspace ---------- */
var mergePrefs={};
function mergePref(k){return k in mergePrefs?mergePrefs[k]:DS[k].merge;}
function syncDesc(){
  if(cloud.kind==='claude')return 'Connected to this dashboard\u2019s cloud storage. Clients, client info, tracking lists and imported data are saved automatically and shared with everyone who has Contributor access or higher.';
  if(cloud.kind==='supabase')return 'Connected to your workspace in the cloud. Clients, client info, tracking lists and imported data are saved automatically and shared with your team.';
  if(cloud.kind==='local')return 'Demo mode: data is saved in this browser only and is not shared. Connect a cloud backend (see the README) or open the dashboard from its claude.ai link to share data with your team.';
  return 'Connecting to storage.';
}
function viewData(c){
  var logo=brandLogo(),customLogo=!!state.agency.logo;
  var h='<div class="section"><h2>Workspace</h2><p class="lead">Branding and storage for the whole workspace. Client details live on the Client info page.</p><div class="grid2">'+
    '<div class="card"><h3>Storage</h3><p class="note">'+esc(syncDesc())+'</p>'+
    (cloud.kind==='supabase'?'<div class="savebar"><button class="btn" data-act="signout">Sign out</button></div>':'')+
    (cloud.kind!=='local'&&readLegacy()?'<div class="savebar"><button class="btn primary" data-act="migrate">Move data saved in this browser to cloud storage</button></div>':'')+'</div>'+
    '<div class="card"><h3>Logo</h3><p class="note">Shown in the sidebar and on printed pages. SVG or PNG works best. Saved with the workspace.</p>'+
    (logo?'<div class="logo-prev'+(state.agency.plate==='light'?' plate-light':'')+'"><img src="'+esc(logo)+'" alt="Current logo"></div><p class="mini">'+(customLogo?'Custom logo uploaded for this workspace.':'Using the default Forty-Second Street logo.')+'</p>':'<p class="note">No logo set yet.</p>')+
    '<div class="savebar"><button class="btn primary" data-act="logo-up">'+(customLogo?'Replace logo':'Upload a different logo')+'</button>'+(customLogo?'<button class="btn warn" data-act="logo-rm">Use default</button>':'')+
    '<label class="f" style="flex-direction:row;align-items:center;gap:8px">Show on<select id="plateSel"><option value="dark"'+(state.agency.plate!=='light'?' selected':'')+'>Dark panel</option><option value="light"'+(state.agency.plate==='light'?' selected':'')+'>Light panel</option></select></label></div></div></div>'+
    '<div class="card" style="margin-top:12px"><h3>Clients</h3><div class="ds-act"><button class="btn primary" data-act="newclient">Add client</button><button class="btn" data-act="sample">Load sample client</button>'+
    (c?'<button class="btn" data-act="backup">Back up this client</button>':'')+'<button class="btn" data-act="restore">Restore from backup</button>'+(c?'<button class="btn warn" data-act="delclient">Delete this client</button>':'')+'</div></div></div>';
  if(!c)return h;
  h+='<div class="section"><h2>Import data</h2><p class="lead">Upload the CSV exactly as your tool exports it, or paste it in. Headers are matched by name, so you do not need to rearrange columns. Dates can be YYYY-MM-DD, YYYYMMDD, or month/day/year. Use Template to get the expected headers.</p>';
  var lastGrp='';
  DS_ORDER.forEach(function(key){
    var ds=DS[key],rows=D(c,key);
    if(ds.grp!==lastGrp){h+=(lastGrp?'</div>':'')+'<div class="group-h"><i class="dot" style="background:'+ds.color+'"></i>'+esc(ds.grp)+'</div><div class="grid2" style="margin-top:0">';lastGrp=ds.grp;}
    var status='No data yet';
    if(rows.length){status=rows.length.toLocaleString('en-US')+' rows';if(rows[0].date){var dts=rows.map(function(r){return r.date;}).sort();status+=', '+longDate(dts[0])+' to '+longDate(dts[dts.length-1]);}}
    h+='<div class="card ds" data-drop="'+key+'"><div class="ds-h"><div><h3>'+esc(ds.title)+'</h3><div class="ds-status'+(rows.length?' ok':'')+'">'+esc(status)+'</div></div></div>'+
      '<div style="font-size:14.5px;color:var(--muted)">Where to find it: '+esc(ds.how)+'</div>'+
      '<div>'+ds.cols.map(function(col){return '<span class="tag">'+esc(col.al[0])+(col.req?' *':'')+'</span>';}).join('')+'</div>'+
      '<div class="ds-act"><button class="btn small" data-act="upload" data-k="'+key+'">Upload CSV</button><button class="btn small" data-act="paste" data-k="'+key+'">Paste</button><button class="btn small" data-act="template" data-k="'+key+'">Template</button>'+(rows.length?'<button class="btn small warn" data-act="clear" data-k="'+key+'">Clear</button>':'')+
      '<label><input type="checkbox" data-merge="'+key+'"'+(mergePref(key)?' checked':'')+'> Merge with existing</label></div></div>';
  });
  h+='</div></div><p class="lead" style="margin-top:10px">* required column. Drag a CSV file onto any card to import it.</p>';
  return h;
}
