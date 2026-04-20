/* === NAVIGATION === */
(function(){
  var pages=document.querySelectorAll('.page'),navItems=document.querySelectorAll('.nav-item'),sidebar=document.getElementById('sidebar'),overlay=document.getElementById('overlay'),hamburger=document.getElementById('hamburger');
  window.goTo=function(id){pages.forEach(function(p){p.classList.remove('active');});navItems.forEach(function(n){n.classList.remove('active');});var t=document.getElementById('page-'+id);if(t){t.classList.add('active');window.scrollTo(0,0);}navItems.forEach(function(n){if(n.dataset.page===id)n.classList.add('active');});sidebar.classList.remove('open');overlay.classList.remove('open');setTimeout(function(){window.dispatchEvent(new Event('resize'));},60);};
  navItems.forEach(function(b){b.addEventListener('click',function(){goTo(b.dataset.page);});});
  document.querySelectorAll('[data-goto]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();goTo(el.dataset.goto);});});
  hamburger.addEventListener('click',function(){sidebar.classList.toggle('open');overlay.classList.toggle('open');});
  overlay.addEventListener('click',function(){sidebar.classList.remove('open');overlay.classList.remove('open');});
})();

/* === VEXFLOW CORE === */
var VF=Vex.Flow,Renderer=VF.Renderer,Stave=VF.Stave,StaveNote=VF.StaveNote,Voice=VF.Voice,Formatter=VF.Formatter,Accidental=VF.Accidental;
var SVG_NS='http://www.w3.org/2000/svg';
var VEX_KEYS=['c','c#','d','d#','e','f','f#','g','g#','a','a#','b'];
var DE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','H'];
var SHARPS=[1,3,6,8,10],DSTEPS=[17,16,14,12,11,9,7,5,4,2,0,-1,-3,-5];
function s2vex(s){return VEX_KEYS[((s%12)+12)%12]+'/'+(Math.floor(s/12)+4);}
function s2name(s){return DE_NAMES[((s%12)+12)%12];}
function s2freq(s){return 261.63*Math.pow(2,s/12);}
function isShp(s){return SHARPS.indexOf(((s%12)+12)%12)>=0;}
function mkChordNote(semis,dur){var sorted=[].concat(semis).sort(function(a,b){return a-b;});var n=new StaveNote({keys:sorted.map(s2vex),duration:dur||'w',auto_stem:true});sorted.forEach(function(s,i){if(isShp(s))n.addModifier(new Accidental('#'),i);});return n;}
function mkCtx(el,w,h){var r=new Renderer(el,Renderer.Backends.SVG);r.resize(w,h);return r.getContext();}

/* === AUDIO === */
var actx=null;
function ensureCtx(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();}
function tone(freq,t,v){v=v||0.4;[[1,v],[2,v*.38],[3,v*.12]].forEach(function(x){var o=actx.createOscillator(),g=actx.createGain();o.connect(g);g.connect(actx.destination);o.type='sine';o.frequency.value=freq*x[0];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(x[1],t+.012);g.gain.exponentialRampToValueAtTime(.001,t+1.7);o.start(t);o.stop(t+1.8);});}
function play(s){try{ensureCtx();tone(s2freq(s),actx.currentTime);}catch(e){}}
function playArr(semis,btn){try{ensureCtx();var t=actx.currentTime;semis.forEach(function(s){tone(s2freq(s),t,.28);});if(btn){btn.classList.add('playing');setTimeout(function(){btn.classList.remove('playing');},1400);bubbleEl(btn);}}catch(e){}}

/* === BUBBLES === */
var BSYM=['♩','♪','♫','♬','𝄞'],BCOLS=['rgba(69,39,160,.82)','rgba(194,0,110,.82)','rgba(240,112,40,.82)','rgba(67,160,71,.82)','rgba(21,101,192,.82)'];
function spawnAt(cx,cy){for(var i=0;i<7;i++){var b=document.createElement('div');b.className='bubble';var sz=26+Math.random()*18,dx=(Math.random()-.5)*80,dl=Math.random()*.25,an=['bR1','bR2','bR3'][i%3];b.style.cssText='left:'+(cx+dx-sz/2)+'px;top:'+(cy-sz/2)+'px;width:'+sz+'px;height:'+sz+'px;background:'+BCOLS[i%5]+';font-size:'+(sz*.4)+'px;animation:'+an+' '+(1.2+Math.random()*.4)+'s '+dl+'s ease-out forwards;';b.textContent=BSYM[i%5];document.body.appendChild(b);setTimeout(function(){b.remove();},2200);}}
function bubbleEl(el){var r=el.getBoundingClientRect();spawnAt(r.left+r.width/2,r.top+r.height/2);}
function bubbleSVG(svg,vx,vy){var r=svg.getBoundingClientRect();var W=+svg.getAttribute('width'),H=+svg.getAttribute('height');spawnAt(r.left+vx*(r.width/W),r.top+vy*(r.height/H));}

/* === S1 TONLEITERN === */
var SCALES={
  dur:{semis:[0,2,4,5,7,9,11,12],el:'scale-vex',btn:'scale-play'},
  nat:{semis:[-3,-1,0,2,4,5,7,9],el:'scale-nat-vex',btn:'scale-nat-play'},
  harm:{semis:[-3,-1,0,2,4,5,8,9],el:'scale-harm-vex',btn:'scale-harm-play'},
  mel:{semis:[-3,-1,0,2,4,6,8,9],el:'scale-mel-vex',btn:'scale-mel-play'}
};
function renderScaleGeneric(key){
  var sc=SCALES[key];if(!sc)return;
  var wrap=document.getElementById(sc.el);if(!wrap)return;wrap.innerHTML='';
  var lowestNote=Math.min.apply(null,sc.semis);
  var extraH=lowestNote<0?Math.abs(lowestNote)*4+10:0;
  var W=Math.min((wrap.parentElement.clientWidth||700)-8,720),H=190+extraH;
  var vctx=mkCtx(wrap,W,H);var stave=new Stave(10,18,W-20);stave.addClef('treble');stave.setContext(vctx).draw();
  var notes=sc.semis.map(function(s){
    var n=new StaveNote({keys:[s2vex(s)],duration:'q',auto_stem:true});
    if(isShp(s))n.addModifier(new Accidental('#'),0);
    return n;
  });
  var voice=new Voice({num_beats:8,beat_value:4}).setStrict(false);
  voice.addTickables(notes);new Formatter().joinVoices([voice]).format([voice],W-90);
  voice.draw(vctx,stave);
  var svg=wrap.querySelector('svg');
  var lowestSemi=Math.min.apply(null,sc.semis);
  var extraBelow=lowestSemi<0?Math.abs(lowestSemi)*4:0;
  var labelY=stave.getYForLine(4)+34+extraBelow;
  var noteCenters=[];
  notes.forEach(function(note,i){
    var bb=note.getBoundingBox(),cx=bb.x+bb.w/2,cy=bb.y+bb.h/2;
    noteCenters.push(cx);
    var t=document.createElementNS(SVG_NS,'text');
    t.setAttribute('x',cx);t.setAttribute('y',labelY);t.setAttribute('text-anchor','middle');
    t.setAttribute('font-size','16');t.setAttribute('font-family','Open Sans,sans-serif');
    t.setAttribute('font-weight','400');t.setAttribute('fill','#4527a0');
    t.textContent=s2name(sc.semis[i]);svg.appendChild(t);
    var hit=document.createElementNS(SVG_NS,'rect');
    hit.setAttribute('x',cx-16);hit.setAttribute('y',cy-16);hit.setAttribute('width',32);hit.setAttribute('height',32);
    hit.setAttribute('fill','rgba(0,0,0,0)');hit.setAttribute('stroke','none');hit.setAttribute('opacity','0');
    hit.style.cursor='pointer';hit.style.pointerEvents='all';
    (function(idx){hit.addEventListener('click',function(e){e.stopPropagation();play(sc.semis[idx]);});})(i);
    svg.appendChild(hit);
  });
  var bracketY=labelY+14;
  for(var i=0;i<sc.semis.length-1;i++){
    var interval=sc.semis[i+1]-sc.semis[i];
    if(interval===1){
      var x1=noteCenters[i],x2=noteCenters[i+1];
      var mx=(x1+x2)/2;
      var bPath=document.createElementNS(SVG_NS,'path');
      bPath.setAttribute('d','M'+x1+','+(bracketY)+' L'+mx+','+(bracketY+10)+' L'+x2+','+(bracketY));
      bPath.setAttribute('fill','none');bPath.setAttribute('stroke','#c2006e');
      bPath.setAttribute('stroke-width','1.5');bPath.setAttribute('stroke-linecap','round');
      bPath.setAttribute('stroke-linejoin','round');
      svg.appendChild(bPath);
      var htTxt=document.createElementNS(SVG_NS,'text');
      htTxt.setAttribute('x',mx);htTxt.setAttribute('y',bracketY+22);
      htTxt.setAttribute('text-anchor','middle');htTxt.setAttribute('font-size','10');
      htTxt.setAttribute('font-family','Open Sans,sans-serif');htTxt.setAttribute('font-weight','700');
      htTxt.setAttribute('fill','#c2006e');
      htTxt.textContent='½';
      svg.appendChild(htTxt);
    }
  }
}
function renderAllScales(){Object.keys(SCALES).forEach(renderScaleGeneric);}
Object.keys(SCALES).forEach(function(key){
  var sc=SCALES[key];
  document.getElementById(sc.btn).addEventListener('click',function(){
    ensureCtx();var btn=document.getElementById(sc.btn);btn.classList.add('playing');
    var t=actx.currentTime+.05;sc.semis.forEach(function(s){tone(s2freq(s),t,.32);t+=0.4;});
    setTimeout(function(){btn.classList.remove('playing');},sc.semis.length*400+300);bubbleEl(btn);
  });
});

/* === S2 STUFEN === */
var STUFEN=[{r:'I',s:[0,4,7],n:'C-Dur',q:'maj'},{r:'II',s:[2,5,9],n:'d-Moll',q:'min'},{r:'III',s:[4,7,11],n:'e-Moll',q:'min'},{r:'IV',s:[5,9,12],n:'F-Dur',q:'maj'},{r:'V',s:[7,11,14],n:'G-Dur',q:'maj'},{r:'VI',s:[9,12,16],n:'a-Moll',q:'min'},{r:'VII',s:[11,14,17],n:'h°',q:'dim'}];
var BL={maj:'Dur',min:'Moll',dim:'Dim'};
function buildStufen(){var row=document.getElementById('chord-row');if(!row)return;STUFEN.forEach(function(st){var box=document.createElement('div');box.className='cbox';var rom=document.createElement('div');rom.className='rom';rom.textContent=st.r;box.appendChild(rom);var vw=document.createElement('div');box.appendChild(vw);var vctx=mkCtx(vw,84,105);var stave=new Stave(4,10,76);stave.setContext(vctx).draw();var note=mkChordNote(st.s,'w');var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);voice.addTickables([note]);new Formatter().joinVoices([voice]).format([voice],60);voice.draw(vctx,stave);var cn=document.createElement('div');cn.className='cn';cn.textContent=st.n;box.appendChild(cn);var b=document.createElement('span');b.className='badge '+st.q;b.textContent=BL[st.q];box.appendChild(b);var pb=document.createElement('button');pb.className='play-btn';pb.textContent='▶ Play';(function(semis){pb.addEventListener('click',function(){playArr(semis,pb);});})(st.s);box.appendChild(pb);row.appendChild(box);});}

