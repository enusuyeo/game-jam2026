/* ══════════════════════════════════════════════════════
   TARTAROS: Oath of Hunger — Web Prototype
   Speed Initiative | D&D Card Usage | Round-Based Combat
   ══════════════════════════════════════════════════════ */

import { CARD_LIBRARY, STARTING_DECKS, MAX_DECK_SIZE, CARD_REWARD_POOL } from "./cards/card-data.js?v=3";
import { applyCardEffect } from "./cards/card-effects.js?v=3";
import { createEnemyGroup, createBoss, BOSS_NAMES } from "./battle/enemy-factory.js?v=3";

const STORAGE_KEY = "tartaros_v4";
const STRESS_LIMIT = 95;
const HAND_SIZE = 5;
const MAX_HAND = 7;

const PHASE = {
  TITLE: "TITLE", MAP: "MAP", COMBAT: "COMBAT", EVENT: "EVENT",
  BATTLE_REWARD: "BATTLE_REWARD", BATTLE_REWARD_ASSIGN: "BATTLE_REWARD_ASSIGN",
  FLOOR_REWARD: "FLOOR_REWARD", FLOOR_REWARD_PICK: "FLOOR_REWARD_PICK",
  FLOOR_REWARD_REMOVE: "FLOOR_REWARD_REMOVE",
  CUTSCENE: "CUTSCENE", ENDING: "ENDING",
};

const FLOOR_NAMES = ["Branded Cellblock", "Fractured Vault", "Corridor of Oblivion", "Hall of Judgment", "Gatekeeper's Altar"];
const FLOOR_COLORS = [[46,89,142],[102,69,139],[61,116,97],[126,68,74],[124,93,50]];
const PARTY_TEMPLATES = [
  { name: "Serin",  role: "Disruption Priest", maxHp: 34 },
  { name: "Rikos", role: "Melee Executioner", maxHp: 40 },
  { name: "Arke", role: "Frontline Guardian", maxHp: 48 },
];

const EVENT_VARIANTS = [
  { title: "Forbidden Table", text: "The scent of red bread tempts you.", options: [
    { id:"food_eat", hint:"Eat the food", label: "Hell meal: HP +10, Binding +1, Stress +5", apply(s) { aliveParty(s).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+10);addStress(s,m,5)}); s.run.consumedFoodCount+=1; logLine(s,"Binding increased."); }},
    { id:"food_fast", hint:"Refuse to eat", label: "Keep fasting: Memory Fragment +1", apply(s) { s.run.memoryFragments+=1; logLine(s,"Gained a fragment."); }},
    { id:"food_altar", hint:"Offer to altar", label: "Altar offering: Gold +30, Binding +1, Stress +3", apply(s) { s.run.gold+=30; s.run.consumedFoodCount+=1; aliveParty(s).forEach(m=>addStress(s,m,3)); logLine(s,"Gained coins."); }},
    { id:"food_meditate", hint:"Meditate", label: "Meditate: HP +5, Stress -10", apply(s) { aliveParty(s).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+5);reduceStress(m,10)}); logLine(s,"Recovered."); }},
  ]},
  { title: "Blackstone Exchange", text: "A shadow merchant whispers.", options: [
    { id:"shop_remove", hint:"Pay gold", label: "20 Gold: Remove a card", apply(s) { if(s.run.gold<20){logLine(s,"Not enough gold.");return;} s.run.gold-=20; const t=aliveParty(s).find(m=>m.deck.length>0); if(t){t.deck.shift();logLine(s,`${t.name} card removed.`);} }},
    { id:"shop_steroid", hint:"Take injection", label: "Boost injection: Attack +1, Stress +8", apply(s) { s.run.attackBonus+=1; aliveParty(s).forEach(m=>addStress(s,m,8)); logLine(s,"Attack +1."); }},
    { id:"shop_contract", hint:"Break contract", label: "Break contract: HP -5, Gold +25", apply(s) { aliveParty(s).forEach(m=>m.hp=Math.max(1,m.hp-5)); s.run.gold+=25; logLine(s,"Gold +25."); }},
    { id:"shop_ignore", hint:"Ignore", label: "Ignore", apply(s) { logLine(s,"Walked past."); }},
  ]},
];

const EVENT_MEMORY_KEY = "tartaros_event_memory";
function loadEventMemory() { try { const r=localStorage.getItem(EVENT_MEMORY_KEY); return r?new Set(JSON.parse(r)):new Set(); } catch { return new Set(); } }
function saveEventMemory(set) { localStorage.setItem(EVENT_MEMORY_KEY, JSON.stringify([...set])); }
function markEventSeen(optionId) { const mem=loadEventMemory(); mem.add(optionId); saveEventMemory(mem); }
function isEventSeen(optionId) { return loadEventMemory().has(optionId); }

const CUTSCENES = buildCutscenes();

const cardFrontImg = new Image();
cardFrontImg.src = "../assets/ui/pixel/deck_ui/card_front.png";
const charSprites = {
  Arke: { img: new Image(), fw: 200, fh: 373, cols: 4, seq:[0,1,2,3], scale:0.8 },
  Rikos: { img: new Image(), fw: 200, fh: 373, cols: 4, seq:[0,1,2,3], scale:0.8 },
  Serin: { img: new Image(), fw: 256, fh: 768, cols: 4, seq:[1,1,2,2], scale:1.7, yOffset:140 },
};
charSprites.Arke.img.src = "../assets/ui/pixel/characters/sideview/arke-standing-sprite.png";
charSprites.Rikos.img.src = "../assets/ui/pixel/characters/sideview/arke-standing-sprite.png";
charSprites.Serin.img.src = "../assets/ui/pixel/characters/sideview/serin-standing-sprite.png";
const SPRITE_FPS = 6;
let spriteFrame = 0, spriteLastTime = 0;
const hpBarFrame = new Image();
hpBarFrame.src = "../assets/ui/pixel/hp-ui.png";
const cardBackImg = new Image();
cardBackImg.src = "../assets/ui/pixel/deck_ui/card_back.png";

const BG_PATH = "../assets/ui/pixel/background/";
function loadImg(name) { const img = new Image(); img.src = BG_PATH + name; return img; }

const bgGameStart = loadImg("bg_gamestart.png");
const bgMap = loadImg("map_bg.png");

const bgFloorNormal = {
  1: loadImg("bg-01-normal-wall.png"),
  2: loadImg("bg-02-normal-wall.png"),
  3: loadImg("bg-03-normal-wall.png"),
  4: loadImg("bg-04-cursed-archive-wall.png"),
  5: loadImg("bg-05-normal-wall.png"),
};
const bgFloorBoss = {
  1: loadImg("bg-01-boss-wall.png"),
  2: loadImg("bg-02-boss-wall.png"),
  3: loadImg("bg-03-boss-wall.png"),
  4: loadImg("bg-04-boss-wall.png"),
  5: loadImg("bg-05-boss-wall.png"),
};
const bgEvent = [
  loadImg("bg-06-catacomb-wall.png"),
  loadImg("bg-06-prison-chapel-wall.png"),
  loadImg("bg-06-shadow-market-wall.png"),
];

function drawBg(img) {
  if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, 0, 0, 960, 540);
  else { ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(0, 0, 960, 540); }
}

function getCombatBg() {
  if (!state.combat) return bgFloorNormal[1];
  return state.combat.isBoss
    ? (bgFloorBoss[state.run.floor] || bgFloorBoss[3])
    : (bgFloorNormal[state.run.floor] || bgFloorNormal[1]);
}

/* ── DOM ─────────────────────────────────────── */
const hudPanel = document.getElementById("hudPanel");
const descriptionPanel = document.getElementById("descriptionPanel");
const actionsPanel = document.getElementById("actionsPanel");
const logPanel = document.getElementById("logPanel") || document.createElement("div");
const overlayHint = document.getElementById("overlayHint");
const canvas = document.getElementById("sceneCanvas");
const ctx = canvas.getContext("2d");

/* ── State ───────────────────────────────────── */
const state = {
  phase: PHASE.TITLE, run: null, floor: null, combat: null,
  eventContext: null, rewardChoices: [], pendingRewardCard: null, removeMember: null,
  activeScene: null, activeSceneIndex: 0, activeSceneOnEnd: null,
  turnOrder: [], currentActionIdx: 0, actingMember: null, waitingForAlly: false, discarding: false,
  diceRolling: { active: false, startTime: 0, settled: false, finalSpeeds: null },
  cardDrawAnim: { active: false, cards: [], startTime: 0 },
  enemyActing: null,
  logs: [],
};

let dragState = null;
let highlightedEnemy = -1;
const DICE_ROLL_MS = 800;
const DICE_SETTLE_MS = 1300;

requestAnimationFrame(loop);
renderAll();
initPointerEvents();

function loop(ts) {
  if(ts-spriteLastTime > 1000/SPRITE_FPS) { spriteFrame=(spriteFrame+1)%4; spriteLastTime=ts; }
  drawScene(); requestAnimationFrame(loop);
}

