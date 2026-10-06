/* ---------- sample data (invented, for layout preview only) ---------- */
function buildSample(){
  var seed=42;
  function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
  function noise(a){return 1+(rnd()-.5)*a;}
  function r1(x){return Math.round(x*10)/10;}
  var nc=newClient('Sample client (invented demo data)');
  nc.domain='example.com';nc.brand='sample co';nc.currency='$';nc.sample=true;
  var now=new Date(),days=[];
  for(var i=119;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-2-i);days.push({iso:isoOf(d),dow:d.getDay(),f:(119-i)/119});}
  function wk(dow){return dow===0||dow===6?0.72:1;}
  var gsc=[],bing=[],ga=[],gbp=[],ads=[];
  days.forEach(function(x){
    var tr=1+x.f*0.45,w=wk(x.dow);
    var gi=Math.round(2600*tr*w*noise(.2)),gc=Math.round(gi*(0.034+x.f*0.008)*noise(.2));
    gsc.push({date:x.iso,clicks:gc,impressions:gi,ctr:gc/gi,position:r1(11.5-x.f*2.4+(rnd()-.5)*.8)});
    var bi=Math.round(700*tr*w*noise(.25)),bc=Math.round(bi*(0.028+x.f*0.005)*noise(.25));
    bing.push({date:x.iso,clicks:bc,impressions:bi,ctr:bc/bi,position:r1(9.8-x.f*1.6+(rnd()-.5)*.8)});
    var s=Math.round(210*tr*w*noise(.2));
    ga.push({date:x.iso,sessions:s,users:Math.round(s*.82),engaged:Math.round(s*(.58+rnd()*.06)),events:Math.round(s*(.045+rnd()*.015))});
    gbp.push({date:x.iso,views:Math.round(180*tr*noise(.3)),calls:Math.round(6*tr*w*noise(.8)),directions:Math.round(9*tr*w*noise(.8)),website:Math.round(14*tr*w*noise(.6))});
    [['Google Ads',38,1.9,14,.06],['Microsoft Ads',14,1.5,12,.05]].forEach(function(p){
      var cost=Math.round(p[1]*w*noise(.3)*100)/100,clk=Math.max(1,Math.round(cost/(p[2]*noise(.3))));
      ads.push({date:x.iso,platform:p[0],cost:cost,clicks:clk,impressions:clk*Math.round(p[3]*noise(.3)),conversions:Math.round(clk*p[4]*noise(.8))});
    });
  });
  function q(list){return list.map(function(r){return {query:r[0],clicks:r[1],impressions:r[2],ctr:r[1]/r[2],position:r[3]};});}
  var gq=[['emergency plumber maryville tn',210,6400,5.8],['plumber knoxville tn',140,9800,9.2],['sample co plumbing',380,900,1.2],['water heater repair alcoa',96,5200,8.9],['drain cleaning cost knoxville',41,7800,11.6],['leaking pipe repair farragut',58,3900,7.4],['tankless water heater installation oak ridge',33,2600,9.7],['plumber open on sunday maryville',22,1800,12.3],['how to unclog a kitchen sink',12,9200,14.1],['sample co reviews',64,210,1.4],['bathroom remodel plumber blount county',18,1500,6.6],['water heater repair maryville tn',77,4300,6.9],['plumber near me',160,22000,12.8],['sewer line repair knoxville',29,3100,10.4],['emergency plumber lenoir city',24,1700,8.1]];
  var bq=[['emergency plumber maryville tn',48,1500,6.2],['plumber knoxville tn',31,2300,9.8],['sample co plumbing',95,240,1.3],['water heater repair alcoa',27,1300,9.4],['drain cleaning cost knoxville',9,1900,12.1],['water heater repair maryville tn',19,1100,7.3],['sample co phone number',31,120,1.1]];
  var pg=[['/',420,9800,7.9],['/services/emergency-plumbing/',260,7200,6.1],['/services/water-heater-repair/',130,6100,8.8],['/services/drain-cleaning/',74,8300,11.2],['/services/sewer-line-repair/',41,3600,10.9],['/areas/maryville/',118,3900,5.6],['/areas/knoxville/',96,6800,9.5],['/areas/alcoa/',44,2100,8.7],['/contact/',52,640,3.2]];
  var bp=[['/',110,2500,8.1],['/services/emergency-plumbing/',64,1800,6.6],['/services/water-heater-repair/',33,1500,9.2],['/areas/maryville/',29,900,6.3],['/contact/',17,210,3.5]];
  function pgs(list){return list.map(function(r){return {page:'https://example.com'+r[0],clicks:r[1],impressions:r[2],ctr:r[1]/r[2],position:r[3]};});}
  var ch=[['Organic Search',4200,3100,210,3600],['Direct',1300,820,64,1100],['Paid Search',1100,640,71,980],['Referral',380,250,12,340],['Organic Social',220,110,4,200],['Email',140,95,9,120]].map(function(r){return {channel:r[0],sessions:r[1],engaged:r[2],events:r[3],users:r[4]};});
  var plats=['ChatGPT','Claude','Gemini','Perplexity','Microsoft Copilot','Google AI Overviews'];
  var prompts=['best emergency plumber near me','how much does drain cleaning cost','who repairs tankless water heaters','licensed plumber open on Sunday','is Sample Co a good plumber','how to fix a leaking pipe under the sink'];
  var comps=['Acme Plumbing','Bolt Drains','City Pipe Pros'];
  var aiDates=[days[62].iso,days[90].iso,days[117].iso],probs=[0.3,0.45,0.6],ai=[];
  aiDates.forEach(function(dt,di){plats.forEach(function(p){prompts.forEach(function(pr){
    var m=rnd()<probs[di],ci=m&&rnd()<0.5;
    ai.push({id:uid(),date:dt,platform:p,prompt:pr,mentioned:m,cited:ci,competitors:rnd()<0.5?comps[Math.floor(rnd()*3)]:'',notes:''});
  });});});

  /* tracking lists */
  var kws=[['emergency plumber maryville tn','/services/emergency-plumbing/'],['plumber knoxville tn','/areas/knoxville/'],['water heater repair maryville tn','/services/water-heater-repair/'],['drain cleaning cost knoxville','/services/drain-cleaning/'],['leaking pipe repair farragut',''],['tankless water heater installation oak ridge',''],['plumber near me','/'],['sewer line repair knoxville','/services/sewer-line-repair/'],['emergency plumber lenoir city',''],['bathroom remodel plumber blount county','']];
  var areas=[['Maryville','City','/areas/maryville/',''],['Knoxville','City','/areas/knoxville/',''],['Alcoa','City','/areas/alcoa/',''],['Farragut','City','',''],['Oak Ridge','City','',''],['Lenoir City','City','',''],['Sevierville','City','',''],['Morristown','City','',''],['Blount County','County','','blount'],['Knox County','County','','knox county']];
  var svcs=[['Emergency plumbing','emergency plumber maryville tn','/services/emergency-plumbing/'],['Water heater repair','water heater repair maryville tn','/services/water-heater-repair/'],['Drain cleaning','drain cleaning cost knoxville','/services/drain-cleaning/'],['Sewer line repair','sewer line repair knoxville','/services/sewer-line-repair/'],['Tankless water heater installation','tankless water heater installation oak ridge',''],['Bathroom remodel plumbing','bathroom remodel plumber blount county','']];
  nc.tracking={
    keywords:kws.map(function(k){return {id:uid(),text:k[0],page:k[1],note:''};}),
    areas:areas.map(function(a){return {id:uid(),name:a[0],type:a[1],page:a[2],terms:a[3],note:''};}),
    services:svcs.map(function(s){return {id:uid(),name:s[0],keyword:s[1],page:s[2],note:''};})
  };
  var rl=[],rd=[days[60].iso,days[90].iso,days[117].iso];
  kws.forEach(function(k,ki){var base=4+rnd()*14;rd.forEach(function(dt,di){
    rl.push({date:dt,item:k[0],engine:'Google',position:r1(Math.max(1,base-di*(0.8+rnd()*1.8))),impressions:null,clicks:null});
    if(ki<6)rl.push({date:dt,item:k[0],engine:'Bing',position:r1(Math.max(1,base+1.5-di*(0.6+rnd()*1.4))),impressions:null,clicks:null});
  });});
  areas.slice(0,6).forEach(function(a){var base=2+rnd()*9;rd.forEach(function(dt,di){rl.push({date:dt,item:a[0],engine:'Google Maps',position:r1(Math.max(1,base-di*(0.5+rnd()))),impressions:null,clicks:null});});});

  nc.info={
    status:'Active',accountManager:'Sample account manager',legalName:'Sample Co Plumbing, Inc.',dba:'Sample Co Plumbing',industry:'Plumbing',businessType:'Service area business',founded:'2010',employees:'6 to 15',
    description:'Invented sample business used to preview this dashboard.',differentiators:'Invented sample text.',
    phone:'(555) 010-0100',email:'hello@example.com',street:'100 Sample Street',city:'Maryville',state:'TN',zip:'00000',country:'United States',serviceAreaType:'We travel to customers',
    hours:'Monday to Thursday 9:00 AM to 5:00 PM',serviceAreaNotes:'Invented list of sample service areas.',
    primaryName:'Sample Owner',primaryTitle:'Owner',primaryEmail:'owner@example.com',preferredContact:'Email',
    gbpUrl:'https://example.com/sample-gbp',gsc:'sc-domain:example.com',ga4Property:'000000000',cms:'Webflow',schemaStatus:'Partial',
    audience:'Invented sample audience: homeowners in the service area.',goals:'Invented sample goals: more booked jobs from search and AI answers.',
    package:'Sample package',billingCycle:'Monthly',reportCadence:'Monthly',
    competitors:[{name:'Acme Plumbing',url:'acmeplumbing.example',notes:'Sample competitor'},{name:'Bolt Drains',url:'boltdrains.example',notes:''}],_saved:isoOf(new Date())
  };
  nc.checks={sch1:{s:'pass'},sch2:{s:'pass'},sch3:{s:'pass'},idx1:{s:'pass'},idx2:{s:'pass'},idx3:{s:'work',n:'Sample note'},idx4:{s:'pass'},crl1:{s:'work',n:'Sample note'},cnt1:{s:'pass'},cnt3:{s:'work'},prf1:{s:'pass'},loc1:{s:'pass'},loc2:{s:'na'}};
  nc.data={gsc_daily:gsc,bing_daily:bing,gsc_queries:q(gq),bing_queries:q(bq),gsc_pages:pgs(pg),bing_pages:pgs(bp),ga4_daily:ga,ga4_channels:ch,gbp_daily:gbp,ads_daily:ads,ai_log:ai,rank_log:rl};
  return nc;
}