/* === S3 FUNKTIONSTHEORIE === */
var tAudio=new Audio('https://raw.githubusercontent.com/anorren/hosting/refs/heads/main/Text%20zu%20Tonika.mp3');
document.getElementById('fkt-tonika').addEventListener('click',function(){var ic=document.getElementById('tonika-icon');if(!tAudio.paused){tAudio.pause();tAudio.currentTime=0;ic.textContent='🔊';return;}tAudio.play();ic.textContent='⏹';tAudio.onended=function(){ic.textContent='🔊';};});

/* === S4 UMKEHRUNGEN === */
var UMKEHR=[{t:'Grundstellung',f:'⁵₃',s:[0,4,7],b:'Bass: C'},{t:'1. Umkehrung',f:'⁶₃',s:[4,7,12],b:'Bass: E'},{t:'2. Umkehrung',f:'⁶₄',s:[7,12,16],b:'Bass: G'}];
function buildUmkehr(){var row=document.getElementById('umk-row');if(!row)return;UMKEHR.forEach(function(inv){var box=document.createElement('div');box.className='ubox';var h3=document.createElement('h3');h3.textContent=inv.t;box.appendChild(h3);var fig=document.createElement('div');fig.className='fig';fig.textContent=inv.f;box.appendChild(fig);var vw=document.createElement('div');box.appendChild(vw);var vctx=mkCtx(vw,110,110);var stave=new Stave(4,10,102);stave.setContext(vctx).draw();var note=mkChordNote(inv.s,'w');var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);voice.addTickables([note]);new Formatter().joinVoices([voice]).format([voice],80);voice.draw(vctx,stave);var bi=document.createElement('div');bi.className='bass';bi.textContent=inv.b;box.appendChild(bi);(function(semis){box.addEventListener('click',function(){playArr(semis,null);bubbleEl(box);});})(inv.s);row.appendChild(box);});}

/* === CHORD RECOGNITION === */
var TPATS=[{n:'',i:[0,4,7]},{n:'m',i:[0,3,7]},{n:'°',i:[0,3,6]},{n:'+',i:[0,4,8]},{n:'sus2',i:[0,2,7]},{n:'sus4',i:[0,5,7]}];
var FMAP={'C':{l:'Tonika',s:'T',c:'kf-T'},'Dm':{l:'Subdominantparallele',s:'Sp',c:'kf-Sp'},'Em':{l:'Tonikaparallele',s:'Tp',c:'kf-Tp'},'F':{l:'Subdominante',s:'S',c:'kf-S'},'G':{l:'Dominante',s:'D',c:'kf-D'},'Am':{l:'Tonikaparallele',s:'Tp',c:'kf-Tp'}};
function recTriad(semis){if(semis.length<3)return null;var pcs=[].concat(semis).map(function(s){return((s%12)+12)%12;});pcs=pcs.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});if(pcs.length<3)return null;for(var pi=0;pi<TPATS.length;pi++){var p=TPATS[pi];if(p.i.length!==pcs.length)continue;for(var ri=0;ri<pcs.length;ri++){var r=pcs[ri],norm=p.i.map(function(x){return(r+x)%12;}).sort(function(a,b){return a-b;});if(norm.every(function(v,i){return v===pcs[i];}))return DE_NAMES[r]+p.n;}}return null;}