/* ── Party / Enemy helpers ───────────────────── */
function createMember(tpl) { return { name:tpl.name, role:tpl.role, hp:tpl.maxHp, maxHp:tpl.maxHp, stress:0, block:0, speed:0, deck:[...STARTING_DECKS[tpl.name]] }; }
function isActive(m) { return m.hp>0 && m.stress<=STRESS_LIMIT; }
function aliveParty(s) { return s.run?s.run.party.filter(isActive):[]; }
function aliveEnemyList(combat) { return combat?combat.enemies.map((e,i)=>[i,e]).filter(([,e])=>e.hp>0):[]; }

function addStress(s,m,a) { if(!isActive(m))return; const o=m.stress; m.stress=Math.min(100,m.stress+a); if(o<=STRESS_LIMIT&&m.stress>STRESS_LIMIT)onCollapse(s,m); }
function reduceStress(m,a) { m.stress=Math.max(0,m.stress-a); }
function onCollapse(s,m) { logLine(s,`⚠ ${m.name} Collapsed!`); if(!s.run.collapsedNames.includes(m.name))s.run.collapsedNames.push(m.name); s.run.party.filter(x=>x!==m&&isActive(x)).forEach(x=>addStress(s,x,8)); }

function dmgEnemyFn(combat,s,ti,raw) {
  const e=combat.enemies[ti]; if(!e||e.hp<=0)return;
  const blk=Math.min(e.block,raw),act=raw-blk; e.block=Math.max(0,e.block-blk); e.hp=Math.max(0,e.hp-act);
  logLine(s,`→ ${e.name} Damage ${act}${blk?` (Blocked ${blk})`:""}`);
  if(e.hp<=0){logLine(s,`✦ ${e.name} Defeated!`); aliveParty(s).forEach(m=>reduceStress(m,3));}
}
function drawCardsFromPile(combat, n) {
  const drawn = [];
  while (n > 0 && combat.hand.length < 10) {
    if (!combat.drawPile.length) break;
    const cid = combat.drawPile.pop();
    combat.hand.push(cid);
    drawn.push(cid);
    n--;
  }
  if (drawn.length > 0) triggerDrawAnim(drawn);
}

function triggerDrawAnim(cardIds) {
  const viewport = document.getElementById("gameViewport");
  const existing = viewport.querySelector(".card-draw-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "card-draw-overlay";
  viewport.appendChild(overlay);

  const spd = gameSettings.drawSpeed || 1.0;
  const STAGGER = Math.round(800 / spd);
  const BACK_SHOW = Math.round(600 / spd);
  const FLIP_DUR = Math.round(400 / spd);
  const FRONT_SHOW = Math.round(1200 / spd);
  const FADE_DUR = Math.round(500 / spd);

  cardIds.forEach((cid, i) => {
    const card = CARD_LIBRARY[cid];
    const delay = i * STAGGER;

    setTimeout(() => {
      const backEl = document.createElement("div");
      backEl.className = "card-draw-item back";
      overlay.appendChild(backEl);

      setTimeout(() => {
        backEl.style.animation = `cardFadeOut ${FLIP_DUR}ms ease-in forwards`;
        setTimeout(() => {
          backEl.remove();
          const frontEl = document.createElement("div");
          frontEl.className = "card-draw-item front";
          frontEl.innerHTML = `<div class="draw-name">${card.name}</div><div class="draw-text">${card.text}</div>`;
          overlay.appendChild(frontEl);

          setTimeout(() => {
            frontEl.style.animation = `cardFadeOut ${FADE_DUR}ms ease-in forwards`;
            setTimeout(() => frontEl.remove(), FADE_DUR);
          }, FRONT_SHOW);
        }, FLIP_DUR);
      }, BACK_SHOW);
    }, delay);
  });

  const totalTime = cardIds.length * STAGGER + BACK_SHOW + FLIP_DUR + FRONT_SHOW + FADE_DUR + 200;
  setTimeout(() => overlay.remove(), totalTime);
}
function makeEffectCtx(s,cb) { return { state:s,combat:cb, aliveParty:()=>aliveParty(s), aliveEnemyList:()=>aliveEnemyList(cb), dmgEnemy:(ti,raw)=>dmgEnemyFn(cb,s,ti,raw), drawCards:n=>drawCardsFromPile(cb,n), log:m=>logLine(s,m) }; }

/* ── D&D: Pointer Events ────────────────────── */
function initPointerEvents() {
  document.addEventListener("pointermove", onPtrMove);
  document.addEventListener("pointerup", onPtrUp);
}

function onCardDragStart(e, cardIdx) {
  const cb = state.combat; if(!cb) return;
  const cid = cb.hand[cardIdx]; const card = CARD_LIBRARY[cid];
  if(!card.needsTarget) { playAllyCard(cardIdx, -1); return; }
  const rect = e.target.getBoundingClientRect();
  const clone = e.target.cloneNode(true);
  clone.classList.add("drag-clone");
  clone.style.left = `${e.clientX-60}px`; clone.style.top = `${e.clientY-20}px`;
  document.body.appendChild(clone);
  dragState = { cardIdx, clone }; e.preventDefault();
}

function onPtrMove(e) {
  if(state.phase===PHASE.MAP&&state.floor){
    const cp=screenToCanvas(e.clientX,e.clientY);
    canvas.style.cursor=getNodeAtCanvasPos(cp.x,cp.y)?"pointer":"default";
  }
  if(!dragState) return;
  dragState.clone.style.left = `${e.clientX-60}px`;
  dragState.clone.style.top = `${e.clientY-20}px`;
  const cp = screenToCanvas(e.clientX, e.clientY);
  highlightedEnemy = getEnemyAtPos(cp.x, cp.y);
}

function onPtrUp(e) {
  if(!dragState) return;
  dragState.clone.remove();
  const cp = screenToCanvas(e.clientX, e.clientY);
  const ei = getEnemyAtPos(cp.x, cp.y);
  if(ei>=0) playAllyCard(dragState.cardIdx, ei);
  dragState = null; highlightedEnemy = -1;
}

function onCanvasClick(e) {
  const cp = screenToCanvas(e.clientX, e.clientY);
  if (state.phase === PHASE.MAP && state.floor) {
    const nd = getNodeAtCanvasPos(cp.x, cp.y);
    if (nd) { selectNode(nd); return; }
  }
}

document.getElementById("gameViewport").addEventListener("click", (e) => {
  if (state.phase !== PHASE.MAP || !state.floor) return;
  if (e.target.closest(".bottom-bar") || e.target.closest(".hud-top")) return;
  const cp = screenToCanvas(e.clientX, e.clientY);
  const nd = getNodeAtCanvasPos(cp.x, cp.y);
  if (nd) selectNode(nd);
});

function getNodeAtCanvasPos(x, y) {
  const fl = state.floor;
  if (!fl) return null;
  const s = fl.size;
  const adjIds = new Set(getAdj(fl).map(n => n.id));
  const gridArea = Math.min(420, 480);
  const cellSize = Math.floor(gridArea / s);
  const ox = 480 - cellSize * s / 2, oy = 60;
  const nodeR = Math.max(10, Math.min(16, Math.floor(cellSize * 0.32)));

  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      const nd = fl.grid[r][c];
      if (!adjIds.has(nd.id)) continue;
      const cx = ox + c * cellSize + cellSize / 2;
      const cy = oy + r * cellSize + cellSize / 2;
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= (nodeR + 8) * (nodeR + 8)) return nd;
    }
  }
  return null;
}

function screenToCanvas(sx, sy) {
  const r = canvas.getBoundingClientRect();
  return { x: (sx-r.left)/r.width*960, y: (sy-r.top)/r.height*540 };
}

function getEnemyAtPos(x, y) {
  if(!state.combat) return -1;
  for(let i=0;i<state.combat.enemies.length;i++) {
    const e=state.combat.enemies[i]; if(e.hp<=0)continue;
    const ex=620, ey=120+i*100;
    if(x>=ex&&x<=ex+280&&y>=ey&&y<=ey+85) return i;
  }
  return -1;
}

/* ── Rendering ───────────────────────────────── */
function renderAll() {
  renderHUD(); renderDesc(); renderActions(); renderLogs();
  const bb = document.querySelector(".bottom-bar");
  const ht = document.querySelector(".hud-top");
  if (bb) {
    bb.style.pointerEvents = state.phase === PHASE.MAP ? "none" : "auto";
    const isCombat = state.phase === PHASE.COMBAT || state.phase === PHASE.BATTLE_REWARD || state.phase === PHASE.BATTLE_REWARD_ASSIGN;
    bb.classList.toggle("combat-top", isCombat);
  }
  if (ht) ht.style.pointerEvents = state.phase === PHASE.MAP ? "none" : "auto";
}

