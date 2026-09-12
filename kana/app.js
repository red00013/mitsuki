const sets={
  hiragana:[["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],["わ","wa"],["を","wo"],["ん","n"]],
  katakana:[["ア","a"],["イ","i"],["ウ","u"],["エ","e"],["オ","o"],["カ","ka"],["キ","ki"],["ク","ku"],["ケ","ke"],["コ","ko"],["サ","sa"],["シ","shi"],["ス","su"],["セ","se"],["ソ","so"],["タ","ta"],["チ","chi"],["ツ","tsu"],["テ","te"],["ト","to"],["ナ","na"],["ニ","ni"],["ヌ","nu"],["ネ","ne"],["ノ","no"],["ハ","ha"],["ヒ","hi"],["フ","fu"],["ヘ","he"],["ホ","ho"],["マ","ma"],["ミ","mi"],["ム","mu"],["メ","me"],["モ","mo"],["ヤ","ya"],["ユ","yu"],["ヨ","yo"],["ラ","ra"],["リ","ri"],["ル","ru"],["レ","re"],["ロ","ro"],["ワ","wa"],["ヲ","wo"],["ン","n"]]
};

let mode="hiragana", index=0, stars=Number(localStorage.getItem("kanaStars")||0);
let kanaData={hiragana:[],katakana:[]};
const DATA_URL={hiragana:"https://cdn.jsdelivr.net/npm/kana-svg-data/dist/allHiragana.json",katakana:"https://cdn.jsdelivr.net/npm/kana-svg-data/dist/allKatakana.json"};
const $=id=>document.getElementById(id);
const guide=$("guideCanvas"), draw=$("drawCanvas"), wrap=$("canvasWrap");
let strokes=[], current=[], drawing=false;

function resize(){
  const r=wrap.getBoundingClientRect(), dpr=Math.min(devicePixelRatio||1,2);
  [guide,draw].forEach(c=>{c.width=r.width*dpr;c.height=r.height*dpr;c.style.width=r.width+"px";c.style.height=r.height+"px";});
  [guide,draw].forEach(c=>c.getContext("2d").setTransform(dpr,0,0,dpr,0,0));
  drawGuide(); redraw();
}
function drawGuide(){
  const ctx=guide.getContext("2d"), r=wrap.getBoundingClientRect();
  ctx.clearRect(0,0,r.width,r.height);
  ctx.strokeStyle="#e9ddd2";ctx.lineWidth=2;ctx.setLineDash([6,7]);
  ctx.beginPath();ctx.moveTo(r.width/2,18);ctx.lineTo(r.width/2,r.height-18);ctx.moveTo(18,r.height/2);ctx.lineTo(r.width-18,r.height/2);ctx.stroke();ctx.setLineDash([]);
  ctx.font=`${Math.min(r.height*.68,250)}px "Hiragino Sans", sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
  ctx.fillStyle="#eadfd5";ctx.fillText(sets[mode][index][0],r.width/2,r.height/2+4);
}
function pos(e){const r=draw.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function redraw(){
  const ctx=draw.getContext("2d"),r=wrap.getBoundingClientRect();ctx.clearRect(0,0,r.width,r.height);
  ctx.strokeStyle="#493e38";ctx.lineWidth=7;ctx.lineCap="round";ctx.lineJoin="round";
  for(const s of strokes) paint(ctx,s);
  if(current.length)paint(ctx,current);
}
function paint(ctx,s){if(s.length<2)return;ctx.beginPath();ctx.moveTo(s[0].x,s[0].y);for(let i=1;i<s.length;i++)ctx.lineTo(s[i].x,s[i].y);ctx.stroke();}
draw.addEventListener("pointerdown",e=>{e.preventDefault();drawing=true;draw.setPointerCapture(e.pointerId);current=[pos(e)];redraw()});
draw.addEventListener("pointermove",e=>{if(!drawing)return;e.preventDefault();current.push(pos(e));redraw()});
draw.addEventListener("pointerup",e=>{if(!drawing)return;drawing=false;if(current.length>2)strokes.push(current);current=[];redraw()});
draw.addEventListener("pointercancel",()=>{drawing=false;current=[];redraw()});

async function loadStrokeData(){
  try{
    const [h,k]=await Promise.all([fetch(DATA_URL.hiragana).then(r=>r.json()),fetch(DATA_URL.katakana).then(r=>r.json())]);
    kanaData.hiragana=h;kanaData.katakana=k;renderStrokeOrder();
  }catch(e){$("strokeOrder").innerHTML=`<div class="stroke-loading">書き順を読み込めませんでした</div>`}
}
function renderStrokeOrder(){
  const ch=sets[mode][index][0];
  const item=kanaData[mode].find(x=>String.fromCodePoint(x.charCode)===ch);
  const box=$("strokeOrder");
  if(!item){box.innerHTML="";return}
  let paths="", nums="", seen=new Set();
  for(const st of item.strokes){
    paths+=`<path d="${st.value}" fill="#d9c9bc"/>`;
    const n=String(st.id).match(/^\d+/)?.[0];
    if(!seen.has(n)){
      const med=item.medians.find(m=>String(m.id)===String(st.id))?.value || item.medians.find(m=>String(m.id).startsWith(n))?.value;
      if(med&&med.length){const [x,y]=med[0];nums+=`<circle cx="${x}" cy="${y}" r="34" fill="#fffaf2"/><text x="${x}" y="${y+14}" text-anchor="middle" class="stroke-number">${n}</text>`;}
      seen.add(n);
    }
  }
  box.innerHTML=`<svg viewBox="0 0 1024 1024" aria-label="${ch} stroke order">${paths}${nums}</svg>`;
}
function render(){
  const [ch,ro]=sets[mode][index];$("character").textContent=ch;$("romaji").textContent=ro;
  $("progressText").textContent=`${index+1} / ${sets[mode].length}`;$("scoreText").textContent=`${stars} ${stars===1?"star":"stars"}`;
  $("progressBar").style.width=`${((index+1)/sets[mode].length)*100}%`;
  document.querySelectorAll(".mode").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $("feedback").textContent="";strokes=[];current=[];resize();renderDots();
}
function renderDots(){const d=$("dots");d.innerHTML="";sets[mode].forEach((_,i)=>{const x=document.createElement("span");x.className="dot"+(i===index?" active":"");d.appendChild(x)})}
$("clearBtn").onclick=()=>{strokes=[];current=[];redraw();$("feedback").textContent=""};
$("checkBtn").onclick=()=>{
  if(strokes.length===0){$("feedback").textContent="Try tracing first ✏️";return}
  stars++;localStorage.setItem("kanaStars",stars);
  $("feedback").textContent="Great tracing! ⭐";
  setTimeout(()=>next(),650);
};
function next(){index=(index+1)%sets[mode].length;render();renderStrokeOrder()}
function prev(){index=(index-1+sets[mode].length)%sets[mode].length;render();renderStrokeOrder()}
$("nextBtn").onclick=next;$("prevBtn").onclick=prev;
document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{mode=b.dataset.mode;index=0;render();renderStrokeOrder()});
$("resetProgress").onclick=()=>{if(confirm("Reset stars and start over?")){stars=0;localStorage.removeItem("kanaStars");index=0;render()}};
window.addEventListener("resize",resize);
render();
loadStrokeData();