/* === S5 KADENZ === */
(function(){var N=4,kN=[[],[],[],[]],kStaves=[];function kRender(){var wrap=document.getElementById('kadenz-vex');if(!wrap)return;wrap.innerHTML='';var W=Math.max((wrap.parentElement.clientWidth-48)||400,380),H=150;var vctx=mkCtx(wrap,W,H);var slotW=(W-20)/N;kStaves=[];for(var i=0;i<N;i++){var st=new Stave(10+i*slotW,20,slotW);if(i===0)st.addClef('treble');if(i===N-1)st.setEndBarType(VF.Barline.type.END);st.setContext(vctx).draw();kStaves.push(st);if(kN[i].length){try{var note=mkChordNote(kN[i],'w');var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);voice.addTickables([note]);new Formatter().joinVoices([voice]).format([voice],slotW-20);voice.draw(vctx,st);}catch(e){}}}var svg=wrap.querySelector('svg');if(!svg)return;svg.addEventListener('click',function(e){var r=svg.getBoundingClientRect(),cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);var slot=-1;for(var i=0;i<kStaves.length;i++){if(cx>=kStaves[i].getX()&&cx<kStaves[i].getX()+kStaves[i].getWidth()){slot=i;break;}}if(slot<0||cx<kStaves[0].getX()+35)return;var topY=kStaves[0].getYForLine(0),half=kStaves[0].getSpacingBetweenLines()/2;var step=Math.round((cy-topY)/half);if(step<0||step>=DSTEPS.length)return;var semi=DSTEPS[step];play(semi);var idx=kN[slot].indexOf(semi);if(idx>=0)kN[slot].splice(idx,1);else kN[slot].push(semi);kRender();for(var ii=0;ii<N;ii++)kUpdate(ii);});}var row=document.getElementById('kadenz-row'),kCells=[];for(var ki=0;ki<N;ki++){(function(i){var cell=document.createElement('div');cell.className='kadenz-cell';var nameEl=document.createElement('div');nameEl.className='k-name';cell.appendChild(nameEl);var hintEl=document.createElement('div');hintEl.className='k-hint';hintEl.textContent='Takt '+(i+1);cell.appendChild(hintEl);var funcEl=document.createElement('div');funcEl.className='k-func';cell.appendChild(funcEl);var btns=document.createElement('div');btns.className='kadenz-btns';cell.appendChild(btns);var pb=document.createElement('button');pb.className='k-btn k-play';pb.textContent='▶';btns.appendChild(pb);var cb=document.createElement('button');cb.className='k-btn k-clr';cb.textContent='✕';btns.appendChild(cb);pb.addEventListener('click',function(){if(!kN[i].length)return;playArr(kN[i],pb);var svg=document.querySelector('#kadenz-vex svg');if(svg&&kStaves[i])bubbleSVG(svg,kStaves[i].getX()+kStaves[i].getWidth()/2,55);});cb.addEventListener('click',function(){kN[i]=[];kRender();kUpdate(i);});row.appendChild(cell);kCells.push({nameEl:nameEl,hintEl:hintEl,funcEl:funcEl});})(ki);}function kUpdate(i){var c=kCells[i];if(!kN[i].length){c.nameEl.textContent='';c.hintEl.textContent='Takt '+(i+1);c.funcEl.style.display='none';return;}if(kN[i].length<3){c.nameEl.textContent='';c.hintEl.textContent=kN[i].length+' Töne';c.funcEl.style.display='none';return;}var chord=recTriad(kN[i]);c.nameEl.textContent=chord||'?';c.hintEl.textContent=chord?'Erkannt':'Unbekannt';var fn=chord?FMAP[chord]:null;if(fn){c.funcEl.textContent=fn.s+' · '+fn.l;c.funcEl.className='k-func '+fn.c;c.funcEl.style.display='inline-block';}else c.funcEl.style.display='none';}document.getElementById('kadenz-play-all').addEventListener('click',function(){ensureCtx();var btn=document.getElementById('kadenz-play-all');btn.classList.add('playing');var i=0;function next(){if(i>=N){btn.classList.remove('playing');bubbleEl(btn);return;}if(kN[i].length){playArr(kN[i],null);var svg=document.querySelector('#kadenz-vex svg');if(svg&&kStaves[i])bubbleSVG(svg,kStaves[i].getX()+kStaves[i].getWidth()/2,55);}i++;setTimeout(next,900);}next();});document.getElementById('kadenz-clear-all').addEventListener('click',function(){kN=[[],[],[],[]];kRender();for(var i=0;i<N;i++)kUpdate(i);});kRender();window.addEventListener('resize',kRender);})();