function renderHUD() {
  hudPanel.innerHTML=""; const run=state.run;
  if(!run){return;}
  addChip(hudPanel,"Floor",`${run.floor}/5`); addChip(hudPanel,"Gold",`${run.gold}`);
  addChip(hudPanel,"Binding",`${run.consumedFoodCount}`);
  if(run.attackBonus)addChip(hudPanel,"ATK",`+${run.attackBonus}`);
  if(!state.combat){
    const sep=document.createElement("div");sep.className="hud-separator";hudPanel.appendChild(sep);
    run.party.forEach(m=>{
      const el=document.createElement("div"); el.className="hud-member"+(isActive(m)?"":" dead");
      const hp=m.maxHp>0?(m.hp/m.maxHp)*100:0, st=Math.min(m.stress,100);
      const hc=hp>50?"#50c878":hp>25?"#e6b84d":"#ff4d4d";
      const sc=st<=30?"#50c878":st<=60?"#e6b84d":st<=STRESS_LIMIT?"#d46ab0":"#ff4d4d";
      const tag=!isActive(m)?(m.stress>STRESS_LIMIT?" [Collapsed]":" [Dead]"):"";
      el.innerHTML=`<span class="m-name">${m.name}</span><span class="m-role">${m.role}</span>
        <span class="hp-bar"><span class="fill" style="width:${hp}%;background:${hc}"></span></span><span class="hp-num">${m.hp}</span>
        <span class="stress-bar"><span class="fill" style="width:${st}%;background:${sc}"></span></span><span class="stress-num">${m.stress}${tag}</span>
        <span style="color:#8a9bb0;font-size:9px">Deck${m.deck.length}</span>
        ${m.block>0?`<span style="color:#5da4e6;font-size:10px">🛡${m.block}</span>`:""}`;
      hudPanel.appendChild(el);
    });
  }
  if(state.combat){const s2=document.createElement("div");s2.className="hud-separator";hudPanel.appendChild(s2);
    addChip(hudPanel,"Turn",`${state.combat.roundNumber}`);addChip(hudPanel,"Draw Pile",`${state.combat.drawPile.length}`);addChip(hudPanel,"Hand",`${state.combat.hand.length}`);}
}
function addChip(p,l,v){const el=document.createElement("div");el.className="hud-chip";el.innerHTML=`<span class="label">${l}</span><span class="val">${v}</span>`;p.appendChild(el);}

function renderDesc() {
  descriptionPanel.innerHTML=""; overlayHint.textContent="";
  if(state.phase===PHASE.COMBAT&&state.turnOrder.length>0){
    const parts=state.turnOrder.map((u,idx)=>{
      const isCur=idx===state.currentActionIdx;
      const done=idx<state.currentActionIdx;
      const nm=u.type==="ally"?state.run.party[u.index].name:(state.combat?state.combat.enemies[u.index].name:"?");
      const spd=u.speed;
      let color=done?"#555":isCur?"#ffc857":u.type==="ally"?"#88bbdd":"#cc8888";
      const arrow=isCur?"▶ ":"";
      return `<span style="color:${color};font-size:10px;${isCur?"font-weight:700;":""}">${arrow}${nm}(${spd})</span>`;
    });
    descriptionPanel.innerHTML=parts.join(" → ");
  } else if(state.phase===PHASE.COMBAT&&state.discarding) {
    descriptionPanel.textContent="Discard cards";
  }
}

function renderActions() {
  actionsPanel.innerHTML="";
  const head=document.createElement("h3"), row=document.createElement("div"); row.className="action-row";
  const H={
    [PHASE.TITLE]:()=>{head.textContent="";renderTitleButtons(row);},
    ["SETTINGS"]:()=>{head.textContent="";renderSettingsPanel(row);},
    [PHASE.MAP]:()=>{head.textContent="Map";renderMapAct(row);},
    [PHASE.COMBAT]:()=>{head.textContent="";renderCombatAct(row);},
    [PHASE.EVENT]:()=>{head.textContent="";renderEventAct(row);},
    [PHASE.BATTLE_REWARD]:()=>{head.textContent="";renderRewardAct(row);},
    [PHASE.BATTLE_REWARD_ASSIGN]:()=>{head.textContent="";renderAssignAct(row);},
    [PHASE.FLOOR_REWARD]:()=>{head.textContent="";renderFloorAct(row);},
    [PHASE.FLOOR_REWARD_PICK]:()=>{head.textContent="";renderFloorPickAct(row);},
    [PHASE.FLOOR_REWARD_REMOVE]:()=>{head.textContent="";renderFloorRemoveAct(row);},
    [PHASE.CUTSCENE]:()=>{head.textContent="Cutscene";row.appendChild(btn("Next","primary",nextFrame));row.appendChild(btn("Skip","",skipScene));},
    [PHASE.ENDING]:()=>{head.textContent="Result";row.appendChild(btn("Restart","primary",startNewRun));},
  };
  const h=H[state.phase]; if(h)h();
  actionsPanel.appendChild(head); actionsPanel.appendChild(row);
}

function imgBtn(src, onClick) {
  const b = document.createElement("button");
  b.className = "img-btn";
  b.innerHTML = `<img src="${src}" alt="" />`;
  b.onclick = onClick;
  return b;
}

const gameSettings = { musicVol: 0.7, drawSpeed: 1.0 };

function renderTitleButtons(c) {
  const BTN = "../assets/ui/pixel/buttons/";
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  const startBtn = imgBtn(BTN + "start.png", startNewRun);
  startBtn.querySelector("img").style.cssText = "height:auto;width:100px;";
  wrap.appendChild(startBtn);
  const setBtn = imgBtn(BTN + "setting.png", openSettings);
  setBtn.querySelector("img").style.cssText = "height:auto;width:110px;";
  wrap.appendChild(setBtn);
  c.appendChild(wrap);
}

function openSettings() {
  state.phase = "SETTINGS";
  renderAll();
}

function renderSettingsPanel(c) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:12px;width:100%;max-width:360px;";

  const title = document.createElement("div");
  title.style.cssText = "font-size:16px;font-weight:700;color:#f6d18d;text-align:center;";
  title.textContent = "Settings";
  wrap.appendChild(title);

  wrap.appendChild(makeSlider("Music Volume", gameSettings.musicVol, v => { gameSettings.musicVol = v; }));
  wrap.appendChild(makeSlider("Card Draw Speed", gameSettings.drawSpeed, v => { gameSettings.drawSpeed = v; }, 0.5, 2.0, 0.1));

  c.appendChild(wrap);
  c.appendChild(btn("Back", "primary", () => { state.phase = PHASE.TITLE; renderAll(); }));
}

function makeSlider(label, val, onChange, min=0, max=1, step=0.05) {
  const row = document.createElement("div");
  row.style.cssText = "display:flex;align-items:center;gap:8px;";
  const lbl = document.createElement("span");
  lbl.style.cssText = "font-size:12px;color:#d0dae8;min-width:90px;";
  lbl.textContent = label;
  const inp = document.createElement("input");
  inp.type = "range"; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
  inp.style.cssText = "flex:1;accent-color:#f6d18d;";
  const num = document.createElement("span");
  num.style.cssText = "font-size:11px;color:#8a9bb0;min-width:30px;text-align:right;";
  num.textContent = Math.round(val * 100) + "%";
  inp.oninput = () => { onChange(parseFloat(inp.value)); num.textContent = Math.round(inp.value * 100) + "%"; };
  row.appendChild(lbl); row.appendChild(inp); row.appendChild(num);
  return row;
}

function renderMapAct(c) {
  const run=state.run, fl=state.floor;

  if(run.floor===5){
    const adj=getAdj(fl);
    if(adj.some(n=>n.type==="boss")){
      const h=document.createElement("div");h.style.cssText="font-size:11px;padding:4px 0;text-align:center;";
      if(run.collapsedNames.length)h.innerHTML=`<span style="color:#ff4d4d">⚠ Collapse -> Fail</span>`;
      else if(run.consumedFoodCount)h.innerHTML=`<span style="color:#d46ab0">⚠ Binding -> Loop</span>`;
      else h.innerHTML=`<span style="color:#50c878">✦ True Ending Available!</span>`;
      c.appendChild(h);
    }
  }

  const skipBtn = btn("⏭ Skip Stage (Cheat)", "", () => {
    if(run.floor>=5) return;
    loadFloor(run.floor+1);
  });
  skipBtn.style.pointerEvents = "auto";
  c.appendChild(skipBtn);
}

