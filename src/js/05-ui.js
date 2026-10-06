/* ---------- charts ---------- */
var post=[];
function chartSlot(fn){var id='ch'+post.length;post.push(function(){fn(document.getElementById(id));});return '<div class="chart" id="'+id+'"></div>';}
function niceTicks(min,max,n){
  n=n||4;var span=max-min||1,raw=span/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p;
  var step=(f<=1?1:f<=2?2:f<=5?5:10)*p,lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step,t=[];
  for(var v=lo;v<=hi+step/2;v+=step)t.push(+v.toFixed(10));
  return t;
}
function drawLine(el,series,o){
  o=o||{};var W=760,H=o.h||240,m={l:o.pl||50,r:14,t:12,b:28};
  var dates=Array.from(new Set([].concat.apply([],series.map(function(s){return s.pts.map(function(p){return p.x;});})))).sort();
  if(!dates.length){el.innerHTML='<div class="empty-s">No data in this date range.</div>';return;}
  var vals=[].concat.apply([],series.map(function(s){return s.pts.map(function(p){return p.y;});})).filter(function(v){return v!=null&&isFinite(v);});
  if(!vals.length){el.innerHTML='<div class="empty-s">No data in this date range.</div>';return;}
  var mn=o.zero===false?Math.min.apply(null,vals):0,mx=Math.max.apply(null,vals);
  if(mx===mn){mx=mn+1;}
  var ticks=niceTicks(mn,mx,4);mn=ticks[0];mx=ticks[ticks.length-1];
  var pw=W-m.l-m.r,ph=H-m.t-m.b;
  var xs=function(i){return dates.length===1?m.l+pw/2:m.l+pw*i/(dates.length-1);};
  var ys=function(v){var f=(v-mn)/(mx-mn);return o.invert?m.t+ph*f:H-m.b-ph*f;};
  var af=o.axis||o.fmt||compact,tf=o.fmt||fmtNum;
  var maps=series.map(function(s){var mp={};s.pts.forEach(function(p){mp[p.x]=p.y;});return mp;});
  var svg='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label||'Line chart')+'">';
  ticks.forEach(function(t){var y=ys(t);svg+='<line x1="'+m.l+'" x2="'+(W-m.r)+'" y1="'+y+'" y2="'+y+'" stroke="var(--line)" stroke-width="1"/><text x="'+(m.l-6)+'" y="'+(y+4)+'" text-anchor="end">'+esc(af(t))+'</text>';});
  var nx=Math.min(6,dates.length),seen={};
  for(var q=0;q<nx;q++){var ix=nx===1?0:Math.round(q*(dates.length-1)/(nx-1));if(seen[ix])continue;seen[ix]=1;svg+='<text x="'+xs(ix)+'" y="'+(H-8)+'" text-anchor="'+(q===0?'start':q===nx-1?'end':'middle')+'">'+esc(shortDate(dates[ix]))+'</text>';}
  series.forEach(function(s,si){
    var d='',open=false,pts=[];
    dates.forEach(function(dt,i){var v=maps[si][dt];if(v==null||!isFinite(v)){open=false;return;}d+=(open?'L':'M')+xs(i).toFixed(1)+' '+ys(v).toFixed(1)+' ';open=true;pts.push([xs(i),ys(v)]);});
    if(series.length===1&&pts.length>1&&!o.invert){svg+='<path d="M'+pts[0][0].toFixed(1)+' '+(H-m.b)+' '+pts.map(function(p){return 'L'+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ')+' L'+pts[pts.length-1][0].toFixed(1)+' '+(H-m.b)+' Z" fill="'+s.color+'" opacity=".12"/>';}
    svg+='<path d="'+d+'" fill="none" stroke="'+s.color+'" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
    if(pts.length<=31)pts.forEach(function(p){svg+='<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="2.6" fill="'+s.color+'"/>';});
  });
  svg+='<line class="guide" x1="0" x2="0" y1="'+m.t+'" y2="'+(H-m.b)+'" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" visibility="hidden"/>';
  series.forEach(function(s){svg+='<circle class="hv" r="4.5" fill="'+s.color+'" stroke="var(--surface)" stroke-width="2" visibility="hidden"/>';});
  svg+='</svg>';
  var legend=series.length>1||o.legend?'<div class="lc-legend">'+series.map(function(s){return '<span><i class="dot" style="background:'+s.color+'"></i>'+esc(s.name)+'</span>';}).join('')+'</div>':'';
  el.innerHTML=legend+'<div class="lc-plot">'+svg+'<div class="tip" hidden></div></div>';
  var plot=$('.lc-plot',el),sv=$('svg',plot),tip=$('.tip',plot),guide=$('.guide',sv),hv=$$('.hv',sv);
  function move(e){
    var r=sv.getBoundingClientRect();if(!r.width)return;
    var x=(e.clientX-r.left)/r.width*W,i=Math.round((x-m.l)/pw*(dates.length-1));
    if(dates.length===1)i=0;i=Math.max(0,Math.min(dates.length-1,i));
    var dt=dates[i],px=xs(i);
    guide.setAttribute('x1',px);guide.setAttribute('x2',px);guide.setAttribute('visibility','visible');
    var html='<b>'+esc(longDate(dt))+'</b>';
    series.forEach(function(s,si){var v=maps[si][dt];if(v==null){hv[si].setAttribute('visibility','hidden');return;}hv[si].setAttribute('cx',px);hv[si].setAttribute('cy',ys(v));hv[si].setAttribute('visibility','visible');html+='<br><i class="dot" style="background:'+s.color+'"></i> '+esc(s.name)+': '+esc(tf(v));});
    tip.innerHTML=html;tip.hidden=false;
    var pct=px/W*100;tip.style.left=pct+'%';tip.style.transform=pct>58?'translateX(-104%)':'translateX(4%)';
  }
  function leave(){guide.setAttribute('visibility','hidden');hv.forEach(function(h){h.setAttribute('visibility','hidden');});tip.hidden=true;}
  sv.addEventListener('pointermove',move);sv.addEventListener('pointerdown',move);sv.addEventListener('pointerleave',leave);
}
function barList(items,fmt){
  items=items.filter(function(i){return i.v!=null;});
  if(!items.length)return '<div class="empty-s">Nothing to show yet.</div>';
  var max=Math.max.apply(null,items.map(function(i){return i.v;}))||1;
  return '<div class="bars">'+items.map(function(i){
    return '<div class="bar-row"><div class="bar-label" title="'+esc(i.l)+'">'+esc(i.l)+'</div><div class="bar-track"><div class="bar-fill" style="width:'+(i.v>0?Math.max(2,i.v/max*100):0)+'%;background:'+(i.c||'var(--gold)')+'"></div></div><div class="bar-val">'+esc((fmt||fmtNum)(i.v))+'</div></div>';
  }).join('')+'</div>';
}

/* ---------- tables ---------- */
var tables={};
function tableSlot(tid,cfg){
  tables[tid]=Object.assign({q:'',size:25,sort:null,dir:-1},cfg);
  var t=tables[tid];
  if(!t.sort){var nc=t.cols.filter(function(c){return c.num;})[0];t.sort=nc?nc.k:t.cols[0].k;}
  post.push(function(){mountTable(tid);});
  return '<div class="tbl" id="tb_'+tid+'"></div>';
}
function mountTable(tid){
  var t=tables[tid],el=document.getElementById('tb_'+tid);if(!el)return;
  el.innerHTML=(t.search===false?'':'<div class="tbl-tools"><input type="text" placeholder="Filter rows" data-tq="'+tid+'" aria-label="Filter rows"></div>')+'<div class="tbl-wrap" data-tbody="'+tid+'"></div><div class="tbl-foot" data-tfoot="'+tid+'"></div>';
  drawTable(tid);
}
function drawTable(tid){
  var t=tables[tid],body=document.querySelector('[data-tbody="'+tid+'"]'),foot=document.querySelector('[data-tfoot="'+tid+'"]');if(!body)return;
  var rows=t.rows.slice();
  if(t.q){var q=t.q.toLowerCase();rows=rows.filter(function(r){return t.cols.some(function(c){return String(r[c.k]==null?'':r[c.k]).toLowerCase().indexOf(q)>=0;});});}
  var sk=t.sort,dir=t.dir;
  rows.sort(function(a,b){var x=a[sk],y=b[sk];if(x==null)return 1;if(y==null)return -1;if(typeof x==='string')return dir*x.localeCompare(y);return dir*(x-y);});
  var shown=rows.slice(0,t.size);
  var h='<table><thead><tr>'+t.cols.map(function(c){return '<th class="'+(c.num?'num':'')+'" data-sort="'+tid+'|'+c.k+'" aria-sort="'+(sk===c.k?(dir>0?'ascending':'descending'):'none')+'">'+esc(c.l)+(sk===c.k?(dir>0?' \u25B2':' \u25BC'):'')+'</th>';}).join('')+'</tr></thead><tbody>';
  if(!shown.length)h+='<tr><td colspan="'+t.cols.length+'" style="color:var(--muted)">No matching rows.</td></tr>';
  shown.forEach(function(r){h+='<tr>'+t.cols.map(function(c){var v=c.f?c.f(r):r[c.k];return '<td class="'+(c.num?'num':(c.wrap?'wrap':''))+'">'+(c.raw?v:esc(v==null?'':v))+'</td>';}).join('')+'</tr>';});
  h+='</tbody></table>';body.innerHTML=h;
  foot.innerHTML='<span>Showing '+shown.length+' of '+rows.length+'</span>'+(rows.length>shown.length?'<button class="btn small" data-act="more" data-tid="'+tid+'">Show 25 more</button>':'');
}

/* ---------- ui helpers ---------- */
var toastTimer=null;
function toast(msg){var t=$('#toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(function(){t.classList.remove('on');},3600);}
function openDialog(title,bodyHTML,actions,onOpen){
  var d=$('#dlg');
  d.innerHTML='<div class="dlg-in"><h3>'+esc(title)+'</h3><div class="dlg-body">'+bodyHTML+'</div><div class="dlg-act">'+actions.map(function(a,i){return '<button class="btn'+(a.primary?' primary':'')+'" data-dlg="'+i+'">'+esc(a.label)+'</button>';}).join('')+'</div></div>';
  $$('[data-dlg]',d).forEach(function(b){b.addEventListener('click',function(){var a=actions[+b.dataset.dlg];var keep=a.fn?a.fn(d):undefined;if(keep!==false)closeDlg();});});
  if(d.showModal){if(!d.open)d.showModal();}else d.setAttribute('open','');
  if(onOpen)onOpen(d);
}
function closeDlg(){var d=$('#dlg');if(d.close)d.close();else d.removeAttribute('open');}
function askText(title,label,value,cb){
  openDialog(title,'<label class="f">'+esc(label)+'<input type="text" id="askv" value="'+esc(value||'')+'"></label>',[{label:'Cancel'},{label:'Save',primary:true,fn:function(d){var v=$('#askv',d).value.trim();if(!v)return false;cb(v);}}],function(d){var i=$('#askv',d);i.focus();i.select();i.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var v=i.value.trim();if(v){cb(v);closeDlg();}}});});
}
function confirmDlg(title,msg,label,cb){openDialog(title,'<p>'+esc(msg)+'</p>',[{label:'Cancel'},{label:label,primary:true,fn:function(){cb();}}]);}
function showText(title,text,note,filename){
  var acts=[{label:'Close'}];
  if(filename&&cloud.dl){acts.push({label:'Download',fn:function(){cloud.dl.save({filename:filename,data:text}).then(function(){toast('Saved.');},function(e){if(!e||e.code!=='declined')toast('Download is not available here. Use Copy instead.');});return false;}});}
  acts.push({label:'Copy',primary:true,fn:function(d){copyText(text,$('#stext',d));return false;}});
  openDialog(title,(note?'<p>'+esc(note)+'</p>':'')+'<textarea id="stext" rows="12" readonly></textarea>',acts,function(d){$('#stext',d).value=text;});
}
function copyText(text,ta){
  function fallback(){try{ta.focus();ta.select();var ok=document.execCommand('copy');toast(ok?'Copied to clipboard':'Select the text and copy it manually');}catch(e){toast('Select the text and copy it manually');}}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){toast('Copied to clipboard');},fallback);}else fallback();
}
