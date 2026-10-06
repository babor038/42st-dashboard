/* ---------- helpers ---------- */
var $=function(s,r){return (r||document).querySelector(s);};
var $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var uid=function(){return Math.random().toString(36).slice(2,10);};
var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function pad(n){return String(n).padStart(2,'0');}
function isoOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function validDate(y,m,d){if(m<1||m>12||d<1||d>31||y<1990||y>2100)return null;return y+'-'+pad(m)+'-'+pad(d);}
function parseDate(v){
  if(v==null)return null;var s=String(v).trim();if(!s)return null;var m;
  if((m=s.match(/^(\d{4})(\d{2})(\d{2})$/)))return validDate(+m[1],+m[2],+m[3]);
  if((m=s.match(/^(\d{4})[-\/.](\d{1,2})(?:[-\/.](\d{1,2}))?/)))return validDate(+m[1],+m[2],m[3]?+m[3]:1);
  if((m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))){var a=+m[1],b=+m[2];return a>12?validDate(+m[3],b,a):validDate(+m[3],a,b);}
  if(/[A-Za-z]/.test(s)){var d=new Date(s);if(!isNaN(d.getTime()))return validDate(d.getFullYear(),d.getMonth()+1,d.getDate());}
  return null;
}
function addDays(iso,n){var p=iso.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);d.setDate(d.getDate()+n);return isoOf(d);}
function dayDiff(a,b){var pa=a.split('-'),pb=b.split('-');return Math.round((new Date(+pb[0],+pb[1]-1,+pb[2])-new Date(+pa[0],+pa[1]-1,+pa[2]))/864e5);}
function shortDate(iso){var p=iso.split('-');return MONTHS[+p[1]-1]+' '+(+p[2]);}
function longDate(iso){var p=iso.split('-');return MONTHS[+p[1]-1]+' '+(+p[2])+', '+p[0];}
function parseNum(v){
  if(v==null)return null;if(typeof v==='number')return isFinite(v)?v:null;
  var s=String(v).trim();if(!s||s==='-'||/^n\/?a$/i.test(s))return null;
  var pct=s.indexOf('%')>=0;s=s.replace(/[^0-9.\-]/g,'');if(!s||s==='-'||s==='.')return null;
  var n=parseFloat(s);if(isNaN(n))return null;return pct?n/100:n;
}
function parseBool(v){if(v==null)return false;return /^(y|yes|true|1|x|cited|mentioned|✓)$/i.test(String(v).trim());}
function normH(h){return String(h==null?'':h).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