function renderCombatAct(c) {
  if(!state.combat) return;
  if(state.diceRolling.active) {
    const info = document.createElement("div"); info.style.cssText="font-size:13px;color:#ffc857;padding:4px 0;font-weight:600;";
    info.textContent = state.diceRolling.settled ? "Speed locked! Action starts..." : "🎲 Rolling dice...";
    c.appendChild(info);
    return;
  }
  if(state.enemyActing) {
    const info = document.createElement("div"); info.style.cssText="font-size:14px;color:#ff9988;padding:8px 0;font-weight:600;text-align:center;";
    info.textContent = state.enemyActing.preview;
    c.appendChild(info);
    return;
  }
  if(state.discarding && state.combat) {
    const cb=state.combat;
    const excess = cb.hand.length - MAX_HAND;
    const info = document.createElement("div"); info.style.cssText="font-size:12px;color:#ffc857;padding:4px 0;text-align:center;font-weight:600;";
    info.textContent = `Hand limit exceeded! ${excess} cards must be discarded (${cb.hand.length}/${MAX_HAND})`;
    c.appendChild(info);
    const cardRow = document.createElement("div"); cardRow.className = "card-hand-row";
    cb.hand.forEach((cid, i) => {
      const card = CARD_LIBRARY[cid];
      const el = document.createElement("div");
      el.className = "visual-card self-card";
      el.innerHTML = `<div class="vc-cost">${card.cost}</div><div class="vc-name">${card.name}</div><div class="vc-type" style="color:#ff8866">Discard</div><div class="vc-desc">${card.text}</div><div class="vc-hint">Click to discard</div>`;
      el.onclick = () => discardCard(i);
      cardRow.appendChild(el);
    });
    c.appendChild(cardRow);
    return;
  }
  if(!state.waitingForAlly) {
    const cb = state.combat;
    const aliveE = aliveEnemyList(cb);
    if (aliveE.length > 0) {
      const preview = document.createElement("div"); preview.style.cssText="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:6px;";
      preview.innerHTML = `<div style="color:#cc8888;font-weight:600;margin-bottom:3px">Enemy Intent Preview</div>` +
        aliveE.map(([,e]) => {
          const il = intentLbl(e.intent);
          return `<div style="color:#eeddcc;padding:1px 0">${e.name} — ${il}</div>`;
        }).join("");
      c.appendChild(preview);
    }
    c.appendChild(btn("🎲 Start Turn", "primary", startCombatRound));
    const info = document.createElement("div"); info.style.cssText="font-size:10px;color:#8a9bb0;padding:2px 0;";
    info.textContent = `Turn ${cb.roundNumber} │ Hand ${cb.hand.length} │ Draw Pile ${cb.drawPile.length}`;
    c.appendChild(info);
    return;
  }
  const cb = state.combat;
  if (!cb.hand.length) { c.appendChild(btn("Pass (No cards)", "", () => allyPass())); return; }
  const cardRow = document.createElement("div"); cardRow.className = "card-hand-row";
  cb.hand.forEach((cid, i) => {
    const card = CARD_LIBRARY[cid];
    const isDrag = card.needsTarget;
    const el = document.createElement("div");
    el.className = "visual-card" + (isDrag ? " drag-card" : " self-card");
    const typeColor = card.type === "attack" ? "#ff8866" : "#66ccff";
    const typeLabel = card.type === "attack" ? "Attack" : "Skill";
    el.innerHTML = `
      <div class="vc-cost" title="Stress +${card.cost}">💀${card.cost}</div>
      <div class="vc-name">${card.name}</div>
      <div class="vc-type" style="color:${typeColor}">${typeLabel}</div>
      <div class="vc-desc">${card.text}</div>
      <div class="vc-hint">${isDrag ? "▷ Drag" : "▷ Click"}</div>
    `;
    if (isDrag) { el.addEventListener("pointerdown", (e) => onCardDragStart(e, i)); }
    else { el.onclick = () => playAllyCard(i, -1); }
    cardRow.appendChild(el);
  });
  const combatRow = document.createElement("div");
  combatRow.style.cssText = "display:flex;align-items:flex-start;gap:8px;width:100%;";
  combatRow.appendChild(cardRow);
  const sideCol = document.createElement("div");
  sideCol.style.cssText = "display:flex;flex-direction:column;gap:0px;position:absolute;top:20px;right:6px;";
  const passBtn = imgBtn("../assets/ui/pixel/buttons/pass_turn.png", allyPass);
  passBtn.querySelector("img").style.cssText = "height:auto;width:80px;";
  passBtn.style.padding = "0";
  sideCol.appendChild(passBtn);
  const deckBtn = imgBtn("../assets/ui/pixel/buttons/deck_details.png", () => showDeckView());
  deckBtn.querySelector("img").style.cssText = "height:auto;width:80px;";
  deckBtn.style.padding = "0";
  sideCol.appendChild(deckBtn);
  combatRow.appendChild(sideCol);
  c.appendChild(combatRow);
}

function renderEventAct(c) {
  const v=state.eventContext?.variant; if(!v) return;
  const wrap = document.createElement("div");
  wrap.className = "event-choice-wrap";
  const grid = document.createElement("div");
  grid.className = "event-choice-grid";
  v.options.forEach(o => {
    const seen = o.id ? isEventSeen(o.id) : true;
    const displayLabel = seen ? o.label : (o.hint || "???");
    const b = document.createElement("button");
    b.className = "event-choice-btn";
    b.textContent = displayLabel;
    b.onclick = () => {
      if (o.id) markEventSeen(o.id);
      o.apply(state);
      completeNode(state.eventContext.node);
    };
    grid.appendChild(b);
  });
  wrap.appendChild(grid);
  c.appendChild(wrap);
}
function renderRewardAct(c) {
  const wrap=document.createElement("div");wrap.className="event-choice-wrap";
  const grid=document.createElement("div");grid.className="event-choice-grid";
  state.rewardChoices.forEach(cid=>{const card=CARD_LIBRARY[cid];const b=document.createElement("button");b.className="event-choice-btn";b.textContent=`${card.name} — ${card.text}`;b.onclick=()=>{state.pendingRewardCard=cid;state.phase=PHASE.BATTLE_REWARD_ASSIGN;renderAll();};grid.appendChild(b);});
  const skip=document.createElement("button");skip.className="event-choice-btn";skip.textContent="Skip (Gold +10)";skip.onclick=()=>{state.run.gold+=10;logLine(state,"Gold +10");completeNode(state.combat.node);};grid.appendChild(skip);
  wrap.appendChild(grid);c.appendChild(wrap);
}
function renderAssignAct(c) {
  const cid=state.pendingRewardCard;if(!cid)return;const card=CARD_LIBRARY[cid];
  const el=aliveParty(state).filter(m=>m.deck.length<MAX_DECK_SIZE);
  if(!el.length){logLine(state,"Deck full.");state.run.gold+=10;state.pendingRewardCard=null;completeNode(state.combat.node);return;}
  const wrap=document.createElement("div");wrap.className="event-choice-wrap";
  const grid=document.createElement("div");grid.className="event-choice-grid";
  el.forEach(m=>{const b=document.createElement("button");b.className="event-choice-btn";b.textContent=`${m.name} (${m.deck.length}/${MAX_DECK_SIZE})`;b.onclick=()=>{m.deck.push(cid);state.run.gold+=10;logLine(state,`${m.name}: ${card.name} added.`);state.pendingRewardCard=null;completeNode(state.combat.node);};grid.appendChild(b);});
  const cancel=document.createElement("button");cancel.className="event-choice-btn";cancel.textContent="Cancel";cancel.onclick=()=>{state.phase=PHASE.BATTLE_REWARD;renderAll();};grid.appendChild(cancel);
  wrap.appendChild(grid);c.appendChild(wrap);
}
function renderFloorAct(c) {
  const wrap=document.createElement("div");wrap.className="event-choice-wrap";
  const grid=document.createElement("div");grid.className="event-choice-grid";
  [{t:"Remove Card",fn:()=>{state.phase=PHASE.FLOOR_REWARD_PICK;renderAll();}},{t:"Attack +1",fn:()=>{state.run.attackBonus+=1;logLine(state,"Attack +1.");proceedFloor();}},{t:"Rest: HP+12, Stress-15",fn:()=>{aliveParty(state).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+12);reduceStress(m,15)});logLine(state,"Rested.");proceedFloor();}}].forEach(({t,fn})=>{const b=document.createElement("button");b.className="event-choice-btn";b.textContent=t;b.onclick=fn;grid.appendChild(b);});
  wrap.appendChild(grid);c.appendChild(wrap);
}
function renderFloorPickAct(c) {
  const ms=aliveParty(state).filter(m=>m.deck.length>0);
  if(!ms.length){logLine(state,"No cards.");proceedFloor();return;}
  const wrap=document.createElement("div");wrap.className="event-choice-wrap";
  const grid=document.createElement("div");grid.className="event-choice-grid";
  ms.forEach(m=>{const b=document.createElement("button");b.className="event-choice-btn";b.textContent=`${m.name} (${m.deck.length})`;b.onclick=()=>{state.removeMember=m;state.phase=PHASE.FLOOR_REWARD_REMOVE;renderAll();};grid.appendChild(b);});
  const cancel=document.createElement("button");cancel.className="event-choice-btn";cancel.textContent="Cancel";cancel.onclick=()=>{state.phase=PHASE.FLOOR_REWARD;renderAll();};grid.appendChild(cancel);
  wrap.appendChild(grid);c.appendChild(wrap);
}
function renderFloorRemoveAct(c) {
  const m=state.removeMember;if(!m)return;
  const unique=[...new Set(m.deck)].sort((a,b)=>CARD_LIBRARY[a].name.localeCompare(CARD_LIBRARY[b].name,"en"));
  const wrap=document.createElement("div");wrap.className="event-choice-wrap";
  const grid=document.createElement("div");grid.className="event-choice-grid";
  unique.forEach(cid=>{const cnt=m.deck.filter(x=>x===cid).length;const b=document.createElement("button");b.className="event-choice-btn";b.textContent=`${CARD_LIBRARY[cid].name} x${cnt}`;b.onclick=()=>{const idx=m.deck.indexOf(cid);if(idx>=0)m.deck.splice(idx,1);logLine(state,`${m.name}: removed.`);proceedFloor();};grid.appendChild(b);});
  const cancel=document.createElement("button");cancel.className="event-choice-btn";cancel.textContent="Cancel";cancel.onclick=()=>{state.phase=PHASE.FLOOR_REWARD_PICK;renderAll();};grid.appendChild(cancel);
  wrap.appendChild(grid);c.appendChild(wrap);
}
function renderLogs() { logPanel.innerHTML=""; }
function btn(l,cls,fn,dis=false){const b=document.createElement("button");b.innerHTML=l;if(cls)b.classList.add(cls);b.disabled=dis;b.onclick=fn;return b;}