/* === S6 AKKORDE ERSTELLEN === */
(function(){var bNotes=[],bSelIdx=-1,bStave=null,bHits=[];var JPATS=[{i:[0,4,7],n:'',full:'Dur'},{i:[0,3,7],n:'m',full:'Moll'},{i:[0,3,6],n:'°',full:'Vermindert'},{i:[0,4,8],n:'+',full:'Übermäßig'},{i:[0,2,7],n:'sus2',full:'Sus2'},{i:[0,5,7],n:'sus4',full:'Sus4'},{i:[0,4,7,9],n:'6',full:'Dur Sext'},{i:[0,3,7,9],n:'m6',full:'Moll Sext'},{i:[0,4,7,11],n:'maj7',full:'Major 7'},{i:[0,4,7,10],n:'7',full:'Dominant 7'},{i:[0,3,7,10],n:'m7',full:'Moll 7'},{i:[0,3,7,11],n:'mM7',full:'Moll Major 7'},{i:[0,3,6,10],n:'m7b5',full:'Halbvermindert'},{i:[0,3,6,9],n:'°7',full:'Vollvermindert'},{i:[0,4,8,10],n:'+7',full:'Übermäßig 7'},{i:[0,4,7,11,14],n:'maj9',full:'Major 9'},{i:[0,4,7,10,14],n:'9',full:'Dominant 9'},{i:[0,3,7,10,14],n:'m9',full:'Moll 9'},{i:[0,4,7,10,13],n:'7b9',full:'Dom.7b9'},{i:[0,4,7,10,15],n:'7#9',full:'Dom.7#9'},{i:[0,4,7,11,14,17],n:'maj11',full:'Major 11'},{i:[0,4,7,10,14,17],n:'11',full:'Dominant 11'},{i:[0,3,7,10,14,17],n:'m11',full:'Moll 11'},{i:[0,4,7,10,14,18],n:'7#11',full:'Lydian Dom.'},{i:[0,4,7,11,14,21],n:'maj13',full:'Major 13'},{i:[0,4,7,10,14,21],n:'13',full:'Dominant 13'},{i:[0,3,7,10,14,21],n:'m13',full:'Moll 13'},{i:[0,4,7,2],n:'add9',full:'Add 9'},{i:[0,3,7,2],n:'madd9',full:'Moll Add 9'}];function recJazz(semis){if(semis.length<2)return null;var pcs=[].concat(semis).map(function(s){return((s%12)+12)%12;});pcs=pcs.filter(function(v,i,a){return a.indexOf(v)===i;}).sort(function(a,b){return a-b;});if(pcs.length<2)return null;for(var pi=0;pi<JPATS.length;pi++){var p=JPATS[pi];if(p.i.length!==pcs.length)continue;for(var ri=0;ri<pcs.length;ri++){var r=pcs[ri],norm=p.i.map(function(x){return(r+x)%12;}).sort(function(a,b){return a-b;});if(norm.every(function(v,i){return v===pcs[i];}))return{root:DE_NAMES[r],suffix:p.n,full:p.full};}}if(pcs.length===2){var iv=((pcs[1]-pcs[0])+12)%12;var ivN=['Prim','kl.Sek','gr.Sek','kl.Terz','gr.Terz','Quarte','Tritonus','Quinte','kl.Sext','gr.Sext','kl.Sept','gr.Sept'];return{root:DE_NAMES[pcs[0]],suffix:'',full:'Intervall: '+ivN[iv]};}return null;}function semiToY(s,st){var topY=st.getYForLine(0),half=st.getSpacingBetweenLines()/2;var idx=DSTEPS.indexOf(s);if(idx>=0)return topY+idx*half;for(var d=1;d<=3;d++){var u=DSTEPS.indexOf(s+d),dn=DSTEPS.indexOf(s-d);if(u>=0&&dn>=0)return topY+((u+dn)/2)*half;if(u>=0)return topY+(u-.45)*half;if(dn>=0)return topY+(dn+.45)*half;}return topY+5*half;}var bpEl=document.getElementById('bpanel');function showBP(px,py,idx){bSelIdx=idx;document.getElementById('bp-name').textContent=s2name(bNotes[idx]);bpEl.style.left=Math.max(8,Math.min(window.innerWidth-80,px-32))+'px';bpEl.style.top=Math.max(8,py-148)+'px';bpEl.style.display='flex';bRender();}function hideBP(){bSelIdx=-1;bpEl.style.display='none';bRender();}document.getElementById('bp-up').addEventListener('click',function(){if(bSelIdx<0)return;bNotes[bSelIdx]=Math.min(24,bNotes[bSelIdx]+1);play(bNotes[bSelIdx]);document.getElementById('bp-name').textContent=s2name(bNotes[bSelIdx]);bRender();bUpdate();});document.getElementById('bp-dn').addEventListener('click',function(){if(bSelIdx<0)return;bNotes[bSelIdx]=Math.max(-5,bNotes[bSelIdx]-1);play(bNotes[bSelIdx]);document.getElementById('bp-name').textContent=s2name(bNotes[bSelIdx]);bRender();bUpdate();});document.getElementById('bp-del').addEventListener('click',function(){if(bSelIdx<0)return;bNotes.splice(bSelIdx,1);hideBP();bUpdate();});document.getElementById('bp-close').addEventListener('click',hideBP);document.addEventListener('click',function(e){if(!bpEl.contains(e.target)&&!e.target.closest('#builder-vex'))hideBP();});function bRender(){var wrap=document.getElementById('builder-vex');if(!wrap)return;wrap.innerHTML='';bHits=[];var W=Math.max((wrap.parentElement.clientWidth-48)||400,380),H=160;var vctx=mkCtx(wrap,W,H);var st=new Stave(10,22,W-20);st.addClef('treble');st.setEndBarType(VF.Barline.type.END);st.setContext(vctx).draw();bStave=st;if(bNotes.length){try{var note=mkChordNote(bNotes,'w');if(bSelIdx>=0){var sorted=[].concat(bNotes).map(function(s,i){return{s:s,i:i};}).sort(function(a,b){return a.s-b.s;});sorted.forEach(function(o,vi){if(o.i===bSelIdx)note.setKeyStyle(vi,{fillStyle:'#006064',strokeStyle:'#006064'});});}var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);voice.addTickables([note]);new Formatter().joinVoices([voice]).format([voice],W-80);voice.draw(vctx,st);var bb=note.getBoundingBox();bNotes.forEach(function(s,i){bHits.push({s:s,i:i,cx:bb.x+bb.w/2,cy:semiToY(s,st)});});}catch(e){}}var svg=wrap.querySelector('svg');if(!svg)return;svg.addEventListener('click',function(e){var r=svg.getBoundingClientRect(),cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);if(cx<st.getX()+35)return;for(var k=0;k<bHits.length;k++){var h=bHits[k];if(Math.abs(cy-h.cy)<10&&Math.abs(cx-h.cx)<20){var sr=svg.getBoundingClientRect();showBP(sr.left+h.cx*(sr.width/W),sr.top+h.cy*(sr.height/H),h.i);return;}}var topY=st.getYForLine(0),half=st.getSpacingBetweenLines()/2;var step=Math.round((cy-topY)/half);if(step<0||step>=DSTEPS.length)return;var semi=DSTEPS[step];if(bNotes.indexOf(semi)>=0)return;play(semi);bNotes.push(semi);hideBP();bRender();bUpdate();});svg.addEventListener('mousemove',function(e){var r=svg.getBoundingClientRect(),cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);svg.style.cursor=bHits.some(function(h){return Math.abs(cy-h.cy)<10&&Math.abs(cx-h.cx)<20;})?'pointer':'crosshair';});}function bUpdate(){var nEl=document.getElementById('b-name'),fEl=document.getElementById('b-full'),hEl=document.getElementById('b-hint');if(!nEl)return;if(!bNotes.length){nEl.textContent='';fEl.textContent='';hEl.textContent='Töne setzen um einen Akkord zu erstellen';return;}if(bNotes.length===1){nEl.textContent=s2name(bNotes[0]);fEl.textContent='Einzelton';hEl.textContent='Weitere Töne hinzufügen';return;}var res=recJazz(bNotes);if(res){nEl.textContent=res.root+res.suffix;fEl.textContent=res.full;hEl.textContent=bNotes.length+' Töne';}else{nEl.textContent='?';fEl.textContent='Unbekannt';hEl.textContent=bNotes.length+' Töne';}}document.getElementById('b-play').addEventListener('click',function(){if(bNotes.length)playArr(bNotes,document.getElementById('b-play'));});document.getElementById('b-clear').addEventListener('click',function(){bNotes=[];hideBP();bRender();bUpdate();});bRender();bUpdate();window.addEventListener('resize',bRender);})();

