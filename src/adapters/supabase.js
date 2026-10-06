/* Supabase adapter: implements the doc-store interface on a single `documents` table
   protected by row level security (see supabase/schema.sql).
   Status: reference implementation, not yet exercised against a live Supabase project.
   Run it against a test project and review the policies before storing real client data. */
(function(){
  'use strict';
  var SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.js';
  var sbRef=null;

  function loadSdk(){
    return new Promise(function(res,rej){
      if(window.supabase&&window.supabase.createClient)return res();
      var s=document.createElement('script');s.src=SDK;s.onload=function(){res();};
      s.onerror=function(){rej(new Error('Could not load the Supabase client library.'));};
      document.head.appendChild(s);
    });
  }
  function parentOf(p){var i=p.lastIndexOf('/');return i<0?'':p.slice(0,i);}
  function idOf(p){return p.slice(p.lastIndexOf('/')+1);}
  function toErr(e){
    var code=e&&e.code,msg=(e&&e.message)||'Request failed';
    if(code==='42501'||/row-level security/i.test(msg))return {code:'invalid_argument',message:'You do not have permission to change this data.'};
    if(code==='54000'||/too large|payload/i.test(msg))return {code:'quota_exceeded',message:msg};
    return {code:'unavailable',message:msg};
  }
  function el(tag,css,html){var e=document.createElement(tag);if(css)e.style.cssText=css;if(html)e.innerHTML=html;return e;}

  function signIn(sb){
    return sb.auth.getSession().then(function(r){
      if(r&&r.data&&r.data.session)return r.data.session;
      return new Promise(function(resolve){
        var wrap=el('div','position:fixed;inset:0;z-index:100;background:rgba(8,9,10,.8);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Afacad,system-ui,sans-serif');
        var card=el('div','background:#222325;color:#f5f4f1;border:1px solid #cf9e4455;border-top:2px solid #cf9e44;border-radius:8px;padding:26px;max-width:420px;width:100%',
          '<h2 style="margin:0 0 6px;font-size:28px">Sign in</h2><p style="margin:0 0 16px;color:#a09a90;font-size:17px">Enter your work email and we will send you a sign-in link.</p>'+
          '<input id="fs42-email" type="email" autocomplete="email" placeholder="you@company.com" style="width:100%;padding:11px 12px;font-size:17px;border-radius:6px;border:1px solid #ffffff2a;background:#171819;color:#f5f4f1">'+
          '<button id="fs42-send" style="margin-top:12px;width:100%;padding:12px;font-size:17px;font-weight:600;border:0;border-radius:6px;background:#cf9e44;color:#1b1810;cursor:pointer">Email me a sign-in link</button>'+
          '<p id="fs42-msg" style="margin:12px 0 0;color:#a09a90;font-size:15px"></p>');
        wrap.appendChild(card);document.body.appendChild(wrap);
        var msg=card.querySelector('#fs42-msg');
        card.querySelector('#fs42-send').addEventListener('click',function(){
          var email=card.querySelector('#fs42-email').value.trim();
          if(!/^\S+@\S+\.\S+$/.test(email)){msg.textContent='Enter a valid email address.';return;}
          msg.textContent='Sending...';
          sb.auth.signInWithOtp({email:email,options:{emailRedirectTo:location.href.split('#')[0]}}).then(function(x){
            msg.textContent=x.error?x.error.message:'Check your email and open the link. This page will continue automatically.';
          });
        });
        sb.auth.onAuthStateChange(function(ev,session){if(session){if(wrap.parentNode)wrap.parentNode.removeChild(wrap);resolve(session);}});
      });
    });
  }

  function findOrg(sb){
    return sb.from('members').select('org_id').limit(1).then(function(r){
      if(r.error)throw toErr(r.error);
      if(r.data&&r.data.length)return r.data[0].org_id;
      return sb.rpc('bootstrap_org',{org_name:'My agency'}).then(function(x){if(x.error)throw toErr(x.error);return x.data;});
    });
  }

  function makeDb(sb,org,uid){
    var listeners=[],timers={};
    function snapDoc(path,rec){
      return {id:idOf(path),exists:!!rec,data:function(){return rec?JSON.parse(JSON.stringify(rec.data)):undefined;},metadata:{fromCache:false,hasPendingWrites:false}};
    }
    function getDoc(path){
      return sb.from('documents').select('data').eq('org_id',org).eq('path',path).maybeSingle().then(function(r){
        if(r.error)throw toErr(r.error);return snapDoc(path,r.data);
      });
    }
    function getCol(col){
      return sb.from('documents').select('path,data').eq('org_id',org).eq('parent',col).order('path').then(function(r){
        if(r.error)throw toErr(r.error);
        var docs=(r.data||[]).map(function(x){return snapDoc(x.path,x);});
        return {docs:docs,size:docs.length,empty:!docs.length,docChanges:function(){return [];},metadata:{fromCache:false,hasPendingWrites:false}};
      });
    }
    var channel=null;
    function ensureChannel(){
      if(channel)return;
      channel=sb.channel('fs42-docs-'+org).on('postgres_changes',{event:'*',schema:'public',table:'documents',filter:'org_id=eq.'+org},function(p){
        var rec=(p.new&&p.new.path)?p.new:p.old;if(!rec||!rec.path)return;
        listeners.slice().forEach(function(l){
          if((l.kind==='doc'&&l.path===rec.path)||(l.kind==='col'&&l.path===parentOf(rec.path))){
            clearTimeout(timers[l.id]);
            timers[l.id]=setTimeout(function(){(l.kind==='doc'?getDoc(l.path):getCol(l.path)).then(l.next,l.error);},150);
          }
        });
      }).subscribe();
    }
    var seq=0;
    function listen(kind,path,next,error){
      ensureChannel();
      var l={id:++seq,kind:kind,path:path,next:next,error:error||function(){}};listeners.push(l);
      (kind==='doc'?getDoc(path):getCol(path)).then(next,l.error);
      return function(){var i=listeners.indexOf(l);if(i>=0)listeners.splice(i,1);clearTimeout(timers[l.id]);};
    }
    function docRef(path){
      return {
        id:idOf(path),path:path,
        get:function(){return getDoc(path);},
        set:function(data){
          return sb.from('documents').upsert({org_id:org,path:path,parent:parentOf(path),data:data,updated_by:uid,updated_at:new Date().toISOString()},{onConflict:'org_id,path'}).then(function(r){if(r.error)throw toErr(r.error);});
        },
        delete:function(){
          return sb.from('documents').delete().eq('org_id',org).eq('path',path).then(function(r){if(r.error)throw toErr(r.error);});
        },
        onSnapshot:function(next,error){return listen('doc',path,next,error);}
      };
    }
    return {
      doc:function(p){return docRef(p);},
      collection:function(p){return {path:p,get:function(){return getCol(p);},onSnapshot:function(next,error){return listen('col',p,next,error);},doc:function(id){return docRef(p+'/'+id);}};}
    };
  }

  // Helpers for the live-connection edge functions (see supabase/functions).
  var api={
    invoke:function(name,body){
      return sbRef.functions.invoke(name,{body:body}).then(function(r){
        if(!r.error)return r.data;
        var ctx=r.error.context;
        if(ctx&&typeof ctx.json==='function'){
          return ctx.json().then(function(j){throw {code:j.code||'error',message:j.error||r.error.message};},function(){throw {code:'error',message:r.error.message};});
        }
        throw {code:'error',message:r.error.message};
      });
    },
    connections:function(clientId){
      return sbRef.from('connections').select('provider,account_label,status,last_sync_at,last_error').eq('client_id',clientId).then(function(x){
        if(x.error)throw toErr(x.error);return x.data||[];
      });
    }
  };

  window.FS42Adapters=window.FS42Adapters||{};
  window.FS42Adapters.supabase={
    api:api,
    init:function(cfg){
      return loadSdk().then(function(){
        var sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
        sbRef=sb;
        return signIn(sb).then(function(session){
          var uid=session.user.id;
          return findOrg(sb).then(function(org){return {db:makeDb(sb,org,uid),uid:uid};});
        });
      });
    },
    signOut:function(){return sbRef?sbRef.auth.signOut().then(function(){location.reload();}):Promise.resolve();}
  };
})();