/* ── Game Logic ──────────────────────────────── */
function startNewRun() {
  state.run={floor:1,party:PARTY_TEMPLATES.map(createMember),gold:0,consumedFoodCount:0,attackBonus:0,memoryFragments:0,discoveredPersistent:loadPersistent(),discoveredRun:new Set(),runIndex:Date.now(),collapsedNames:[]};
  state.logs=[];state.turnOrder=[];state.currentActionIdx=0;state.waitingForAlly=false;state.actingMember=null;state.discarding=false;
  loadFloor(1);
}
const FLOOR_GRID_SIZE = { 1:3, 2:4, 3:5, 4:5, 5:6 };
const BATTLE_NAMES=["Rush Battle","Ambush Battle","Cleanup Skirmish","Blockade Break","Engagement","Iron Gate Breach"];
const EVENT_NAMES_MAP=["Forbidden Altar","Memory Well","Shadow Market","Silent Corridor","Wish Offer"];
const NODE_VISIT_KEY = "tartaros_node_visits";

function loadNodeVisits(){ try{const r=localStorage.getItem(NODE_VISIT_KEY);return r?JSON.parse(r):{};} catch{return {};} }
function saveNodeVisit(nodeId, info){ const v=loadNodeVisits(); v[nodeId]=info; localStorage.setItem(NODE_VISIT_KEY,JSON.stringify(v)); }
function getNodeVisitInfo(nodeId){ return loadNodeVisits()[nodeId]||null; }

function loadFloor(fn){
  state.run.floor=fn; state.floor=genFloor(fn);
  state.phase=PHASE.MAP; state.combat=null; state.eventContext=null;
  state.rewardChoices=[]; state.pendingRewardCard=null;
  state.turnOrder=[]; state.waitingForAlly=false; renderAll();
}

function genFloor(fn){
  const size=FLOOR_GRID_SIZE[fn]||3;
  const total=size*size;
  const bossCount=1, eventRatio=0.35;
  const eventCount=Math.floor((total-1)*eventRatio);
  const battleCount=total-1-eventCount;

  const types=[];
  for(let i=0;i<battleCount;i++) types.push("battle");
  for(let i=0;i<eventCount;i++) types.push("choice");
  shuffle(types);

  const grid=[];
  let bossR, bossC;
  if(fn===1){ bossR=size-1; bossC=0; }
  else {
    do { bossR=randomInt(0,size-1); bossC=randomInt(0,size-1); }
    while(bossR===0&&bossC===size-1);
  }

  let ti=0;
  for(let r=0;r<size;r++){
    const row=[];
    for(let c=0;c<size;c++){
      if(r===bossR&&c===bossC){
        row.push({id:`f${fn}-${r}-${c}`,floor:fn,row:r,col:c,type:"boss",
          title:`${BOSS_NAMES[fn-1]} Chamber`,enemyCount:1});
      } else {
        const t=types[ti++]||"battle";
        const ec=t==="battle"?randomInt(1,3):0;
        row.push({id:`f${fn}-${r}-${c}`,floor:fn,row:r,col:c,type:t,
          title:t==="battle"?BATTLE_NAMES[(r+c)%BATTLE_NAMES.length]:EVENT_NAMES_MAP[(r+c)%EVENT_NAMES_MAP.length],
          enemyCount:ec});
      }
    }
    grid.push(row);
  }

  return {
    floor:fn, size, grid,
    currentPos:{row:0,col:size-1},
    completedNodeIds:new Set(),
    visitedNodeIds:new Set([`f${fn}-0-${size-1}`]),
  };
}

function getAdj(fl){
  if(!fl)return[];
  const{row,col}=fl.currentPos, s=fl.size, result=[];
  const dirs=[[0,1],[0,-1],[1,0],[-1,0]];
  for(const[dr,dc] of dirs){
    const nr=row+dr, nc=col+dc;
    if(nr>=0&&nr<s&&nc>=0&&nc<s){
      const nd=fl.grid[nr][nc];
      if(!fl.completedNodeIds.has(nd.id)) result.push(nd);
    }
  }
  return result;
}

function selectNode(nd){
  if(!state.floor)return;
  const adj=new Set(getAdj(state.floor).map(n=>n.id));
  if(!adj.has(nd.id))return;

  state.floor.currentPos={row:nd.row,col:nd.col};
  state.floor.visitedNodeIds.add(nd.id);
  markDisc(nd.id);

  const visitInfo={type:nd.type,title:nd.title,enemyCount:nd.enemyCount||0};
  saveNodeVisit(nd.id, visitInfo);

  if(nd.type==="battle") startCombat(nd,false);
  else if(nd.type==="choice") startEvent(nd);
  else if(nd.type==="boss") playCutscene(`boss_intro_floor_${state.run.floor}`,()=>startCombat(nd,true));
}
function startEvent(nd){state.phase=PHASE.EVENT;state.eventContext={node:nd,variant:EVENT_VARIANTS[randomInt(0,EVENT_VARIANTS.length-1)]};logLine(state,`Choice: ${nd.title}`);renderAll();}

function startCombat(nd,isBoss) {
  const run=state.run; let enemies;
  if(isBoss){enemies=[createBoss(run.floor)];aliveParty(state).forEach(m=>addStress(state,m,3));}
  else enemies=createEnemyGroup(run.floor);
  const combined=[];aliveParty(state).forEach(m=>combined.push(...[...m.deck]));shuffleArr(combined);
  state.combat={node:nd,isBoss,enemies,drawPile:combined,spentPile:[],hand:[],roundNumber:1};
  state.phase=PHASE.COMBAT;state.turnOrder=[];state.currentActionIdx=0;state.waitingForAlly=false;state.actingMember=null;
  logLine(state,`${isBoss?"Boss Battle":"Battle"} started (Cards ${combined.length})`);renderAll();
}

/* ── Round-based combat ────────────────────────── */

const DRAW_PER_CHAR = 1;

function startCombatRound() {
  const cb=state.combat, run=state.run; if(!cb)return;
  if(!cb.hand.length&&!cb.drawPile.length){handleFail("All cards exhausted!");return;}

  const finalSpeeds = new Map();
  run.party.forEach((m,i) => { if(isActive(m)) finalSpeeds.set(`ally_${i}`, randomInt(1,6)); });
  cb.enemies.forEach((e,i) => { if(e.hp>0) finalSpeeds.set(`enemy_${i}`, randomInt(1,6)); });

  state.diceRolling = { active: true, startTime: Date.now(), settled: false, finalSpeeds };
  logLine(state, `── Turn ${cb.roundNumber} Dice ──`);
  renderAll();

  setTimeout(() => {
    state.diceRolling.settled = true;
    run.party.forEach((m,i) => { const s = finalSpeeds.get(`ally_${i}`); if(s !== undefined) m.speed = s; });
    cb.enemies.forEach((e,i) => { const s = finalSpeeds.get(`enemy_${i}`); if(s !== undefined) e.speed = s; });
    renderAll();
  }, DICE_ROLL_MS);

  setTimeout(() => {
    state.diceRolling = { active: false, startTime: 0, settled: false, finalSpeeds: null };

    const units = [];
    run.party.forEach((m,i) => { if(isActive(m)) units.push({type:"ally",index:i,speed:m.speed,pos:i}); });
    cb.enemies.forEach((e,i) => { if(e.hp>0) units.push({type:"enemy",index:i,speed:e.speed,pos:100+i}); });
    units.sort((a,b) => b.speed - a.speed || (a.pos - b.pos));

    state.turnOrder = units;
    state.currentActionIdx = 0;
    renderAll();
    processNextAction();
  }, DICE_SETTLE_MS);
}

