/* ---------- windows and aggregation ---------- */
var DAILY_KEYS=['gsc_daily','bing_daily','ga4_daily','gbp_daily','ads_daily'];
function anchorDate(c){var m=null;DAILY_KEYS.forEach(function(k){D(c,k).forEach(function(r){if(!m||r.date>m)m=r.date;});});return m;}
function windowFor(c){
  var a=anchorDate(c);
  if(!a)return {start:null,end:null,pStart:null,pEnd:null,n:0};
  if(state.range==='all'){var mn=a;DAILY_KEYS.forEach(function(k){D(c,k).forEach(function(r){if(r.date<mn)mn=r.date;});});return {start:mn,end:a,pStart:null,pEnd:null,n:dayDiff(mn,a)+1,all:true};}
  var n=+state.range,start=addDays(a,-(n-1));
  return {start:start,end:a,pStart:addDays(start,-n),pEnd:addDays(start,-1),n:n};
}
function inWin(rows,s,e){return rows.filter(function(r){return (!s||r.date>=s)&&(!e||r.date<=e);});}
function sum(rows,k){return rows.reduce(function(a,r){return a+(+r[k]||0);},0);}
function searchAgg(rows){
  var clicks=sum(rows,'clicks'),imp=sum(rows,'impressions'),pw=0,pi=0;
  rows.forEach(function(r){if(r.position!=null&&r.impressions){pw+=r.position*r.impressions;pi+=r.impressions;}});
  return {clicks:clicks,imp:imp,ctr:imp?clicks/imp:null,pos:pi?pw/pi:null};
}
function byDate(rows,fn){var m={};rows.forEach(function(r){m[r.date]=(m[r.date]||0)+fn(r);});return Object.keys(m).sort().map(function(d){return {x:d,y:m[d]};});}

