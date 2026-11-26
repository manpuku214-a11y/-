// minimal shogi rules for verification
const PROMOTABLE={歩:1,香:1,桂:1,銀:1,角:1,飛:1};
const GOLDLIKE=[[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1]];
const STEP={歩:[[0,-1]],金:GOLDLIKE,銀:[[0,-1],[1,-1],[-1,-1],[1,1],[-1,1]],玉:[[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[1,1],[-1,1]],桂:[[1,-2],[-1,-2]]};
const SLIDE={飛:[[0,1],[0,-1],[1,0],[-1,0]],角:[[1,1],[1,-1],[-1,1],[-1,-1]],香:[[0,-1]]};
function vectors(pc){ // returns {steps, slides} in sente orientation
  if(pc.p){ if(pc.t==='飛')return{steps:[[1,1],[1,-1],[-1,1],[-1,-1]],slides:SLIDE.飛};
    if(pc.t==='角')return{steps:[[0,1],[0,-1],[1,0],[-1,0]],slides:SLIDE.角};
    return{steps:GOLDLIKE,slides:[]};}
  return{steps:STEP[pc.t]||[],slides:SLIDE[pc.t]||[]};}
const on=(f,r)=>f>=1&&f<=9&&r>=1&&r<=9;
function targets(b,sq){const pc=b[sq];const f=sq/10|0,r=sq%10;const sg=pc.s==='s'?1:-1;const v=vectors(pc);const out=[];
  for(const[a,c]of v.steps){const ff=f+a*sg,rr=r+c*sg;if(on(ff,rr))out.push(ff*10+rr);}
  for(const[a,c]of v.slides){for(let k=1;k<9;k++){const ff=f+a*k*sg,rr=r+c*k*sg;if(!on(ff,rr))break;out.push(ff*10+rr);if(b[ff*10+rr])break;}}
  return out;}
function attacked(b,sq,by){for(const k in b){if(b[k].s===by&&targets(b,+k).includes(sq))return true;}return false;}
function kingSq(b,s){for(const k in b)if(b[k].t==='玉'&&b[k].s===s)return +k;return null;}
function inCheck(b,s){const k=kingSq(b,s);return k!=null&&attacked(b,k,s==='s'?'g':'s');}
const zone=(s,r)=>s==='s'?r<=3:r>=7;
function mustPromote(t,s,r){const rr=s==='s'?r:10-r;return (t==='歩'||t==='香')&&rr===1||t==='桂'&&rr<=2;}
function apply(pos,m){const b={...pos.b};const h={s:{...pos.h.s},g:{...pos.h.g}};const s=m.s;
  if(m.drop){b[m.to]={t:m.drop,s,p:false};h[s][m.drop]--;}
  else{const pc=b[m.from];const cap=b[m.to];if(cap&&cap.t!=='玉')h[s][cap.t]=(h[s][cap.t]||0)+1;b[m.to]={t:pc.t,s,p:pc.p||!!m.promote};delete b[m.from];}
  return{b,h};}
function legalMoves(pos,s){const out=[];const b=pos.b;
  for(const k in b){const pc=b[k];if(pc.s!==s)continue;const from=+k;
    for(const to of targets(b,from)){if(b[to]&&b[to].s===s)continue;const fr=from%10,tr=to%10;
      const canP=PROMOTABLE[pc.t]&&!pc.p&&(zone(s,fr)||zone(s,tr));const must=!pc.p&&mustPromote(pc.t,s,tr);
      const opts=must?[true]:canP?[true,false]:[false];
      for(const pr of opts)out.push({s,from,to,promote:pr});}}
  for(const t in pos.h[s]){if(!(pos.h[s][t]>0))continue;
    for(let f=1;f<=9;f++)for(let r=1;r<=9;r++){const sq=f*10+r;if(b[sq])continue;if(mustPromote(t,s,r))continue;
      if(t==='歩'){let ni=false;for(let rr=1;rr<=9;rr++){const q=b[f*10+rr];if(q&&q.s===s&&q.t==='歩'&&!q.p)ni=true;}if(ni)continue;}
      out.push({s,drop:t,to:sq});}}
  return out.filter(m=>!inCheck(apply(pos,m).b,s));}
function isMate(pos){return inCheck(pos.b,'g')&&legalMoves(pos,'g').length===0;}
function mateIn(pos,n){ // sente to move; returns list of first moves that force mate within n plies (n odd)
  const res=[];for(const m of legalMoves(pos,'s')){const p2=apply(pos,m);if(!inCheck(p2.b,'g'))continue;
    if(m.drop==='歩'&&isMate(p2))continue; // uchifuzume
    if(forced(p2,n-1))res.push(m);}return res;}
function forced(p,n){const reps=legalMoves(p,'g');if(reps.length===0)return inCheck(p.b,'g');if(n<=0)return false;
  for(const r of reps){const p3=apply(p,r);if(mateIn(p3,n-1).length===0)return false;}return true;}
const K=['','一','二','三','四','五','六','七','八','九'];
function str(m){return (m.drop?'*'+m.drop:''+m.from)+m.to+(m.promote?'+':'');}
function parsePos(S,G,H,GH){const b={};const rd=(str,s)=>{for(const tok of (str||'').split(/\s+/).filter(Boolean)){const map={竜:['飛',1],馬:['角',1],と:['歩',1]};const [t,p]=map[tok[0]]||[tok[0],0];b[+tok[1]*10+ +tok[2]]={t,s,p:!!p};}};
  rd(S,'s');rd(G,'g');const hand=str=>{const h={};let last=null;for(const ch of (str||'')){if(/\d/.test(ch)){h[last]+=+ch-1;}else{h[ch]=(h[ch]||0)+1;last=ch;}}return h;};
  return{b,h:{s:hand(H),g:hand(GH)}};}
function parseMove(m,s){if(m[0]==='*')return{s,drop:m[1],to:+m[2]*10+ +m[3]};return{s,from:+m[0]*10+ +m[1],to:+m[2]*10+ +m[3],promote:m.endsWith('+')};}

