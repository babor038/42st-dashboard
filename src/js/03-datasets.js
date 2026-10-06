/* ---------- dataset definitions ---------- */
function searchCols(dim){
  var cols=[];
  if(dim==='daily')cols.push({k:'date',t:'date',req:1,al:['date','day','dates']});
  if(dim==='query')cols.push({k:'query',t:'str',req:1,al:['query','top queries','queries','search query','keyword']});
  if(dim==='page')cols.push({k:'page',t:'str',req:1,al:['page','top pages','pages','url','landing page']});
  cols.push({k:'clicks',t:'num',req:1,al:['clicks','total clicks']});
  cols.push({k:'impressions',t:'num',req:1,al:['impressions','total impressions']});
  cols.push({k:'ctr',t:'pct',al:['ctr','click through rate','url ctr']});
  cols.push({k:'position',t:'num',al:['position','average position','avg position','avg impression position','avg click position','avg pos']});
  return cols;
}
var DS={
  gsc_daily:{grp:'Google Search Console',title:'Daily performance',how:'Performance, then Export, then the Dates file',cols:searchCols('daily'),keys:['date'],merge:true,color:'var(--google)'},
  gsc_queries:{grp:'Google Search Console',title:'Queries',how:'Performance, then Export, then the Queries file',cols:searchCols('query'),keys:['query'],merge:false,color:'var(--google)'},
  gsc_pages:{grp:'Google Search Console',title:'Pages',how:'Performance, then Export, then the Pages file',cols:searchCols('page'),keys:['page'],merge:false,color:'var(--google)'},
  bing_daily:{grp:'Bing Webmaster Tools',title:'Daily performance',how:'Search Performance, then export the date view',cols:searchCols('daily'),keys:['date'],merge:true,color:'var(--bing)'},
  bing_queries:{grp:'Bing Webmaster Tools',title:'Queries',how:'Search Performance, then export the query view',cols:searchCols('query'),keys:['query'],merge:false,color:'var(--bing)'},
  bing_pages:{grp:'Bing Webmaster Tools',title:'Pages',how:'Search Performance, then export the pages view',cols:searchCols('page'),keys:['page'],merge:false,color:'var(--bing)'},
  ga4_daily:{grp:'Google Analytics 4',title:'Daily traffic',how:'Reports, then Download file as CSV, with Date as the dimension',color:'var(--ga)',keys:['date'],merge:true,cols:[
    {k:'date',t:'date',req:1,al:['date','day','dates']},
    {k:'sessions',t:'num',req:1,al:['sessions']},
    {k:'users',t:'num',al:['total users','users','active users']},
    {k:'engaged',t:'num',al:['engaged sessions']},
    {k:'events',t:'num',al:['key events','conversions','key event count','total key events']}]},
  ga4_channels:{grp:'Google Analytics 4',title:'Traffic channels',how:'Reports, then Acquisition, then export Session default channel group',color:'var(--ga)',keys:['channel'],merge:false,cols:[
    {k:'channel',t:'str',req:1,al:['session default channel group','default channel group','channel','channel group','session primary channel group','session source medium','source medium']},
    {k:'sessions',t:'num',req:1,al:['sessions']},
    {k:'users',t:'num',al:['total users','users','active users']},
    {k:'engaged',t:'num',al:['engaged sessions']},
    {k:'events',t:'num',al:['key events','conversions','key event count','total key events']}]},
  gbp_daily:{grp:'Google Business Profile',title:'Profile actions',how:'Performance, then copy or export daily or monthly totals',color:'var(--gbp)',keys:['date'],merge:true,cols:[
    {k:'date',t:'date',req:1,al:['date','day','month','dates']},
    {k:'views',t:'num',al:['views','total views','profile views','impressions']},
    {k:'calls',t:'num',al:['calls','call clicks','phone calls']},
    {k:'directions',t:'num',al:['directions','direction requests','driving directions']},
    {k:'website',t:'num',al:['website clicks','website visits','website']}]},
  ads_daily:{grp:'Google Ads and Microsoft Advertising',title:'Daily ad performance',how:'Reports, then download by day. Add a Platform column to combine both networks',color:'var(--ads)',keys:['date','platform'],merge:true,cols:[
    {k:'date',t:'date',req:1,al:['date','day','dates']},
    {k:'platform',t:'str',def:'Ads',al:['platform','network','source']},
    {k:'cost',t:'num',req:1,al:['cost','spend','amount spent']},
    {k:'clicks',t:'num',al:['clicks']},
    {k:'impressions',t:'num',al:['impressions','impr']},
    {k:'conversions',t:'num',al:['conversions','all conversions','conv']}]},
  ai_log:{grp:'AI visibility',title:'Prompt check log',how:'Log each prompt you test in ChatGPT, Claude, Gemini, Perplexity, Copilot and Google AI features',color:'var(--ai)',keys:['date','platform','prompt'],merge:true,cols:[
    {k:'date',t:'date',req:1,al:['date','checked','day']},
    {k:'platform',t:'str',req:1,al:['platform','engine','assistant','ai platform']},
    {k:'prompt',t:'str',req:1,al:['prompt','query','question']},
    {k:'mentioned',t:'bool',al:['mentioned','brand mentioned','mention']},
    {k:'cited',t:'bool',al:['cited','citation','site cited','linked']},
    {k:'competitors',t:'str',al:['competitors','competitors mentioned','competitor']},
    {k:'notes',t:'str',al:['notes','note']}]},
  rank_log:{grp:'Rank tracking',title:'Rank log',how:'Export from your rank tracker, or log checks on the Keywords and areas page',cols:[
    {k:'date',t:'date',req:1,al:['date','checked','day']},
    {k:'item',t:'str',req:1,al:['item','keyword','keywords','term','service','area','name','query']},
    {k:'engine',t:'str',def:'Google',al:['engine','search engine','platform','source']},
    {k:'position',t:'num',req:1,al:['position','rank','ranking','current position','avg position','average position']},
    {k:'impressions',t:'num',al:['impressions']},
    {k:'clicks',t:'num',al:['clicks']}],keys:['date','item','engine'],merge:true,color:'var(--gold)'}
};
var DS_ORDER=Object.keys(DS);
var AI_PLATFORMS=['ChatGPT','Claude','Gemini','Perplexity','Microsoft Copilot','Google AI Overviews','Google AI Mode'];