function processNextAction() {
  const cb=state.combat; if(!cb)return;
  if(state.currentActionIdx>=state.turnOrder.length){endRound();return;}
  const unit=state.turnOrder[state.currentActionIdx];

  if(unit.type==="enemy"){
    const e=cb.enemies[unit.index];
    if(e.hp<=0){state.currentActionIdx++;processNextAction();return;}

    const il=e.intent;
    let preview="";
    if(il.type==="attack"){
      const targets=aliveParty(state);
      preview=`${e.name} ▶ ⚔ Attack ${il.value+e.attackBonus}`;
    } else if(il.type==="defend"){ preview=`${e.name} ▶ 🛡 Defend +${il.value}`;
    } else if(il.type==="buff"){ preview=`${e.name} ▶ ↑ Buff +${il.value}`; }

    state.enemyActing = { enemy: e, preview };
    renderAll();

    setTimeout(()=>{
      state.enemyActing = null;
      applyEnemyIntent(cb,e);
      if(!aliveParty(state).length){handleFail("Party wiped.");return;}
      state.currentActionIdx++;
      renderAll();
      setTimeout(processNextAction, 400);
    }, 2500);
    return;
  }

  const member=state.run.party[unit.index];
  if(!isActive(member)){state.currentActionIdx++;processNextAction();return;}

  if(cb.roundNumber === 1 && cb.hand.length === 0) {
    let n = HAND_SIZE;
    while(n > 0 && cb.hand.length < 10 && cb.drawPile.length) { cb.hand.push(cb.drawPile.pop()); n--; }
  } else if(cb.roundNumber > 1) {
    drawCardsFromPile(cb, DRAW_PER_CHAR);
  }

  if(!cb.hand.length&&!cb.drawPile.length){
    logLine(state, `${member.name}: no cards left, pass.`);
    state.currentActionIdx++;
    const allEmpty = !cb.hand.length && !cb.drawPile.length && aliveParty(state).every(() => true);
    if(allEmpty && state.currentActionIdx >= state.turnOrder.length){handleFail("All cards exhausted!");return;}
    setTimeout(processNextAction, 200);
    return;
  }

  state.actingMember=member;
  if(cb.hand.length > MAX_HAND) {
    state.discarding=true; state.waitingForAlly=false;
    renderAll();
    return;
  }
  state.waitingForAlly=true; state.discarding=false;
  renderAll();
}

function playAllyCard(cardIdx, targetEnemyIdx) {
  if(!state.waitingForAlly||!state.combat)return;
  const cb=state.combat, cid=cb.hand[cardIdx], card=CARD_LIBRARY[cid];
  const member=state.actingMember;
  cb.hand.splice(cardIdx,1); cb.spentPile.push(cid);
  const ectx=makeEffectCtx(state,cb);
  applyCardEffect(cid,ectx,targetEnemyIdx);
  if(member) addStress(state, member, card.cost);
  logLine(state,`▶ ${member?.name||"?"}: ${card.name} (stress +${card.cost})`);

  state.waitingForAlly=false;state.actingMember=null;state.currentActionIdx++;
  if(aliveEnemyList(cb).length===0){handleWin();return;}
  renderAll(); setTimeout(processNextAction,300);
}

function discardCard(cardIdx) {
  if(!state.discarding||!state.combat) return;
  const cb=state.combat, cid=cb.hand[cardIdx], card=CARD_LIBRARY[cid];
  cb.hand.splice(cardIdx,1); cb.spentPile.push(cid);
  logLine(state, `${state.actingMember?.name||"?"}: ${card.name} discarded`);
  if(cb.hand.length <= MAX_HAND) {
    state.discarding=false;
    state.waitingForAlly=true;
  }
  renderAll();
}

function showDeckView() {
  if(!state.combat||!state.actingMember) return;
  const member = state.actingMember;
  const cb = state.combat;
  const deckCards = member.deck.reduce((acc, cid) => { acc[cid]=(acc[cid]||0)+1; return acc; }, {});
  const lines = Object.entries(deckCards).map(([cid,cnt]) => {
    const card = CARD_LIBRARY[cid];
    return `${card.name} x${cnt} (💀${card.cost})`;
  }).join("\n");
  const handCount = cb.hand.length;
  const drawCount = cb.drawPile.length;
  const spentCount = cb.spentPile.length;
  alert(`[${member.name}'s Deck] ${member.deck.length} cards\n${lines}\n\n─── Combat ───\nHand: ${handCount} │ Draw Pile: ${drawCount} │ Spent: ${spentCount}`);
}

function allyPass() {
  if(!state.waitingForAlly)return;
  logLine(state,`${state.actingMember.name}: Pass.`);
  state.waitingForAlly=false;state.actingMember=null;state.currentActionIdx++;
  renderAll(); setTimeout(processNextAction,200);
}

function endRound() {
  const cb=state.combat;if(!cb)return;
  cb.enemies.forEach(e=>{if(e.hp>0&&e.bleed>0){e.hp=Math.max(0,e.hp-e.bleed);logLine(state,`${e.name} Bleed ${e.bleed}`);if(e.hp<=0){logLine(state,`✦ ${e.name} bled out!`);aliveParty(state).forEach(m=>reduceStress(m,3));}}});
  if(aliveEnemyList(cb).length===0){handleWin();return;}
  cb.enemies.forEach(e=>{if(e.hp>0){e.block=0;advanceIntent(e);}});
  const alive=aliveParty(state);if(alive.length)addStress(state,alive[randomInt(0,alive.length-1)],1);
  cb.roundNumber++;state.turnOrder=[];state.waitingForAlly=false;state.actingMember=null;
  renderAll();
}

function applyEnemyIntent(cb,e) {
  const alive=aliveParty(state);if(!alive.length)return;
  if(e.intent.type==="attack"){const tgt=alive[randomInt(0,alive.length-1)];const inc=e.intent.value+e.attackBonus;const blk=Math.min(tgt.block,inc),act=inc-blk;tgt.block=Math.max(0,tgt.block-blk);tgt.hp=Math.max(0,tgt.hp-act);logLine(state,`${e.name}->${tgt.name} ${inc}${blk?` (block ${blk})`:""}`);if(act>0)addStress(state,tgt,3);if(tgt.hp<=0){logLine(state,`✖ ${tgt.name} down!`);aliveParty(state).forEach(m=>addStress(state,m,10));}}
  else if(e.intent.type==="defend"){e.block+=e.intent.value;logLine(state,`${e.name} Block +${e.intent.value}`);}
  else if(e.intent.type==="buff"){e.attackBonus+=e.intent.value;logLine(state,`${e.name} Buff +${e.intent.value}`);}
}
function advanceIntent(e){e.intentIndex=(e.intentIndex+1)%e.pattern.length;e.intent=e.pattern[e.intentIndex];}

function handleWin(){const cb=state.combat;if(!cb)return;if(cb.isBoss){logLine(state,`★ ${cb.enemies[0].name} defeated!`);playCutscene(`boss_defeat_floor_${state.run.floor}`,()=>{state.floor.completedNodeIds.add(state.floor.bossNode.id);if(state.run.floor===5){const et=evalEnd(true);playCutscene(endSceneId(et),()=>moveEnd(et));}else{state.phase=PHASE.FLOOR_REWARD;state.combat=null;renderAll();}});return;}state.phase=PHASE.BATTLE_REWARD;state.rewardChoices=uniqueSample(CARD_REWARD_POOL,3);renderAll();}
function completeNode(nd){if(!nd||!state.floor)return;state.floor.completedNodeIds.add(nd.id);state.phase=PHASE.MAP;state.combat=null;state.eventContext=null;state.rewardChoices=[];state.pendingRewardCard=null;state.turnOrder=[];state.waitingForAlly=false;renderAll();}
function proceedFloor(){if(state.run.floor>=5)return;const n=state.run.floor+1;logLine(state,`${state.run.floor}Floor→${n}Floor`);loadFloor(n);}
function evalEnd(c){if(!c||!aliveParty(state).length)return"ENDING_FAIL";if(state.run.collapsedNames.length)return"ENDING_FAIL";if(state.run.consumedFoodCount===0)return"ENDING_TRUE";return"ENDING_LOOP";}
function endSceneId(et){return et==="ENDING_TRUE"?"ending_true_cutscene":et==="ENDING_LOOP"?"ending_loop_cutscene":"ending_fail_cutscene";}
function moveEnd(et){state.phase=PHASE.ENDING;state.combat=null;state.turnOrder=[];state.waitingForAlly=false;logLine(state,et==="ENDING_TRUE"?"True Ending!":et==="ENDING_LOOP"?"Looped.":"Failed.");renderAll();}
function handleFail(r){logLine(state,r);const et=evalEnd(false);playCutscene(endSceneId(et),()=>moveEnd(et));}