/* ---------- formatting ---------- */
function fmtNum(n){return n==null||!isFinite(n)?'n/a':Math.round(n).toLocaleString('en-US');}
function fmtPct(f){return f==null||!isFinite(f)?'n/a':(f*100).toFixed(1)+'%';}
function fmtPos(p){return p==null||!isFinite(p)?'n/a':p.toFixed(1);}
function money(n){var c=C();return n==null||!isFinite(n)?'n/a':(c.currency||'')+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
function compact(v){var a=Math.abs(v);if(a>=1e6)return +(v/1e6).toFixed(1)+'M';if(a>=1e4)return +(v/1e3).toFixed(0)+'k';if(a>=1e3)return +(v/1e3).toFixed(1)+'k';return String(+v.toFixed(2));}

function deltaHTML(cur,prev,o){
  o=o||{};
  var flat='<span class="d flat">No comparison</span>';
  if(cur==null||prev==null||!isFinite(cur)||!isFinite(prev)||state.range==='all')return flat;
  if(o.pos){
    var dd=cur-prev;if(Math.abs(dd)<0.05)return '<span class="d flat">Steady</span>';
    var better=dd<0;return '<span class="d '+(better?'up':'soft')+'">'+(better?'\u25B2 ':'\u25BC ')+Math.abs(dd).toFixed(1)+' position'+(Math.abs(dd)>=1.5?'s':'')+(better?' higher':' lower')+'</span>';
  }
  if(prev===0)return cur>0?'<span class="d up">\u25B2 New activity</span>':flat;
  var p=(cur-prev)/prev*100;if(Math.abs(p)<0.05)return '<span class="d flat">Steady</span>';
  var good=o.neutral?null:(o.inverse?p<0:p>0);
  var cls=good===null?'flat':(good?'up':'soft');
  return '<span class="d '+cls+'">'+(p>0?'\u25B2 ':'\u25BC ')+Math.abs(p).toFixed(1)+'%</span>';
}

/* ---------- KPI model ---------- */
function kpis(c,w){
  var K={};
  function cur(r){return inWin(r,w.start,w.end);}
  function prv(r){if(!w.pStart)return null;var x=inWin(r,w.pStart,w.pEnd);return x.length?x:null;}
  function add(id,label,color,a,b,fmt,o){K[id]={id:id,label:label,color:color,cur:a,prev:b,fmt:fmt,o:o||{}};}
  var gd=D(c,'gsc_daily'),bd=D(c,'bing_daily'),ga=D(c,'ga4_daily'),gb=D(c,'gbp_daily'),ad=D(c,'ads_daily'),ai=D(c,'ai_log');
  var g=null,gp=null,b=null,bp=null;
  if(gd.length){
    g=searchAgg(cur(gd));var pr=prv(gd);gp=pr?searchAgg(pr):null;
    add('g_clicks','Google clicks','var(--google)',g.clicks,gp&&gp.clicks,fmtNum);
    add('g_imp','Google impressions','var(--google)',g.imp,gp&&gp.imp,fmtNum);
    add('g_ctr','Google click-through rate','var(--google)',g.ctr,gp&&gp.ctr,fmtPct);
    add('g_pos','Google average position','var(--google)',g.pos,gp&&gp.pos,fmtPos,{pos:true});
  }
  if(bd.length){
    b=searchAgg(cur(bd));var pr2=prv(bd);bp=pr2?searchAgg(pr2):null;
    add('b_clicks','Bing clicks','var(--bing)',b.clicks,bp&&bp.clicks,fmtNum);
    add('b_imp','Bing impressions','var(--bing)',b.imp,bp&&bp.imp,fmtNum);
    add('b_ctr','Bing click-through rate','var(--bing)',b.ctr,bp&&bp.ctr,fmtPct);
    add('b_pos','Bing average position','var(--bing)',b.pos,bp&&bp.pos,fmtPos,{pos:true});
  }
  if(g&&b)add('o_clicks','Organic clicks, Google and Bing','var(--gold)',g.clicks+b.clicks,(gp&&bp)?gp.clicks+bp.clicks:null,fmtNum);
  if(ga.length){
    var a1=cur(ga),p1=prv(ga);
    var s=sum(a1,'sessions'),e=sum(a1,'engaged'),ev=sum(a1,'events');
    var ps=p1?sum(p1,'sessions'):null,pe=p1?sum(p1,'engaged'):null,pev=p1?sum(p1,'events'):null;
    add('ga_sessions','Sessions','var(--ga)',s,ps,fmtNum);
    add('ga_engaged','Engaged sessions','var(--ga)',e,pe,fmtNum);
    add('ga_erate','Engagement rate','var(--ga)',s?e/s:null,p1&&ps?pe/ps:null,fmtPct);
    add('ga_events','Key events','var(--ga)',ev,pev,fmtNum);
    add('ga_krate','Key event rate','var(--ga)',s?ev/s:null,p1&&ps?pev/ps:null,fmtPct);
  }
  if(gb.length){
    var a2=cur(gb),p2=prv(gb);
    var vw=sum(a2,'views'),cl=sum(a2,'calls'),di=sum(a2,'directions'),wb=sum(a2,'website');
    add('gbp_views','Profile views','var(--gbp)',vw,p2?sum(p2,'views'):null,fmtNum);
    add('gbp_calls','Calls','var(--gbp)',cl,p2?sum(p2,'calls'):null,fmtNum);
    add('gbp_dir','Direction requests','var(--gbp)',di,p2?sum(p2,'directions'):null,fmtNum);
    add('gbp_web','Website clicks','var(--gbp)',wb,p2?sum(p2,'website'):null,fmtNum);
    add('gbp_actions','Profile actions','var(--gbp)',cl+di+wb,p2?sum(p2,'calls')+sum(p2,'directions')+sum(p2,'website'):null,fmtNum);
  }
  if(ad.length){
    var a3=cur(ad),p3=prv(ad);
    var cost=sum(a3,'cost'),clk=sum(a3,'clicks'),imp=sum(a3,'impressions'),cv=sum(a3,'conversions');
    var pc=p3?sum(p3,'cost'):null,pk=p3?sum(p3,'clicks'):null,pcv=p3?sum(p3,'conversions'):null;
    add('ads_cost','Ad spend','var(--ads)',cost,pc,money,{neutral:true});
    add('ads_clicks','Ad clicks','var(--ads)',clk,pk,fmtNum);
    add('ads_imp','Ad impressions','var(--ads)',imp,p3?sum(p3,'impressions'):null,fmtNum);
    add('ads_conv','Ad conversions','var(--ads)',cv,pcv,fmtNum);
    add('ads_cpc','Cost per click','var(--ads)',clk?cost/clk:null,p3&&pk?pc/pk:null,money,{inverse:true});
    add('ads_cpa','Cost per conversion','var(--ads)',cv?cost/cv:null,p3&&pcv?pc/pcv:null,money,{inverse:true});
  }
  if(ai.length){
    var n=ai.length,m=ai.filter(function(r){return r.mentioned||r.cited;}).length,ci=ai.filter(function(r){return r.cited;}).length;
    add('ai_mention','AI mention rate','var(--ai)',m/n,null,fmtPct,{sub:'across '+n+' logged checks'});
    add('ai_cite','AI citation rate','var(--ai)',ci/n,null,fmtPct,{sub:'across '+n+' logged checks'});
  }
  return K;
}
function kpiCard(k){
  var val=k.cur==null?'n/a':k.fmt(k.cur);
  var d=k.o.sub?'<span class="d flat">'+esc(k.o.sub)+'</span>':deltaHTML(k.cur,k.prev,{pos:k.o.pos,inverse:k.o.inverse,neutral:k.o.neutral});
  return '<div class="kpi" style="--c:'+k.color+'"><div class="kpi-l">'+esc(k.label)+'</div><div class="kpi-v">'+esc(val)+'</div>'+d+'</div>';
}