var CHECKS=[
  ['Schema','sch1','Sitewide @graph with stable @id anchors for the Organization or LocalBusiness and the WebSite'],
  ['Schema','sch2','Page-level schema points to sitewide entities by @id instead of repeating NAP details'],
  ['Schema','sch3','Structured data validates with no errors'],
  ['Schema','sch4','sameAs profiles listed for brand entity consistency'],
  ['Indexing','idx1','XML sitemap submitted in Google Search Console'],
  ['Indexing','idx2','XML sitemap submitted in Bing Webmaster Tools'],
  ['Indexing','idx3','IndexNow configured for fast URL submission'],
  ['Indexing','idx4','Unique titles, meta descriptions and canonical tags on key pages'],
  ['Crawlability and AI access','crl1','robots.txt reviewed for search and AI crawlers (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Google-Extended)'],
  ['Crawlability and AI access','crl2','Key content is available in the HTML without heavy JavaScript rendering'],
  ['Crawlability and AI access','crl3','llms.txt published (optional)'],
  ['Content and AEO','cnt1','Keyword-seeded H1 with a geographic qualifier and a direct opening paragraph'],
  ['Content and AEO','cnt2','Full service fanout with named subsections and a service area section by county and city'],
  ['Content and AEO','cnt3','10 tightly written FAQs targeting exact queries'],
  ['Content and AEO','cnt4','Related services cross-linked'],
  ['Performance','prf1','Core Web Vitals reviewed on key templates'],
  ['Performance','prf2','Mobile usability and HTTPS confirmed'],
  ['Local and tracking','loc1','Google Business Profile complete and consistent with sitewide schema'],
  ['Local and tracking','loc2','Bing Places listing claimed and verified'],
  ['Local and tracking','trk1','GA4 key events configured']
];

