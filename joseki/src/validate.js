// node joseki/src/validate.js で，定跡と手筋の全手が合法か，詰将棋が詰むかを確かめる
const E=(()=>{const s=require('fs').readFileSync(__dirname+'/engine.js','utf8');return new Function(s+';return{legalMoves,apply,inCheck,isMate,mateIn,str,parsePos,parseMove};')();})();const fs=require('fs');
const src=fs.readFileSync(__dirname+'/data.js','utf8');
const {LINES,TESUJI}=new Function(src+';return {LINES,TESUJI};')();
const K=['','一','二','三','四','五','六','七','八','九'];
function init(){const back=['香','桂','銀','金','玉','金','銀','桂','香'];const b={};
 for(let i=0;i<9;i++){const f=9-i;b[f*10+1]={t:back[i],s:'g',p:false};b[f*10+9]={t:back[i],s:'s',p:false};b[f*10+3]={t:'歩',s:'g',p:false};b[f*10+7]={t:'歩',s:'s',p:false};}
 b[82]={t:'飛',s:'g',p:false};b[22]={t:'角',s:'g',p:false};b[88]={t:'角',s:'s',p:false};b[28]={t:'飛',s:'s',p:false};return{b,h:{s:{},g:{}}};}
const eq=(a,b)=>E.str(a)===E.str(b);
let bad=0;const err=(...a)=>{bad++;console.log('NG',...a);};
for(const L of LINES){let pos=init();let prev=null;
 L.moves.forEach(([m,label,c],i)=>{const s=i%2?'g':'s';const mv=E.parseMove(m,s);
  const legal=E.legalMoves(pos,s).some(x=>eq(x,mv));if(!legal)return err(L.name,i+1,label,'illegal');
  if(s===L.side&&!c)err(L.name,i+1,label,'no comment');
  if(!label.startsWith(s==='s'?'▲':'△'))err(L.name,label,'mark');
  const dest=`${mv.to/10|0}${K[mv.to%10]}`;if(label.includes('同')){if(prev!==mv.to)err(L.name,label,'同');}else if(!label.includes(dest))err(L.name,label,'dest');
  const name=mv.drop||pos.b[mv.from].t;if(!label.includes(name))err(L.name,label,'piece');
  if(!!mv.promote!==label.includes('成'))err(L.name,label,'promo');
  pos=E.apply(pos,mv);prev=mv.to;});
 console.log('ok?',L.name,L.moves.length);}
for(const T of TESUJI){let pos=E.parsePos(T.S||'',T.G||'',T.H||'',T.GH||'');
 if(E.inCheck(pos.b,'g'))err(T.n,'gote in check at start');
 if(T.mate){const sols=E.mateIn(pos,T.mate).map(E.str);const short=T.mate>1?E.mateIn(pos,T.mate-2).map(E.str):[];
   for(const a of T.L[0])if(!sols.includes(a))err(T.n,'not a mate start',a,sols);
   if(short.length)err(T.n,'shorter mate',short);
   console.log('mate',T.n,'all solutions:',sols.join(' '));}
 T.L.forEach((st,i)=>{const s=i%2?'g':'s';const alts=Array.isArray(st)?st:[st];if(!alts.length)return;
   for(const a of alts){const mv=E.parseMove(a,s);if(!E.legalMoves(pos,s).some(x=>eq(x,mv)))err(T.n,i,a,'illegal');}
   pos=E.apply(pos,E.parseMove(alts[0],s));});
}
console.log('problems:',bad,'tesuji:',TESUJI.length,'lines:',LINES.length);