/* ── Cutscenes ───────────────────────────────── */
function playCutscene(id,onEnd){const sc=CUTSCENES[id];if(!sc){onEnd?.();return;}state.phase=PHASE.CUTSCENE;state.activeScene=sc;state.activeSceneIndex=0;state.activeSceneOnEnd=onEnd||null;state.eventContext=null;state.combat=null;renderAll();}
function nextFrame(){if(!state.activeScene)return;state.activeSceneIndex++;if(state.activeSceneIndex>=state.activeScene.frames.length)finishScene();else renderAll();}
function skipScene(){finishScene();}
function finishScene(){const cb=state.activeSceneOnEnd;state.activeScene=null;state.activeSceneIndex=0;state.activeSceneOnEnd=null;if(cb)cb();else{state.phase=PHASE.MAP;renderAll();}}

/* ══════════════════════════════════════════════════
   Canvas Drawing — 960×540 (16:9)
   ══════════════════════════════════════════════════ */

function drawScene(){const run=state.run;const fc=run?FLOOR_COLORS[run.floor-1]:[30,34,42];const g=ctx.createLinearGradient(0,0,960,540);g.addColorStop(0,`rgb(${fc[0]-18},${fc[1]-16},${fc[2]-18})`);g.addColorStop(1,`rgb(${fc[0]},${fc[1]},${fc[2]})`);ctx.fillStyle=g;ctx.fillRect(0,0,960,540);drawGrid();const fn={[PHASE.TITLE]:drawTitle,["SETTINGS"]:drawTitle,[PHASE.MAP]:drawMap,[PHASE.COMBAT]:drawCombat,[PHASE.BATTLE_REWARD]:drawCombat,[PHASE.BATTLE_REWARD_ASSIGN]:drawCombat,[PHASE.EVENT]:drawEvent,[PHASE.FLOOR_REWARD]:drawFloorRw,[PHASE.FLOOR_REWARD_PICK]:drawFloorRw,[PHASE.FLOOR_REWARD_REMOVE]:drawFloorRw,[PHASE.CUTSCENE]:drawCutscene,[PHASE.ENDING]:drawEnding}[state.phase];if(fn)fn();}
function drawGrid(){ctx.save();ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;for(let x=0;x<960;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}ctx.restore();}
const titleLogo = new Image();
titleLogo.src = "../assets/ui/pixel/titles/title-faded-dungen-v10.png";

const bgEndTrue = loadImg("../ending/bg-ending-true.png");
const bgEndFail = loadImg("../ending/bg-ending-fail.png");
const bgEndStress = loadImg("../ending/bg-ending-stress.png");
function drawTitle(){
  drawBg(bgGameStart);
  if(titleLogo.complete&&titleLogo.naturalWidth>0){
    const lw=440,lh=lw*(titleLogo.naturalHeight/titleLogo.naturalWidth);
    ctx.drawImage(titleLogo,480-lw/2,80,lw,lh);
  }
}

function drawMap(){
  if(!state.floor||!state.run) return;
  drawBg(bgMap);
  const fl=state.floor, s=fl.size;
  const adjIds=new Set(getAdj(fl).map(n=>n.id));
  const disc=state.run.discoveredPersistent, discR=state.run.discoveredRun;

  drawText(`${state.run.floor}Floor — ${FLOOR_NAMES[state.run.floor-1]}`,480,32,22,"#f5f9ff","center");

  const gridArea=Math.min(420, 480);
  const cellSize=Math.floor(gridArea/s);
  const ox=480-cellSize*s/2, oy=60;
  const nodeR=Math.max(10, Math.min(16, Math.floor(cellSize*0.32)));

  for(let r=0;r<s;r++){
    for(let c=0;c<s;c++){
      const nd=fl.grid[r][c];
      const cx=ox+c*cellSize+cellSize/2, cy=oy+r*cellSize+cellSize/2;

      if(c<s-1) drawLine(cx+nodeR,cy,cx+cellSize-nodeR,cy,"rgba(255,255,255,0.08)",1);
      if(r<s-1) drawLine(cx,cy+nodeR,cx,cy+cellSize-nodeR,"rgba(255,255,255,0.08)",1);

      const isCur=fl.currentPos.row===r&&fl.currentPos.col===c;
      const isAdj=adjIds.has(nd.id);
      const done=fl.completedNodeIds.has(nd.id);
      const visited=fl.visitedNodeIds.has(nd.id);
      const prevInfo=getNodeVisitInfo(nd.id);
      const revealed=visited||!!prevInfo||isAdj;

      let color;
      if(isCur) color="#ffc857";
      else if(done) color="#50c878";
      else if(isAdj) color="#88bbdd";
      else if(prevInfo) color="#6890b0";
      else if(visited) color="#556677";
      else color="#2a3646";

      drawCircle(cx,cy,nodeR,color);

      if(isCur){
        ctx.strokeStyle="#ffc857";ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(cx,cy,nodeR+3,0,Math.PI*2);ctx.stroke();
      }

      if(nd.type==="boss"){
        drawText("BOSS",cx,cy+1,nodeR>12?10:8,"#ffdede","center");
      } else if(revealed){
        const icon=nd.type==="battle"?"⚔":"◈";
        drawText(icon,cx,cy+1,nodeR>12?12:9,"#fff","center");
        if(prevInfo&&prevInfo.enemyCount&&nd.type==="battle"){
          drawText(`${prevInfo.enemyCount}`,cx+nodeR-2,cy-nodeR+4,8,"#ff8888","center");
        }
      } else {
        drawText("?",cx,cy+1,nodeR>12?11:8,"#6a7888","center");
      }
    }
  }

  const legend=`Current=Yellow | Cleared=Green | Adjacent=Sky | Memory=Blue | Unknown=Gray`;
  drawText(legend,480,oy+s*cellSize+16,10,"#6a7888","center");
}

function drawCombat(){
  const run=state.run,cb=state.combat;if(!run)return;
  drawBg(getCombatBg());
  const charW=150, charH=280, charGap=-10, partyStartX=10;
  run.party.forEach((m,i)=>{
    const cx=partyStartX+i*(charW+charGap), cy=450;
    const act=isActive(m), isActing=state.actingMember===m;
    const alpha=act?1.0:0.3;

    ctx.save(); ctx.globalAlpha=alpha;
    const spr=charSprites[m.name]||charSprites.Arke;
    if(spr.img.complete&&spr.img.naturalWidth>0){
      const frameIdx=spr.seq[spriteFrame%spr.seq.length];
      const sx=frameIdx*spr.fw, sy=0;
      const ratio=spr.fw/spr.fh;
      const drawH=charH*(spr.scale||1);
      const drawW=drawH*ratio;
      const drawX=cx+(charW-drawW)/2;
      const yOff=spr.yOffset||0;
      ctx.drawImage(spr.img,sx,sy,spr.fw,spr.fh,drawX,cy-drawH+yOff,drawW,drawH);
    } else {
      drawPanel(cx,cy-charH,charW,charH,`rgba(12,22,40,0.7)`);
    }
    ctx.restore();

    if(isActing){
      ctx.strokeStyle="#ffc857";ctx.lineWidth=2;
      ctx.strokeRect(cx-2,cy-charH-2,charW+4,charH+4);
    }

    drawText(m.name,cx+charW/2,cy-charH-8,10,act?"#ffc857":"#556677","center");

    if(state.diceRolling.active&&act){
      const key=`ally_${i}`,fs=state.diceRolling.finalSpeeds;
      if(state.diceRolling.settled) drawText(`🎲${fs.get(key)}`,cx+charW/2,cy-charH-18,11,"#ffc857","center");
      else drawText(`🎲${randomInt(1,6)}`,cx+charW/2,cy-charH-18,11,"rgba(255,255,255,0.6)","center");
    } else if(act&&m.speed>0) {
      drawText(`SPD ${m.speed}`,cx+charW/2,cy-charH-18,9,"#88aacc","center");
    }

    const barW=charW, barH=Math.round(charW/2.7), barX=cx, barY=cy+4;
    const hpPct=m.maxHp>0?m.hp/m.maxHp:0;
    const hpColor=hpPct>0.5?"#50c878":hpPct>0.25?"#e6b84d":"#ff4d4d";
    const padX=Math.round(barW*0.08), padY=Math.round(barH*0.35);
    const fillX=barX+padX, fillY=barY+padY, fillMaxW=barW-padX*2, fillH=barH-padY*2;
    ctx.fillStyle="rgba(20,10,10,0.8)";
    ctx.beginPath();ctx.roundRect(fillX,fillY,fillMaxW,fillH,2);ctx.fill();
    ctx.fillStyle=hpColor;
    if(fillMaxW*hpPct>0){ctx.beginPath();ctx.roundRect(fillX,fillY,fillMaxW*hpPct,fillH,2);ctx.fill();}
    if(hpBarFrame.complete&&hpBarFrame.naturalWidth>0){
      ctx.drawImage(hpBarFrame,barX,barY,barW,barH);
    }
    drawText(`${m.hp}/${m.maxHp}`,cx+charW/2,barY+barH/2,9,"#fff","center");

    if(m.block>0) drawText(`🛡${m.block}`,cx+charW+4,cy-10,9,"#5da4e6","left");
    if(!act) drawText(m.stress>STRESS_LIMIT?"💀":"☠",cx+charW/2,cy-charH/2,24,"#ff6666","center");
  });

  if(cb){cb.enemies.forEach((e,i)=>{const x=620,y=120+i*100,alive=e.hp>0;const hl=highlightedEnemy===i;
    drawPanel(x,y,280,85,hl?"rgba(120,40,40,0.9)":`rgba(40,16,18,${alive?0.72:0.25})`);
    if(hl){ctx.strokeStyle="#ff6b6b";ctx.lineWidth=2;ctx.strokeRect(x,y,280,85);}
    drawText(e.name,x+10,y+18,15,alive?"#ffb7b7":"#776666","left");
    if(state.diceRolling.active && alive) {
      const key=`enemy_${i}`, fs=state.diceRolling.finalSpeeds;
      if(state.diceRolling.settled) { drawText(`🎲 ${fs.get(key)}`,x+210,y+18,14,"#ffc857","left"); }
      else { drawText(`🎲 ${randomInt(1,6)}`,x+210,y+18,14,"rgba(255,255,255,0.6)","left"); }
    } else if(e.speed>0) { drawText(`SPD ${e.speed}`,x+210,y+18,11,"#cc8888","left"); }
    const hp=e.maxHp>0?e.hp/e.maxHp:0;drawBarBg(x+10,y+36,160,8);drawBarFill(x+10,y+36,160*hp,8,hp>0.5?"#e08888":"#ff4444");drawText(`${e.hp}/${e.maxHp}`,x+178,y+40,11,"#f0dede","left");
    if(alive)drawText(`Intent: ${intentLbl(e.intent)}`,x+10,y+56,12,"#eeddcc","left");else drawText("Defeated",x+10,y+56,12,"#884444","left");
    if(e.bleed>0)drawText(`🩸${e.bleed}`,x+10,y+72,10,"#cc6666","left");});
    drawText("VS",480,240,36,"rgba(255,255,255,0.1)","center");


    if(state.enemyActing){
      drawPanel(200,16,560,44,"rgba(60,20,20,0.92)");
      drawText(state.enemyActing.preview,480,38,18,"#ff9988","center");
    }}
}