/* === S7 MELODIE === */
(function(){var DUR_BEATS={w:4,h:2,q:1,qd:1.5,'8':0.5,'8d':0.75};var DUR_SEC={w:2,h:1,q:0.5,qd:0.75,'8':0.25,'8d':0.375};var FLAT_KEYS=['c','db','d','eb','e','f','gb','g','ab','a','bb','b'];var lines=[[[],[]],[[],[]]];var keySig='C',ui={dur:'q',isRest:false,acc:0};var beatBoxes=[[[],[]],[[],[]]];function pSemi(p){return typeof p==='object'?p.s:p;}function pAcc(p){return typeof p==='object'?p.a:0;}function s2vexP(p){var s=pSemi(p),a=pAcc(p);if(a<0)return FLAT_KEYS[((s%12)+12)%12]+'/'+(Math.floor(s/12)+4);return VEX_KEYS[((s%12)+12)%12]+'/'+(Math.floor(s/12)+4);}function needsAcc(p){return SHARPS.indexOf(((pSemi(p)%12)+12)%12)>=0;}var s7pan=document.getElementById('s7panel');var s7sel=null;function hideS7Pan(){s7sel=null;s7pan.style.display='none';renderAll();}function showS7Pan(px,py,li,bi,beatIdx,pitchIdx){s7sel={li:li,bi:bi,beatIdx:beatIdx,pitchIdx:pitchIdx};var p=lines[li][bi][beatIdx].pitches[pitchIdx];document.getElementById('s7p-name').textContent=s2name(pSemi(p));s7pan.style.left=Math.max(8,Math.min(window.innerWidth-80,px-32))+'px';s7pan.style.top=Math.max(8,py-195)+'px';s7pan.style.display='flex';renderAll();}function s7shift(delta){if(!s7sel)return;var pitches=lines[s7sel.li][s7sel.bi][s7sel.beatIdx].pitches;var p=pitches[s7sel.pitchIdx];var newS=Math.max(-5,Math.min(24,pSemi(p)+delta));pitches[s7sel.pitchIdx]={s:newS,a:pAcc(p)};play(newS);document.getElementById('s7p-name').textContent=s2name(newS);renderAll();}document.getElementById('s7p-u1').addEventListener('click',function(){s7shift(1);});document.getElementById('s7p-u2').addEventListener('click',function(){s7shift(2);});document.getElementById('s7p-d1').addEventListener('click',function(){s7shift(-1);});document.getElementById('s7p-d2').addEventListener('click',function(){s7shift(-2);});document.getElementById('s7p-del').addEventListener('click',function(){if(!s7sel)return;var beat=lines[s7sel.li][s7sel.bi][s7sel.beatIdx];beat.pitches.splice(s7sel.pitchIdx,1);if(!beat.pitches.length)beat.isRest=true;hideS7Pan();});document.getElementById('s7p-close').addEventListener('click',hideS7Pan);document.addEventListener('click',function(e){if(s7pan.style.display!=='none'&&!s7pan.contains(e.target)&&!e.target.closest('.s7-sys'))hideS7Pan();});function barBeats(li,bi){return lines[li][bi].reduce(function(s,n){return s+DUR_BEATS[n.dur];},0);}function fillRests(li,bi){if(!lines[li][bi].length)return[{dur:'w',pitches:[],isRest:true}];var rem=Math.round((4-barBeats(li,bi))*1000)/1000,out=[];[[4,'w'],[2,'h'],[1,'q'],[0.5,'8']].forEach(function(x){while(rem>=x[0]-0.001){out.push({dur:x[1],pitches:[],isRest:true});rem=Math.round((rem-x[0])*1000)/1000;}});return out;}function makeSN(beat){var base=beat.dur.replace('d',''),dotted=beat.dur.indexOf('d')>=0;var ds=base+(dotted?'d':'')+(beat.isRest||!beat.pitches.length?'r':'');var sn;if(beat.isRest||!beat.pitches.length){sn=new StaveNote({keys:['b/4'],duration:ds,align_center:base==='w'&&!dotted});}else{var sorted=[].concat(beat.pitches).sort(function(a,b){return pSemi(a)-pSemi(b);});sn=new StaveNote({keys:sorted.map(s2vexP),duration:ds,auto_stem:true});sorted.forEach(function(p,i){var a=pAcc(p);if(a==='n')sn.addModifier(new Accidental('n'),i);else if(needsAcc(p))sn.addModifier(new Accidental(a<0?'b':'#'),i);});}if(dotted)sn.addModifier(new VF.Dot(),0);return sn;}function renderAll(){renderLine(0);renderLine(1);}function renderLine(li){var wrap=document.getElementById('s7-sys-'+li);if(!wrap)return;wrap.innerHTML='';beatBoxes[li]=[[],[]];var W=Math.max((wrap.parentElement.clientWidth-8)||360,360),H=128;var ren=new Renderer(wrap,Renderer.Backends.SVG);ren.resize(W,H);var vctx=ren.getContext();var hdrW=30+(keySig!=='C'?14:0)+24+8,barW=Math.floor((W-20-hdrW)/2);var st0=new Stave(10,20,hdrW+barW);st0.addClef('treble');st0.addKeySignature(keySig);st0.addTimeSignature('4/4');st0.setContext(vctx).draw();var st1=new Stave(10+hdrW+barW,20,barW);st1.setEndBarType(VF.Barline.type.END);st1.setContext(vctx).draw();var staves=[st0,st1];var topY=st0.getYForLine(0),halfPx=st0.getSpacingBetweenLines()/2;for(var bi=0;bi<2;bi++){var filled=[].concat(lines[li][bi],fillRests(li,bi));try{var vfNotes=filled.map(makeSN);var voice=new Voice({num_beats:4,beat_value:4}).setStrict(false);voice.addTickables(vfNotes);new Formatter().joinVoices([voice]).format([voice],barW-14);voice.draw(vctx,staves[bi]);var userCnt=lines[li][bi].length;beatBoxes[li][bi]=[];for(var ni=0;ni<userCnt;ni++){var bb=vfNotes[ni].getBoundingBox();var pitchYs=[];if(!lines[li][bi][ni].isRest){lines[li][bi][ni].pitches.forEach(function(p,pi){var idx=DSTEPS.indexOf(pSemi(p));var py=idx>=0?topY+idx*halfPx:topY+6*halfPx;pitchYs.push({semi:pSemi(p),y:py,origIdx:pi});});}beatBoxes[li][bi].push({x1:bb.x-6,x2:bb.x+bb.w+6,idx:ni,cx:bb.x+bb.w/2,pitchYs:pitchYs});}try{var e8=vfNotes.filter(function(n){return !n.isRest&&n.getDuration&&n.getDuration()==='8';});if(e8.length>=2)VF.Beam.generateBeams(e8).forEach(function(b){b.setContext(vctx).draw();});}catch(ex){}}catch(err){console.warn('s7',li,bi,err);}}document.getElementById('s7-st-'+li).textContent='Takt 1: '+Math.round(barBeats(li,0)*100)/100+'/4  ·  Takt 2: '+Math.round(barBeats(li,1)*100)/100+'/4';var svg=wrap.querySelector('svg');if(!svg)return;svg.addEventListener('click',function(e){var r=svg.getBoundingClientRect();var cx=(e.clientX-r.left)*(W/r.width),cy=(e.clientY-r.top)*(H/r.height);var bi=-1;for(var i=0;i<staves.length;i++){if(cx>=staves[i].getNoteStartX()&&cx<=staves[i].getX()+staves[i].getWidth()){bi=i;break;}}if(bi<0)return;var step=Math.round((cy-topY)/halfPx);if(step<0||step>=DSTEPS.length)return;var semi=DSTEPS[step];var hitBeat=-1,boxes=beatBoxes[li][bi];for(var k=0;k<boxes.length;k++){if(cx>=boxes[k].x1&&cx<=boxes[k].x2){hitBeat=k;break;}}if(hitBeat>=0){var beat=lines[li][bi][hitBeat];var box=boxes[hitBeat];if(!ui.isRest&&!beat.isRest&&beat.pitches.length){var bestPi=-1,bestDist=20;for(var pi=0;pi<box.pitchYs.length;pi++){var dist=Math.abs(cy-box.pitchYs[pi].y);if(dist<bestDist){bestDist=dist;bestPi=pi;}}if(bestPi>=0){var sr=svg.getBoundingClientRect();showS7Pan(sr.left+box.cx*(sr.width/W),sr.top+box.pitchYs[bestPi].y*(sr.height/H),li,bi,hitBeat,box.pitchYs[bestPi].origIdx);return;}}if(ui.isRest){lines[li][bi][hitBeat]={dur:beat.dur,pitches:[],isRest:true};}else if(beat.isRest){lines[li][bi][hitBeat]={dur:beat.dur,pitches:[{s:semi,a:ui.acc}],isRest:false};play(semi);}else if(!beat.pitches.some(function(p){return pSemi(p)===semi;})){var fs=semi+(ui.acc==='n'?0:(ui.acc||0));beat.pitches.push({s:fs,a:ui.acc});play(fs);}}else{var needed=DUR_BEATS[ui.dur]||1,rem=Math.round((4-barBeats(li,bi))*1000)/1000;if(needed>rem+0.001)return;if(ui.isRest){lines[li][bi].push({dur:ui.dur,pitches:[],isRest:true});}else{var finalSemi=Math.max(-5,Math.min(24,semi+(ui.acc==='n'?0:(ui.acc||0))));play(finalSemi);lines[li][bi].push({dur:ui.dur,pitches:[{s:finalSemi,a:ui.acc}],isRest:false});}}renderAll();});svg.addEventListener('mousemove',function(e){if(ui.isRest){svg.style.cursor='pointer';return;}var r=svg.getBoundingClientRect(),cy=(e.clientY-r.top)*(H/r.height);var step=Math.round((cy-topY)/halfPx);if(step>=0&&step<DSTEPS.length){svg.style.cursor='crosshair';svg.title=s2name(DSTEPS[step]);}else{svg.style.cursor='default';svg.title='';}});}function setActive(dur,isRest){ui.dur=dur;ui.isRest=isRest;document.querySelectorAll('#s7-nbtns .s7-pbtn,#s7-rbtns .s7-pbtn').forEach(function(b){b.classList.remove('active');});var btns=document.querySelectorAll(isRest?'#s7-rbtns .s7-pbtn':'#s7-nbtns .s7-pbtn');for(var i=0;i<btns.length;i++){if(btns[i].dataset.dur===dur){btns[i].classList.add('active');break;}}}document.querySelectorAll('#s7-accs .s7-pbtn').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#s7-accs .s7-pbtn').forEach(function(x){x.classList.remove('active');});b.classList.add('active');var v=b.dataset.acc;ui.acc=v==='n'?'n':(v==='0'?0:parseInt(v,10));});});document.querySelectorAll('#s7-nbtns .s7-pbtn').forEach(function(b){b.addEventListener('click',function(){setActive(b.dataset.dur,false);});});document.querySelectorAll('#s7-rbtns .s7-pbtn').forEach(function(b){b.addEventListener('click',function(){setActive(b.dataset.dur,true);});});document.getElementById('s7-keysig').addEventListener('change',function(e){keySig=e.target.value;renderAll();});document.getElementById('s7-undo').addEventListener('click',function(){for(var li=1;li>=0;li--){for(var bi=1;bi>=0;bi--){var bar=lines[li][bi];if(!bar.length)continue;var last=bar[bar.length-1];if(!last.isRest&&last.pitches.length>1){last.pitches.pop();}else{bar.pop();}renderAll();return;}}});document.getElementById('s7-clear').addEventListener('click',function(){lines=[[[],[]],[[],[]]];hideS7Pan();renderAll();});document.getElementById('s7-play').addEventListener('click',function(){ensureCtx();var btn=document.getElementById('s7-play');btn.classList.add('playing');var t=actx.currentTime+.06,total=0;lines.forEach(function(line){line.forEach(function(bar){bar.forEach(function(n){var d=DUR_SEC[n.dur]||0.5;if(!n.isRest&&n.pitches.length)n.pitches.forEach(function(p){tone(s2freq(pSemi(p)),t,.32);});t+=d;total+=d;});});});setTimeout(function(){btn.classList.remove('playing');},total*1000+300);bubbleEl(btn);});setActive('q',false);renderAll();window.addEventListener('resize',renderAll);})();

/* === S8 TEMPO & DYNAMIK === */
(function(){
  var SCALE=[0,2,4,5,7,9,11,12,11,9,7,5,4,2,0];
  document.querySelectorAll('.tempo-card').forEach(function(card){
    card.addEventListener('click',function(){
      var bpm=parseInt(card.dataset.bpm);if(!bpm)return;
      ensureCtx();card.classList.add('playing');
      var interval=60/bpm,t=actx.currentTime+.05;
      SCALE.forEach(function(s){tone(s2freq(s),t,.3);t+=interval;});
      setTimeout(function(){card.classList.remove('playing');},SCALE.length*interval*1000+200);
      bubbleEl(card);
    });
  });
  document.querySelectorAll('.dyn-card').forEach(function(card){
    card.addEventListener('click',function(){
      var vol=parseFloat(card.dataset.vol);if(!vol)return;
      ensureCtx();card.classList.add('playing');
      var t=actx.currentTime+.05;
      [0,4,7,12].forEach(function(s){tone(s2freq(s),t,vol);});
      setTimeout(function(){card.classList.remove('playing');},1600);
      bubbleEl(card);
    });
  });
})();

/* === S9 QUINTENZIRKEL === */
(function(){
  var DUR=[
    {name:'C',sharps:0,semi:[0,4,7]},{name:'G',sharps:1,semi:[7,11,14]},
    {name:'D',sharps:2,semi:[2,6,9]},{name:'A',sharps:3,semi:[9,13,16]},
    {name:'E',sharps:4,semi:[4,8,11]},{name:'H',sharps:5,semi:[11,15,18]},
    {name:'F♯',sharps:6,semi:[6,10,13]},{name:'D♭',flats:5,semi:[1,5,8]},
    {name:'A♭',flats:4,semi:[8,12,15]},{name:'E♭',flats:3,semi:[3,7,10]},
    {name:'B♭',flats:2,semi:[10,14,17]},{name:'F',flats:1,semi:[5,9,12]}
  ];
  var MOLL=[
    {name:'a',semi:[9,12,16]},{name:'e',semi:[4,7,11]},{name:'h',semi:[11,14,18]},{name:'f♯',semi:[6,9,13]},{name:'c♯',semi:[1,4,8]},{name:'g♯',semi:[8,11,15]},
    {name:'e♭',semi:[3,6,10]},{name:'b♭',semi:[10,13,17]},{name:'f',semi:[5,8,12]},{name:'c',semi:[0,3,7]},{name:'g',semi:[7,10,14]},{name:'d',semi:[2,5,9]}
  ];
  var COLORS=['#e53935','#fb8c00','#f9a825','#7cb342','#43a047','#00897b','#0288d1','#1565c0','#283593','#4527a0','#6a1b9a','#ad1457'];

  function drawQZ(){
    var svg=document.getElementById('qz-svg');if(!svg)return;svg.innerHTML='';
    var cx=300,cy=300,rOuter=250,rMid=195,rInner=145,rCenter=80;
    var bgCircle=document.createElementNS(SVG_NS,'circle');
    bgCircle.setAttribute('cx',cx);bgCircle.setAttribute('cy',cy);bgCircle.setAttribute('r',rOuter+10);
    bgCircle.setAttribute('fill','#f8f7ff');bgCircle.setAttribute('stroke','#e0e0e0');bgCircle.setAttribute('stroke-width','1');
    svg.appendChild(bgCircle);
    for(var i=0;i<12;i++){
      var angle1=(i*30-105)*Math.PI/180,angle2=((i+1)*30-105)*Math.PI/180,midAngle=((i+0.5)*30-105)*Math.PI/180;
      var path=document.createElementNS(SVG_NS,'path');
      var x1o=cx+rOuter*Math.cos(angle1),y1o=cy+rOuter*Math.sin(angle1),x2o=cx+rOuter*Math.cos(angle2),y2o=cy+rOuter*Math.sin(angle2);
      var x1m=cx+rMid*Math.cos(angle1),y1m=cy+rMid*Math.sin(angle1),x2m=cx+rMid*Math.cos(angle2),y2m=cy+rMid*Math.sin(angle2);
      path.setAttribute('d','M'+x1m+','+y1m+' L'+x1o+','+y1o+' A'+rOuter+','+rOuter+' 0 0,1 '+x2o+','+y2o+' L'+x2m+','+y2m+' A'+rMid+','+rMid+' 0 0,0 '+x1m+','+y1m);
      path.setAttribute('fill',COLORS[i]);path.setAttribute('opacity','0.15');path.setAttribute('stroke','white');path.setAttribute('stroke-width','2');
      path.style.cursor='pointer';path.style.transition='opacity .15s';
      (function(idx,p){p.addEventListener('mouseenter',function(){p.setAttribute('opacity','0.35');});p.addEventListener('mouseleave',function(){p.setAttribute('opacity','0.15');});p.addEventListener('click',function(){playArr(DUR[idx].semi,null);bubbleEl(svg.parentElement);});})(i,path);
      svg.appendChild(path);
      var lx=cx+(rOuter+rMid)/2*Math.cos(midAngle),ly=cy+(rOuter+rMid)/2*Math.sin(midAngle);
      var txt=document.createElementNS(SVG_NS,'text');txt.setAttribute('x',lx);txt.setAttribute('y',ly+1);txt.setAttribute('text-anchor','middle');txt.setAttribute('dominant-baseline','central');txt.setAttribute('font-size','18');txt.setAttribute('font-weight','900');txt.setAttribute('fill',COLORS[i]);txt.setAttribute('pointer-events','none');txt.textContent=DUR[i].name;svg.appendChild(txt);
      var vzTxt=document.createElementNS(SVG_NS,'text');vzTxt.setAttribute('x',lx);vzTxt.setAttribute('y',ly+16);vzTxt.setAttribute('text-anchor','middle');vzTxt.setAttribute('font-size','9');vzTxt.setAttribute('font-weight','600');vzTxt.setAttribute('fill',COLORS[i]);vzTxt.setAttribute('opacity','0.7');vzTxt.setAttribute('pointer-events','none');
      if(DUR[i].sharps>0)vzTxt.textContent=DUR[i].sharps+'♯';else if(DUR[i].flats>0)vzTxt.textContent=DUR[i].flats+'♭';else vzTxt.textContent='–';svg.appendChild(vzTxt);
      var pathM=document.createElementNS(SVG_NS,'path');
      var x1i=cx+rInner*Math.cos(angle1),y1i=cy+rInner*Math.sin(angle1),x2i=cx+rInner*Math.cos(angle2),y2i=cy+rInner*Math.sin(angle2);
      var x1c=cx+rCenter*Math.cos(angle1),y1c=cy+rCenter*Math.sin(angle1),x2c=cx+rCenter*Math.cos(angle2),y2c=cy+rCenter*Math.sin(angle2);
      pathM.setAttribute('d','M'+x1c+','+y1c+' L'+x1i+','+y1i+' A'+rInner+','+rInner+' 0 0,1 '+x2i+','+y2i+' L'+x2c+','+y2c+' A'+rCenter+','+rCenter+' 0 0,0 '+x1c+','+y1c);
      pathM.setAttribute('fill',COLORS[i]);pathM.setAttribute('opacity','0.08');pathM.setAttribute('stroke','white');pathM.setAttribute('stroke-width','2');
      pathM.style.cursor='pointer';pathM.style.transition='opacity .15s';
      (function(idx,p){p.addEventListener('mouseenter',function(){p.setAttribute('opacity','0.25');});p.addEventListener('mouseleave',function(){p.setAttribute('opacity','0.08');});p.addEventListener('click',function(){playArr(MOLL[idx].semi,null);bubbleEl(svg.parentElement);});})(i,pathM);
      svg.appendChild(pathM);
      var mlx=cx+(rInner+rCenter)/2*Math.cos(midAngle),mly=cy+(rInner+rCenter)/2*Math.sin(midAngle);
      var mtxt=document.createElementNS(SVG_NS,'text');mtxt.setAttribute('x',mlx);mtxt.setAttribute('y',mly+1);mtxt.setAttribute('text-anchor','middle');mtxt.setAttribute('dominant-baseline','central');mtxt.setAttribute('font-size','13');mtxt.setAttribute('font-weight','700');mtxt.setAttribute('fill',COLORS[i]);mtxt.setAttribute('opacity','0.65');mtxt.setAttribute('pointer-events','none');mtxt.textContent=MOLL[i].name;svg.appendChild(mtxt);
      var sepLine=document.createElementNS(SVG_NS,'line');sepLine.setAttribute('x1',cx+rMid*Math.cos(angle1));sepLine.setAttribute('y1',cy+rMid*Math.sin(angle1));sepLine.setAttribute('x2',cx+rCenter*Math.cos(angle1));sepLine.setAttribute('y2',cy+rCenter*Math.sin(angle1));sepLine.setAttribute('stroke','white');sepLine.setAttribute('stroke-width','1.5');svg.appendChild(sepLine);
    }
    var cc=document.createElementNS(SVG_NS,'circle');cc.setAttribute('cx',cx);cc.setAttribute('cy',cy);cc.setAttribute('r',rCenter);cc.setAttribute('fill','white');cc.setAttribute('stroke','#e0e0e0');cc.setAttribute('stroke-width','1');svg.appendChild(cc);
    var cLabel=document.createElementNS(SVG_NS,'text');cLabel.setAttribute('x',cx);cLabel.setAttribute('y',cy-8);cLabel.setAttribute('text-anchor','middle');cLabel.setAttribute('font-size','14');cLabel.setAttribute('font-weight','900');cLabel.setAttribute('fill','#333');cLabel.textContent='Quinten-';svg.appendChild(cLabel);
    var cLabel2=document.createElementNS(SVG_NS,'text');cLabel2.setAttribute('x',cx);cLabel2.setAttribute('y',cy+12);cLabel2.setAttribute('text-anchor','middle');cLabel2.setAttribute('font-size','14');cLabel2.setAttribute('font-weight','900');cLabel2.setAttribute('fill','#333');cLabel2.textContent='zirkel';svg.appendChild(cLabel2);
  }
  drawQZ();
  window.addEventListener('resize',drawQZ);
})();

/* === C-DUR DEMO === */
(function(){
  var CDUR_SEMIS=[0,4,7];
  function renderCdurDemo(){
    var wrap=document.getElementById('cdur-demo-vex');
    if(!wrap)return;
    wrap.innerHTML='';
    var vctx=mkCtx(wrap,160,120);
    var stave=new Stave(10,15,140);
    stave.addClef('treble');
    stave.setContext(vctx).draw();
    var note=mkChordNote(CDUR_SEMIS,'w');
    var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice],80);
    voice.draw(vctx,stave);
  }
  var btn=document.getElementById('cdur-demo-play');
  if(btn){
    btn.addEventListener('click',function(){
      playArr(CDUR_SEMIS,btn);
    });
  }
  renderCdurDemo();
  window.addEventListener('resize',renderCdurDemo);
})();