/* ---------- CSV parsing and import ---------- */
function parseCSV(text){
  text=String(text).replace(/^\uFEFF/,'');
  var lines=text.split(/\r?\n/),i=0;
  while(i<lines.length&&(!lines[i].trim()||lines[i].trim().charAt(0)==='#'))i++;
  var body=lines.slice(i).join('\n');
  var first=body.split('\n')[0]||'',delim=',',best=-1;
  [',','\t',';'].forEach(function(d){var n=first.split(d).length;if(n>best){best=n;delim=d;}});
  var rows=[],row=[],cur='',q=false;
  for(var p=0;p<body.length;p++){
    var ch=body[p];
    if(q){if(ch==='"'){if(body[p+1]==='"'){cur+='"';p++;}else q=false;}else cur+=ch;}
    else if(ch==='"')q=true;
    else if(ch===delim){row.push(cur);cur='';}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&body[p+1]==='\n')p++;row.push(cur);cur='';if(row.some(function(x){return x.trim()!=='';}))rows.push(row);row=[];}
    else cur+=ch;
  }
  row.push(cur);if(row.some(function(x){return x.trim()!=='';}))rows.push(row);
  return rows;
}
function coerce(col,v){
  if(col.t==='date')return parseDate(v);
  if(col.t==='num')return parseNum(v);
  if(col.t==='pct'){var n=parseNum(v);if(n!=null&&String(v).indexOf('%')<0&&n>1)n=n/100;return n;}
  if(col.t==='bool')return parseBool(v);
  var s=v==null?'':String(v).trim();
  if(s===''&&col.def!==undefined)return col.def;
  return s;
}
function keyOf(ds,r){return ds.keys.map(function(k){return String(r[k]).toLowerCase();}).join('|');}
function ingest(c,key,text,merge){
  var ds=DS[key],rows=parseCSV(text);
  if(rows.length<2)return {err:'No data rows found. Make sure the file has a header row and at least one data row.'};
  var head=rows[0].map(normH),map={};
  ds.cols.forEach(function(col){var idx=-1;for(var a=0;a<col.al.length;a++){var j=head.indexOf(col.al[a]);if(j>=0){idx=j;break;}}map[col.k]=idx;});
  var missing=ds.cols.filter(function(col){return col.req&&map[col.k]<0;}).map(function(col){return col.al[0];});
  if(missing.length)return {err:'Missing required column(s): '+missing.join(', ')+'. Headers found: '+rows[0].join(', ')};
  var out=[],skipped=0;
  for(var r=1;r<rows.length;r++){
    var raw=rows[r],o={},ok=true;
    for(var i=0;i<ds.cols.length;i++){
      var col=ds.cols[i],v=map[col.k]>=0?raw[map[col.k]]:undefined,val=coerce(col,v);
      if(col.req&&(val==null||val==='')){ok=false;break;}
      o[col.k]=val;
    }
    if(!ok){skipped++;continue;}
    out.push(o);
  }
  if(!out.length)return {err:'No valid rows were found. '+skipped+' row(s) were skipped because a required value or date could not be read.'};
  var final;
  if(merge&&ds.keys){
    var m=new Map();
    (c.data[key]||[]).forEach(function(r){m.set(keyOf(ds,r),r);});
    out.forEach(function(r){m.set(keyOf(ds,r),r);});
    final=Array.from(m.values());
  }else final=out;
  if(key==='ai_log')final.forEach(function(r){if(!r.id)r.id=uid();});
  if(ds.keys&&ds.keys[0]==='date')final.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  c.data[key]=final;
  return {added:out.length,skipped:skipped,total:final.length};
}