function drawEvent(){if(!state.eventContext)return;const evIdx=EVENT_VARIANTS.indexOf(state.eventContext.variant);drawBg(bgEvent[evIdx>=0?evIdx%bgEvent.length:0]);const v=state.eventContext.variant;drawPanel(180,120,600,200,"rgba(14,29,33,0.75)");drawText(v.title,210,170,30,"#89f6d9","left");drawText(v.text,210,220,18,"#e0f0ff","left");}
function drawFloorRw(){drawBg(bgFloorBoss[state.run?.floor]||bgFloorBoss[1]);drawPanel(220,140,520,200,"rgba(39,28,12,0.76)");drawText(`Floor ${state.run.floor} Cleared`,480,200,34,"#f6cd89","center");drawText("Choose Reward",480,260,18,"#e8e0d0","center");}
function drawCutscene(){const sc=state.activeScene;if(!sc)return;const fr=sc.frames[Math.min(state.activeSceneIndex,sc.frames.length-1)];const[r,g2,b]=fr.color;ctx.fillStyle=`rgba(${r},${g2},${b},0.3)`;ctx.fillRect(0,0,960,540);drawPanel(80,100,800,180,"rgba(0,0,0,0.5)");drawPanel(80,310,800,120,"rgba(0,0,0,0.6)");drawText(sc.title,110,150,28,"#f8eac1","left");drawText(fr.headline,110,200,22,"#ffffff","left");drawText(fr.line,110,370,20,"#f4f7fb","left");}
function drawEnding(){
  const et=evalEnd(state.run.floor>=5&&aliveParty(state).length>0);
  if(et==="ENDING_TRUE") drawBg(bgEndTrue);
  else if(state.run.collapsedNames.length>0) drawBg(bgEndStress);
  else drawBg(bgEndFail);
  const t=et==="ENDING_TRUE"?"True Ending":et==="ENDING_LOOP"?"Normal Ending":"Failure Ending";
  const tc=et==="ENDING_TRUE"?"#50c878":et==="ENDING_LOOP"?"#f6d18d":"#ff6b6b";
  drawPanel(200,80,560,380,"rgba(10,14,25,0.65)");
  drawText(t,480,140,36,tc,"center");
  drawText(`Binding: ${state.run.consumedFoodCount}`,480,210,20,"#e0e8f0","center");
  drawText(`Gold: ${state.run.gold}`,480,245,20,"#e0e8f0","center");
  let y=300;state.run.party.forEach(m=>{const st=isActive(m)?"Active":m.stress>STRESS_LIMIT?"Collapsed":"Dead";
    drawText(`${m.name}: HP ${m.hp}/${m.maxHp} ST ${m.stress} [${st}]`,480,y,13,isActive(m)?"#88ccaa":"#cc6666","center");y+=20;});
}

/* ── Draw primitives ─────────────────────────── */
function drawText(t,x,y,s,c,a="left"){ctx.fillStyle=c;ctx.font=`${s}px Pretendard,Apple SD Gothic Neo,sans-serif`;ctx.textAlign=a;ctx.textBaseline="middle";ctx.fillText(t,x,y);}
function drawPanel(x,y,w,h,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();ctx.strokeStyle="rgba(255,255,255,0.12)";ctx.lineWidth=1;ctx.stroke();}
function drawCircle(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(255,255,255,0.3)";ctx.lineWidth=1.2;ctx.stroke();}
function drawLine(x1,y1,x2,y2,c,w){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function drawBarBg(x,y,w,h){ctx.fillStyle="rgba(255,255,255,0.08)";ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();}
function drawBarFill(x,y,w,h,c){if(w<=0)return;ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,Math.max(w,h),h,h/2);ctx.fill();}
function intentLbl(i){if(!i)return"-";if(i.type==="attack")return`⚔${i.value}`;if(i.type==="defend")return`🛡${i.value}`;if(i.type==="buff")return`↑+${i.value}`;return i.type;}

/* ── Persistence ─────────────────────────────── */
function markDisc(nid){state.run.discoveredRun.add(nid);state.run.discoveredPersistent.add(nid);savePersistent(state.run.discoveredPersistent);}
function loadPersistent(){try{const r=localStorage.getItem(STORAGE_KEY);if(!r)return new Set();const p=JSON.parse(r);return Array.isArray(p)?new Set(p.filter(s=>typeof s==="string")):new Set();}catch{return new Set();}}
function savePersistent(s){localStorage.setItem(STORAGE_KEY,JSON.stringify([...s]));}
function logLine(s,l){s.logs.push(`[${new Date().toLocaleTimeString()}] ${l}`);renderLogs();}

/* ── Utility ─────────────────────────────────── */
function uniqueSample(a,n){const p=shuffle([...a]),r=[];for(const i of p){if(!r.includes(i))r.push(i);if(r.length>=n)break;}return r;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shuffleArr(a){shuffle(a);}
function randomInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}

function buildCutscenes(){
  const sc={};
  for(let fl=1;fl<=5;fl++){
    const c=FLOOR_COLORS[fl-1];
    sc[`boss_intro_floor_${fl}`]={
      title:`Floor ${fl} Boss Entry`,
      frames:[
        {headline:`${BOSS_NAMES[fl-1]} Appears`,line:`The gate of Floor ${fl} opens.`,color:c},
        {headline:"Prepare for Final Battle",line:"Steady your breath.",color:c},
        {headline:"Battle Start",line:"The boss reveals intent.",color:c},
      ],
    };
    sc[`boss_defeat_floor_${fl}`]={
      title:`Floor ${fl} Cleared`,
      frames:[
        {headline:`${BOSS_NAMES[fl-1]} Collapsed`,line:"The path opens.",color:c},
        {headline:"Spoils",line:"You find a clue.",color:c},
      ],
    };
  }
  sc.ending_loop_cutscene={
    title:"Normal Clear",
    frames:[
      {headline:"The Gate Opened",line:"The binding sigil drags you back.",color:[84,77,52]},
      {headline:"Fall",line:"Back to the cell.",color:[48,55,74]},
    ],
  };
  sc.ending_true_cutscene={
    title:"True Ending",
    frames:[
      {headline:"Unbound",line:"The fasting vow takes effect.",color:[93,130,94]},
      {headline:"Escape to the Surface",line:"You breathe the dawn air.",color:[124,150,110]},
      {headline:"Epilogue",line:"The loop is over.",color:[148,164,127]},
    ],
  };
  sc.ending_fail_cutscene={
    title:"Failure",
    frames:[
      {headline:"Will Collapsed",line:"Erased.",color:[114,54,58]},
      {headline:"Reboot",line:"Brand reset.",color:[62,47,74]},
    ],
  };
  return sc;
}