/* === WEITERE AKKORD-DEMOS === */
(function(){
  var AKKORDE=[
    {id:'fdur',semis:[5,9,12]},
    {id:'gdur',semis:[7,11,14]},
    {id:'ddur',semis:[2,6,9]},
    {id:'edur',semis:[4,8,11]}
  ];
  function renderMiniAkkord(ak){
    var wrap=document.getElementById(ak.id+'-demo-vex');
    if(!wrap)return;
    wrap.innerHTML='';
    var vctx=mkCtx(wrap,120,110);
    var stave=new Stave(5,12,110);
    stave.addClef('treble');
    stave.setContext(vctx).draw();
    var note=mkChordNote(ak.semis,'w');
    var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice],60);
    voice.draw(vctx,stave);
  }
  function renderAllMini(){
    AKKORDE.forEach(renderMiniAkkord);
  }
  AKKORDE.forEach(function(ak){
    var btn=document.getElementById(ak.id+'-demo-play');
    if(btn){
      btn.addEventListener('click',function(){
        playArr(ak.semis,btn);
      });
    }
  });
  renderAllMini();
  window.addEventListener('resize',renderAllMini);
})();

/* === SEPTAKKORD DEMOS === */
(function(){
  var SEPT=[
    {id:'cmaj7', semis:[0,4,7,11], keys:['c/4','e/4','g/4','b/4'], accs:[]},
    {id:'c7', semis:[0,4,7,10], keys:['c/4','e/4','g/4','bb/4'], accs:[{i:3,t:'b'}]},
    {id:'cm7', semis:[0,3,7,10], keys:['c/4','eb/4','g/4','bb/4'], accs:[{i:1,t:'b'},{i:3,t:'b'}]}
  ];
  function renderSept(s){
    var wrap=document.getElementById(s.id+'-demo-vex');
    if(!wrap)return;
    wrap.innerHTML='';
    var vctx=mkCtx(wrap,130,115);
    var stave=new Stave(5,10,120);
    stave.addClef('treble');
    stave.setContext(vctx).draw();
    var note=new StaveNote({keys:s.keys,duration:'w',auto_stem:true});
    s.accs.forEach(function(a){note.addModifier(new Accidental(a.t),a.i);});
    var voice=new Voice({num_beats:1,beat_value:1}).setStrict(false);
    voice.addTickables([note]);
    new Formatter().joinVoices([voice]).format([voice],60);
    voice.draw(vctx,stave);
  }
  function renderAllSept(){SEPT.forEach(renderSept);}
  SEPT.forEach(function(s){
    var btn=document.getElementById(s.id+'-demo-play');
    if(btn){btn.addEventListener('click',function(){playArr(s.semis,btn);});}
  });
  renderAllSept();
  window.addEventListener('resize',renderAllSept);
})();

