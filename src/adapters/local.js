/* Local adapter: implements the doc-store interface on top of localStorage.
   Demo and development only. Data stays in one browser and is not shared between people. */
(function(){
  'use strict';
  var KEY='fs42_docs_v2',mem=null,listeners=[];
  function all(){
    if(mem)return mem;
    try{mem=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){mem={};}
    return mem;
  }
  function flush(){
    try{localStorage.setItem(KEY,JSON.stringify(mem));}
    catch(e){throw {code:'quota_exceeded',message:'Browser storage is full.'};}
  }
  function copy(x){return JSON.parse(JSON.stringify(x));}
  function parentOf(p){var i=p.lastIndexOf('/');return i<0?'':p.slice(0,i);}
  function idOf(p){return p.slice(p.lastIndexOf('/')+1);}
  function snapDoc(path){
    var d=all()[path];
    return {id:idOf(path),exists:d!==undefined,data:function(){return d===undefined?undefined:copy(d);},metadata:{fromCache:false,hasPendingWrites:false}};
  }
  function snapCol(col){
    var prefix=col+'/',docs=Object.keys(all()).filter(function(p){return p.indexOf(prefix)===0&&p.slice(prefix.length).indexOf('/')<0;}).sort().map(snapDoc);
    return {docs:docs,size:docs.length,empty:!docs.length,docChanges:function(){return [];},metadata:{fromCache:false,hasPendingWrites:false}};
  }
  function notify(path){
    setTimeout(function(){
      listeners.slice().forEach(function(l){
        if(l.kind==='doc'&&l.path===path)l.next(snapDoc(path));
        else if(l.kind==='col'&&l.path===parentOf(path))l.next(snapCol(l.path));
      });
    },0);
  }
  function listen(kind,path,next){
    var l={kind:kind,path:path,next:next};listeners.push(l);
    setTimeout(function(){if(listeners.indexOf(l)>=0)next(kind==='doc'?snapDoc(path):snapCol(path));},0);
    return function(){var i=listeners.indexOf(l);if(i>=0)listeners.splice(i,1);};
  }
  function docRef(path){
    return {
      id:idOf(path),path:path,
      get:function(){return Promise.resolve(snapDoc(path));},
      set:function(data){try{all()[path]=copy(data);flush();}catch(e){return Promise.reject(e);}notify(path);return Promise.resolve();},
      delete:function(){delete all()[path];try{flush();}catch(e){return Promise.reject(e);}notify(path);return Promise.resolve();},
      onSnapshot:function(next){return listen('doc',path,next);}
    };
  }
  var db={
    doc:function(p){return docRef(p);},
    collection:function(p){
      return {
        path:p,
        get:function(){return Promise.resolve(snapCol(p));},
        onSnapshot:function(next){return listen('col',p,next);},
        doc:function(id){return docRef(p+'/'+id);}
      };
    }
  };
  window.FS42Adapters=window.FS42Adapters||{};
  window.FS42Adapters.local={init:function(){return Promise.resolve({db:db,uid:'local'});}};
})();