/* === TERZ DEMO === */
(function(){
  var NOTES=[
    {name:'C',semi:0},{name:'C♯',semi:1},{name:'D',semi:2},
    {name:'D♯',semi:3,alt:'E♭'},{name:'E',semi:4},
    {name:'F',semi:5},{name:'F♯',semi:6},{name:'G',semi:7}
  ];
  var strip=document.getElementById('demo-strip');
  var statusEl=document.getElementById('demo-status');
  var bracketRow=document.getElementById('demo-bracket-row');
  var resultEl=document.getElementById('demo-result');
  if(!strip)return;
  var cells=[],running=false,tids=[];

  NOTES.forEach(function(n){
    var c=document.createElement('div');
    c.style.cssText='flex:1;min-width:40px;max-width:70px;height:72px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:.82em;transition:all .35s;border:2px solid #e0e0e0;background:#f5f5f5;color:#bbb;font-family:Open Sans,sans-serif;';
    var nm=document.createElement('div');nm.style.cssText='font-size:1.1em;line-height:1.2;transition:all .35s;';nm.textContent=n.name;c.appendChild(nm);
    var lb=document.createElement('div');lb.style.cssText='font-size:.58em;font-weight:700;opacity:.85;margin-top:3px;min-height:14px;transition:all .35s;';c.appendChild(lb);
    strip.appendChild(c);
    cells.push({el:c,nameEl:nm,labelEl:lb,orig:n.name});
  });

  function reset(){
    tids.forEach(clearTimeout);tids=[];running=false;
    cells.forEach(function(c){
      c.el.style.background='#f5f5f5';c.el.style.borderColor='#e0e0e0';
      c.el.style.color='#bbb';c.el.style.transform='scale(1)';c.el.style.boxShadow='none';
      c.labelEl.textContent='';c.nameEl.textContent=c.orig;
    });
    bracketRow.innerHTML='';resultEl.innerHTML='';
    statusEl.textContent='Klicke auf „Dur zeigen" oder „Moll zeigen"';
    statusEl.style.color='var(--muted)';
  }

  function hl(idx,bg,brd,col,label){
    cells[idx].el.style.background=bg;cells[idx].el.style.borderColor=brd;
    cells[idx].el.style.color=col;cells[idx].el.style.transform='scale(1.08)';
    if(label)cells[idx].labelEl.textContent=label;
  }

  function addBracket(flexVal,label,color){
    var d=document.createElement('div');d.style.cssText='display:flex;flex-direction:column;align-items:center;border-radius:0 0 8px 8px;padding:4px 0 6px;transition:opacity .4s;';
    d.style.flex=''+flexVal;
    var bg=color==='#2e7d32'?'rgba(46,125,50,0.1)':'rgba(106,27,154,0.1)';
    d.style.background=bg;d.style.borderBottom='3px solid '+color;
    var t=document.createElement('div');t.style.cssText='font-size:.72em;font-weight:800;color:'+color+';white-space:nowrap;';
    t.textContent=label;d.appendChild(t);
    bracketRow.appendChild(d);
  }

  function runDemo(mode){
    if(running)return;
    reset();running=true;
    var isDur=mode==='dur';
    var terzIdx=isDur?4:3;
    var terzSteps=isDur?4:3;
    var quintSteps=isDur?3:4;
    var terzLabel=isDur?'große Terz':'kleine Terz';
    var quintLabel=isDur?'kleine Terz':'große Terz';
    var terzCol=isDur?'#2e7d32':'#6a1b9a';
    var quintCol=isDur?'#6a1b9a':'#2e7d32';
    var t=0;

    if(!isDur)cells[3].nameEl.textContent='E♭';

    // Step 1: Grundton
    tids.push(setTimeout(function(){
      statusEl.textContent='Schritt 1: Grundton wählen';statusEl.style.color='#006064';
      hl(0,'linear-gradient(135deg,#006064,#00897b)','#006064','white','Grundton');
      play(0);bubbleEl(cells[0].el);
    },t+=500));

    // Step 2: Count to Terz
    tids.push(setTimeout(function(){
      statusEl.textContent='Schritt 2: Halbtonschritte zur Terz zählen …';
      statusEl.style.color=terzCol;
    },t+=1400));

    for(var i=1;i<=terzIdx;i++){
      (function(idx,count){
        tids.push(setTimeout(function(){
          if(idx<terzIdx){
            cells[idx].el.style.background=isDur?'rgba(46,125,50,0.12)':'rgba(106,27,154,0.12)';
            cells[idx].el.style.borderColor=terzCol;cells[idx].el.style.color=terzCol;
            cells[idx].labelEl.textContent=count;
            play(NOTES[idx].semi);
          }else{
            hl(idx,isDur?'linear-gradient(135deg,#2e7d32,#43a047)':'linear-gradient(135deg,#6a1b9a,#9c27b0)',terzCol,'white',terzLabel);
            play(NOTES[idx].semi);bubbleEl(cells[idx].el);
          }
        },t+=380));
      })(i,i);
    }

    // Bracket 1
    tids.push(setTimeout(function(){
      statusEl.textContent=terzSteps+' Halbtonschritte = '+terzLabel+(isDur?' ☀️':' 🌙');
      addBracket(terzSteps,terzSteps+' Halbtonschritte → '+terzLabel,terzCol);
    },t+=600));

    // Step 3: Count to Quinte
    tids.push(setTimeout(function(){
      statusEl.textContent='Schritt 3: Halbtonschritte zur Quinte zählen …';
      statusEl.style.color=quintCol;
    },t+=1400));

    for(var j=terzIdx+1;j<=7;j++){
      (function(idx,count){
        tids.push(setTimeout(function(){
          if(idx<7){
            cells[idx].el.style.background=isDur?'rgba(106,27,154,0.12)':'rgba(46,125,50,0.12)';
            cells[idx].el.style.borderColor=quintCol;cells[idx].el.style.color=quintCol;
            cells[idx].labelEl.textContent=count;
            play(NOTES[idx].semi);
          }else{
            hl(idx,isDur?'linear-gradient(135deg,#6a1b9a,#9c27b0)':'linear-gradient(135deg,#2e7d32,#43a047)',quintCol,'white',quintLabel);
            play(NOTES[idx].semi);bubbleEl(cells[idx].el);
          }
        },t+=380));
      })(j,j-terzIdx);
    }

    // Bracket 2
    tids.push(setTimeout(function(){
      statusEl.textContent=quintSteps+' Halbtonschritte = '+quintLabel;
      addBracket(quintSteps,quintSteps+' Halbtonschritte → '+quintLabel,quintCol);
    },t+=600));

    // Step 4: Result
    tids.push(setTimeout(function(){
      var semis=isDur?[0,4,7]:[0,3,7];
      playArr(semis,null);
      [0,terzIdx,7].forEach(function(idx){
        cells[idx].el.style.transform='scale(1.12)';
        cells[idx].el.style.boxShadow='0 4px 20px rgba(0,0,0,.2)';
      });
      if(isDur){
        statusEl.innerHTML='✅ <strong>C-Dur Dreiklang</strong> = große Terz + kleine Terz';
        statusEl.style.color='#2e7d32';
        resultEl.innerHTML='<div style="font-size:1.4em;font-weight:900;color:#2e7d32;">☀️ C-Dur</div><div style="font-size:.82em;color:var(--muted);margin-top:4px;">Klingt hell, fröhlich, offen</div>';
      }else{
        statusEl.innerHTML='✅ <strong>C-Moll Dreiklang</strong> = kleine Terz + große Terz';
        statusEl.style.color='#6a1b9a';
        resultEl.innerHTML='<div style="font-size:1.4em;font-weight:900;color:#6a1b9a;">🌙 C-Moll</div><div style="font-size:.82em;color:var(--muted);margin-top:4px;">Klingt dunkel, melancholisch</div>';
      }
      bubbleEl(strip);running=false;
    },t+=1400));
  }

  document.getElementById('demo-dur-btn').addEventListener('click',function(){if(running){reset();}runDemo('dur');});
  document.getElementById('demo-moll-btn').addEventListener('click',function(){if(running){reset();}runDemo('moll');});
  document.getElementById('demo-reset-btn').addEventListener('click',reset);
})();

/* === INIT === */
renderAllScales();buildStufen();buildUmkehr();
window.addEventListener('resize',renderAllScales);
