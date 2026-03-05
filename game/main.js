/* ══════════════════════════════════════════════════════
   TARTAROS: Oath of Hunger — Web Prototype
   속도 기반 이니셔티브 │ D&D 카드 사용 │ 라운드 전투
   ══════════════════════════════════════════════════════ */

import { CARD_LIBRARY, STARTING_DECKS, MAX_DECK_SIZE, CARD_REWARD_POOL } from "./cards/card-data.js";
import { applyCardEffect } from "./cards/card-effects.js";
import { createEnemyGroup, createBoss, BOSS_NAMES } from "./battle/enemy-factory.js";

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

const FLOOR_NAMES = ["낙인의 감방", "균열의 저장고", "망각의 복도", "심판의 현관", "문지기의 제단"];
const FLOOR_COLORS = [[46,89,142],[102,69,139],[61,116,97],[126,68,74],[124,93,50]];
const PARTY_TEMPLATES = [
  { name: "아르케", role: "전위 수호", maxHp: 48 },
  { name: "리코스", role: "근접 처형", maxHp: 40 },
  { name: "세린",  role: "교란 사제", maxHp: 34 },
];

const EVENT_VARIANTS = [
  { title: "금지된 식탁", text: "붉은 빵의 향이 당신을 유혹한다.", options: [
    { id:"food_eat", hint:"음식을 먹는다", label: "지옥 음식 섭취: HP +10, 귀속 +1, 스트레스 +5", apply(s) { aliveParty(s).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+10);addStress(s,m,5)}); s.run.consumedFoodCount+=1; logLine(s,"귀속 증가."); }},
    { id:"food_fast", hint:"먹지 않는다", label: "금식 유지: 기억 파편 +1", apply(s) { s.run.memoryFragments+=1; logLine(s,"파편 획득."); }},
    { id:"food_altar", hint:"제단에 바친다", label: "제단 헌납: 골드 +30, 귀속 +1, 스트레스 +3", apply(s) { s.run.gold+=30; s.run.consumedFoodCount+=1; aliveParty(s).forEach(m=>addStress(s,m,3)); logLine(s,"금화 획득."); }},
    { id:"food_meditate", hint:"명상한다", label: "명상: HP +5, 스트레스 -10", apply(s) { aliveParty(s).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+5);reduceStress(m,10)}); logLine(s,"회복."); }},
  ]},
  { title: "흑석 거래소", text: "그림자 상인이 귓속말한다.", options: [
    { id:"shop_remove", hint:"골드를 지불한다", label: "골드 20: 카드 제거", apply(s) { if(s.run.gold<20){logLine(s,"골드 부족.");return;} s.run.gold-=20; const t=aliveParty(s).find(m=>m.deck.length>0); if(t){t.deck.shift();logLine(s,`${t.name} 카드 제거.`);} }},
    { id:"shop_steroid", hint:"주사를 맞는다", label: "강화 주사: 공격 +1, 스트레스 +8", apply(s) { s.run.attackBonus+=1; aliveParty(s).forEach(m=>addStress(s,m,8)); logLine(s,"공격+1."); }},
    { id:"shop_contract", hint:"계약을 파기한다", label: "계약 파기: HP -5, 골드 +25", apply(s) { aliveParty(s).forEach(m=>m.hp=Math.max(1,m.hp-5)); s.run.gold+=25; logLine(s,"골드+25."); }},
    { id:"shop_ignore", hint:"무시한다", label: "무시", apply(s) { logLine(s,"지나쳤다."); }},
  ]},
];

const EVENT_MEMORY_KEY = "tartaros_event_memory";
function loadEventMemory() { try { const r=localStorage.getItem(EVENT_MEMORY_KEY); return r?new Set(JSON.parse(r)):new Set(); } catch { return new Set(); } }
function saveEventMemory(set) { localStorage.setItem(EVENT_MEMORY_KEY, JSON.stringify([...set])); }
function markEventSeen(optionId) { const mem=loadEventMemory(); mem.add(optionId); saveEventMemory(mem); }
function isEventSeen(optionId) { return loadEventMemory().has(optionId); }

const CUTSCENES = buildCutscenes();

const combatBg = new Image();
combatBg.src = "../assets/ui/pixel/background/basic_background.png";
const cardFrontImg = new Image();
cardFrontImg.src = "../assets/ui/pixel/deck_ui/card_front.png";
const cardBackImg = new Image();
cardBackImg.src = "../assets/ui/pixel/deck_ui/card_back.png";

/* ── DOM ─────────────────────────────────────── */
const hudPanel = document.getElementById("hudPanel");
const descriptionPanel = document.getElementById("descriptionPanel");
const actionsPanel = document.getElementById("actionsPanel");
const logPanel = document.getElementById("logPanel");
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

function loop() { drawScene(); requestAnimationFrame(loop); }

/* ── Party / Enemy helpers ───────────────────── */
function createMember(tpl) { return { name:tpl.name, role:tpl.role, hp:tpl.maxHp, maxHp:tpl.maxHp, stress:0, block:0, speed:0, deck:[...STARTING_DECKS[tpl.name]] }; }
function isActive(m) { return m.hp>0 && m.stress<=STRESS_LIMIT; }
function aliveParty(s) { return s.run?s.run.party.filter(isActive):[]; }
function aliveEnemyList(combat) { return combat?combat.enemies.map((e,i)=>[i,e]).filter(([,e])=>e.hp>0):[]; }

function addStress(s,m,a) { if(!isActive(m))return; const o=m.stress; m.stress=Math.min(100,m.stress+a); if(o<=STRESS_LIMIT&&m.stress>STRESS_LIMIT)onCollapse(s,m); }
function reduceStress(m,a) { m.stress=Math.max(0,m.stress-a); }
function onCollapse(s,m) { logLine(s,`⚠ ${m.name} 붕괴!`); if(!s.run.collapsedNames.includes(m.name))s.run.collapsedNames.push(m.name); s.run.party.filter(x=>x!==m&&isActive(x)).forEach(x=>addStress(s,x,8)); }

function dmgEnemyFn(combat,s,ti,raw) {
  const e=combat.enemies[ti]; if(!e||e.hp<=0)return;
  const blk=Math.min(e.block,raw),act=raw-blk; e.block=Math.max(0,e.block-blk); e.hp=Math.max(0,e.hp-act);
  logLine(s,`→ ${e.name} 피해 ${act}${blk?` (차단 ${blk})`:""}`);
  if(e.hp<=0){logLine(s,`✦ ${e.name} 처치!`); aliveParty(s).forEach(m=>reduceStress(m,3));}
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

  cardIds.forEach((cid, i) => {
    const card = CARD_LIBRARY[cid];
    const backEl = document.createElement("div");
    backEl.className = "card-draw-item back";
    backEl.style.animationDelay = `${i * 200}ms`;
    overlay.appendChild(backEl);

    setTimeout(() => {
      backEl.style.animation = "cardFadeOut 0.2s ease-in forwards";
      setTimeout(() => {
        backEl.remove();
        const frontEl = document.createElement("div");
        frontEl.className = "card-draw-item front";
        frontEl.innerHTML = `<div class="draw-name">${card.name}</div><div class="draw-text">${card.text}</div>`;
        overlay.appendChild(frontEl);

        setTimeout(() => {
          frontEl.style.animation = "cardFadeOut 0.3s ease-in forwards";
          setTimeout(() => frontEl.remove(), 300);
        }, 600);
      }, 200);
    }, 300 + i * 200);
  });

  setTimeout(() => overlay.remove(), 400 + cardIds.length * 200 + 900);
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
function renderAll() { renderHUD(); renderDesc(); renderActions(); renderLogs(); }

function renderHUD() {
  hudPanel.innerHTML=""; const run=state.run;
  if(!run){addChip(hudPanel,"준비","새 런 시작");return;}
  addChip(hudPanel,"층",`${run.floor}/5`); addChip(hudPanel,"골드",`${run.gold}`);
  addChip(hudPanel,"귀속",`${run.consumedFoodCount}`);
  if(run.attackBonus)addChip(hudPanel,"공보",`+${run.attackBonus}`);
  const sep=document.createElement("div");sep.className="hud-separator";hudPanel.appendChild(sep);
  run.party.forEach(m=>{
    const el=document.createElement("div"); el.className="hud-member"+(isActive(m)?"":" dead");
    const hp=m.maxHp>0?(m.hp/m.maxHp)*100:0, st=Math.min(m.stress,100);
    const hc=hp>50?"#50c878":hp>25?"#e6b84d":"#ff4d4d";
    const sc=st<=30?"#50c878":st<=60?"#e6b84d":st<=STRESS_LIMIT?"#d46ab0":"#ff4d4d";
    const tag=!isActive(m)?(m.stress>STRESS_LIMIT?" [붕괴]":" [사망]"):"";
    el.innerHTML=`<span class="m-name">${m.name}</span><span class="m-role">${m.role}</span>
      <span class="hp-bar"><span class="fill" style="width:${hp}%;background:${hc}"></span></span><span class="hp-num">${m.hp}</span>
      <span class="stress-bar"><span class="fill" style="width:${st}%;background:${sc}"></span></span><span class="stress-num">${m.stress}${tag}</span>
      <span style="color:#8a9bb0;font-size:9px">SPD${m.speed} 덱${m.deck.length}</span>
      ${m.block>0?`<span style="color:#5da4e6;font-size:10px">🛡${m.block}</span>`:""}`;
    hudPanel.appendChild(el);
  });
  if(state.combat){const s2=document.createElement("div");s2.className="hud-separator";hudPanel.appendChild(s2);
    addChip(hudPanel,"턴",`${state.combat.roundNumber}`);addChip(hudPanel,"뽑을패",`${state.combat.drawPile.length}`);addChip(hudPanel,"손패",`${state.combat.hand.length}`);}
}
function addChip(p,l,v){const el=document.createElement("div");el.className="hud-chip";el.innerHTML=`<span class="label">${l}</span><span class="val">${v}</span>`;p.appendChild(el);}

function renderDesc() {
  let msg="";
  if(state.phase===PHASE.COMBAT&&state.discarding&&state.actingMember) msg=`${state.actingMember.name}: 손패 초과! 카드를 버려주세요`;
  else if(state.phase===PHASE.COMBAT&&state.waitingForAlly&&state.actingMember) msg=`${state.actingMember.name}의 차례 (SPD ${state.actingMember.speed}) — 카드 ${DRAW_PER_CHAR}장 드로우 │ 공격: 적에게 드래그 / 방어·버프: 클릭`;
  else if(state.phase===PHASE.TITLE) msg="지옥의 음식을 먹으면 강해지지만, 탈출 자격을 잃는다.";
  else if(state.phase===PHASE.MAP) msg="인접 노드 선택";
  else msg="";
  descriptionPanel.textContent=msg; overlayHint.textContent="";
}

function renderActions() {
  actionsPanel.innerHTML="";
  const head=document.createElement("h3"), row=document.createElement("div"); row.className="action-row";
  const H={
    [PHASE.TITLE]:()=>{head.textContent="시작";row.appendChild(btn("새 런 시작","primary",startNewRun));},
    [PHASE.MAP]:()=>{head.textContent="맵";renderMapAct(row);},
    [PHASE.COMBAT]:()=>{head.textContent=state.discarding?"카드 버리기":state.waitingForAlly?"카드 선택":"전투 진행";renderCombatAct(row);},
    [PHASE.EVENT]:()=>{head.textContent="선택지";renderEventAct(row);},
    [PHASE.BATTLE_REWARD]:()=>{head.textContent="보상";renderRewardAct(row);},
    [PHASE.BATTLE_REWARD_ASSIGN]:()=>{head.textContent="캐릭터 선택";renderAssignAct(row);},
    [PHASE.FLOOR_REWARD]:()=>{head.textContent="층 보상";renderFloorAct(row);},
    [PHASE.FLOOR_REWARD_PICK]:()=>{head.textContent="캐릭터 선택";renderFloorPickAct(row);},
    [PHASE.FLOOR_REWARD_REMOVE]:()=>{head.textContent="카드 제거";renderFloorRemoveAct(row);},
    [PHASE.CUTSCENE]:()=>{head.textContent="컷씬";row.appendChild(btn("다음","primary",nextFrame));row.appendChild(btn("스킵","",skipScene));},
    [PHASE.ENDING]:()=>{head.textContent="결과";row.appendChild(btn("다시 시작","primary",startNewRun));},
  };
  const h=H[state.phase]; if(h)h();
  actionsPanel.appendChild(head); actionsPanel.appendChild(row);
}

function renderMapAct(c) {
  const run=state.run, fl=state.floor, adj=getAdj(fl);
  if(!adj.length){
    c.appendChild(btn("이동 가능한 노드 없음","",()=>{}));
    return;
  }

  const pos=fl.currentPos;
  const info=document.createElement("div");
  info.style.cssText="font-size:11px;color:#8a9bb0;margin-bottom:4px;";
  info.textContent=`현재 위치: (${pos.row},${pos.col}) │ 인접 ${adj.length}개 노드`;
  c.appendChild(info);

  adj.forEach(nd=>{
    let lb,cls;
    const prevVisit=getNodeVisitInfo(nd.id);
    const isRevealed=prevVisit||fl.visitedNodeIds.has(nd.id);

    if(nd.type==="boss"){lb=`★ ${BOSS_NAMES[run.floor-1]} 보스전 (${nd.row},${nd.col})`;cls="danger";}
    else if(isRevealed){
      if(nd.type==="battle"){
        const ec=prevVisit?prevVisit.enemyCount:nd.enemyCount;
        lb=`⚔ ${nd.title} (적 ${ec}마리) [${nd.row},${nd.col}]`;cls="";
      } else {
        lb=`◈ ${nd.title} [${nd.row},${nd.col}]`;cls="skill";
      }
    } else {
      lb=`❓ 미지의 노드 [${nd.row},${nd.col}]`;cls="";
    }
    c.appendChild(btn(lb,cls,()=>selectNode(nd)));
  });

  if(run.floor===5&&adj.some(n=>n.type==="boss")){
    const h=document.createElement("div");h.style.cssText="font-size:11px;padding:4px 0;";
    if(run.collapsedNames.length)h.innerHTML=`<span style="color:#ff4d4d">⚠ 붕괴 → 실패</span>`;
    else if(run.consumedFoodCount)h.innerHTML=`<span style="color:#d46ab0">⚠ 귀속 → 회귀</span>`;
    else h.innerHTML=`<span style="color:#50c878">✦ 진엔딩 가능!</span>`;
    c.appendChild(h);
  }
}

function renderCombatAct(c) {
  if(!state.combat) return;
  if(state.diceRolling.active) {
    const info = document.createElement("div"); info.style.cssText="font-size:13px;color:#ffc857;padding:4px 0;font-weight:600;";
    info.textContent = state.diceRolling.settled ? "속도 확정! 행동 시작..." : "🎲 주사위 굴리는 중...";
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
    info.textContent = `손패 초과! ${excess}장을 버려야 합니다 (${cb.hand.length}/${MAX_HAND})`;
    c.appendChild(info);
    const cardRow = document.createElement("div"); cardRow.className = "card-hand-row";
    cb.hand.forEach((cid, i) => {
      const card = CARD_LIBRARY[cid];
      const el = document.createElement("div");
      el.className = "visual-card self-card";
      el.innerHTML = `<div class="vc-cost">${card.cost}</div><div class="vc-name">${card.name}</div><div class="vc-type" style="color:#ff8866">버리기</div><div class="vc-desc">${card.text}</div><div class="vc-hint">클릭하여 버리기</div>`;
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
      preview.innerHTML = `<div style="color:#cc8888;font-weight:600;margin-bottom:3px">적 행동 예고</div>` +
        aliveE.map(([,e]) => {
          const il = intentLbl(e.intent);
          return `<div style="color:#eeddcc;padding:1px 0">${e.name} — ${il}</div>`;
        }).join("");
      c.appendChild(preview);
    }
    c.appendChild(btn("🎲 턴 시작", "primary", startCombatRound));
    const info = document.createElement("div"); info.style.cssText="font-size:10px;color:#8a9bb0;padding:2px 0;";
    info.textContent = `턴 ${cb.roundNumber} │ 손패 ${cb.hand.length} │ 뽑을패 ${cb.drawPile.length}`;
    c.appendChild(info);
    return;
  }
  const cb = state.combat;
  if (!cb.hand.length) { c.appendChild(btn("패스 (카드 없음)", "", () => allyPass())); return; }
  const cardRow = document.createElement("div"); cardRow.className = "card-hand-row";
  cb.hand.forEach((cid, i) => {
    const card = CARD_LIBRARY[cid];
    const isDrag = card.needsTarget;
    const el = document.createElement("div");
    el.className = "visual-card" + (isDrag ? " drag-card" : " self-card");
    const typeColor = card.type === "attack" ? "#ff8866" : "#66ccff";
    const typeLabel = card.type === "attack" ? "공격" : "스킬";
    el.innerHTML = `
      <div class="vc-cost">${card.cost}</div>
      <div class="vc-name">${card.name}</div>
      <div class="vc-type" style="color:${typeColor}">${typeLabel}</div>
      <div class="vc-desc">${card.text}</div>
      <div class="vc-hint">${isDrag ? "▷ 적에게 드래그" : "▷ 클릭 사용"}</div>
    `;
    if (isDrag) { el.addEventListener("pointerdown", (e) => onCardDragStart(e, i)); }
    else { el.onclick = () => playAllyCard(i, -1); }
    cardRow.appendChild(el);
  });
  c.appendChild(cardRow);
  c.appendChild(btn("패스", "", allyPass));
}

function renderEventAct(c) {
  const v=state.eventContext?.variant; if(!v) return;
  const info=document.createElement("div"); info.innerHTML=`<strong>${v.title}</strong>`;
  info.style.cssText="font-size:13px;margin-bottom:4px;"; c.appendChild(info);
  v.options.forEach(o => {
    const seen = o.id ? isEventSeen(o.id) : true;
    const displayLabel = seen ? o.label : (o.hint || "???");
    c.appendChild(btn(displayLabel, seen ? "" : "skill", () => {
      if (o.id) markEventSeen(o.id);
      o.apply(state);
      completeNode(state.eventContext.node);
    }));
  });
}
function renderRewardAct(c) { state.rewardChoices.forEach(cid=>{const card=CARD_LIBRARY[cid];c.appendChild(btn(`<span class="card-chip">${card.name}</span> — ${card.text}`,"good",()=>{state.pendingRewardCard=cid;state.phase=PHASE.BATTLE_REWARD_ASSIGN;renderAll();}));}); c.appendChild(btn("건너뛰기 (골드+10)","",()=>{state.run.gold+=10;logLine(state,"골드+10");completeNode(state.combat.node);}));}
function renderAssignAct(c) { const cid=state.pendingRewardCard;if(!cid)return;const card=CARD_LIBRARY[cid];const el=aliveParty(state).filter(m=>m.deck.length<MAX_DECK_SIZE);if(!el.length){logLine(state,"덱 가득.");state.run.gold+=10;state.pendingRewardCard=null;completeNode(state.combat.node);return;} const info=document.createElement("div");info.innerHTML=`<strong>${card.name}</strong> 추가할 캐릭터:`;info.style.cssText="font-size:12px;margin-bottom:4px;";c.appendChild(info);el.forEach(m=>c.appendChild(btn(`${m.name} (덱 ${m.deck.length}/${MAX_DECK_SIZE})`,"good",()=>{m.deck.push(cid);state.run.gold+=10;logLine(state,`${m.name}: ${card.name} 추가.`);state.pendingRewardCard=null;completeNode(state.combat.node);})));c.appendChild(btn("취소","",()=>{state.phase=PHASE.BATTLE_REWARD;renderAll();}));}
function renderFloorAct(c) { c.appendChild(btn("카드 제거","good",()=>{state.phase=PHASE.FLOOR_REWARD_PICK;renderAll();}));c.appendChild(btn("공격 +1","",()=>{state.run.attackBonus+=1;logLine(state,"공격+1");proceedFloor();}));c.appendChild(btn("휴식: HP+12, 스트레스-15","",()=>{aliveParty(state).forEach(m=>{m.hp=Math.min(m.maxHp,m.hp+12);reduceStress(m,15)});logLine(state,"휴식.");proceedFloor();}));}
function renderFloorPickAct(c) { const ms=aliveParty(state).filter(m=>m.deck.length>0);if(!ms.length){logLine(state,"카드 없음.");proceedFloor();return;}ms.forEach(m=>c.appendChild(btn(`${m.name} (덱 ${m.deck.length})`,"",()=>{state.removeMember=m;state.phase=PHASE.FLOOR_REWARD_REMOVE;renderAll();})));c.appendChild(btn("취소","",()=>{state.phase=PHASE.FLOOR_REWARD;renderAll();}));}
function renderFloorRemoveAct(c) { const m=state.removeMember;if(!m)return;[...new Set(m.deck)].sort((a,b)=>CARD_LIBRARY[a].name.localeCompare(CARD_LIBRARY[b].name,"ko")).forEach(cid=>{const cnt=m.deck.filter(x=>x===cid).length;c.appendChild(btn(`${CARD_LIBRARY[cid].name} x${cnt}`,"danger",()=>{const idx=m.deck.indexOf(cid);if(idx>=0)m.deck.splice(idx,1);logLine(state,`${m.name}: 제거.`);proceedFloor();}));});c.appendChild(btn("취소","",()=>{state.phase=PHASE.FLOOR_REWARD_PICK;renderAll();}));}
function renderLogs() { logPanel.innerHTML="";state.logs.slice(-12).forEach(e=>{const d=document.createElement("div");d.className="log-entry";d.textContent=e;logPanel.appendChild(d);});logPanel.scrollTop=logPanel.scrollHeight;}
function btn(l,cls,fn,dis=false){const b=document.createElement("button");b.innerHTML=l;if(cls)b.classList.add(cls);b.disabled=dis;b.onclick=fn;return b;}

/* ── Game Logic ──────────────────────────────── */
function startNewRun() {
  state.run={floor:1,party:PARTY_TEMPLATES.map(createMember),gold:0,consumedFoodCount:0,attackBonus:0,memoryFragments:0,discoveredPersistent:loadPersistent(),discoveredRun:new Set(),runIndex:Date.now(),collapsedNames:[]};
  state.logs=[];state.turnOrder=[];state.currentActionIdx=0;state.waitingForAlly=false;state.actingMember=null;
  logLine(state,"새 런 시작.");loadFloor(1);
}
const FLOOR_GRID_SIZE = { 1:3, 2:4, 3:5, 4:5, 5:6 };
const BATTLE_NAMES=["쇄도 전투","매복 전투","잔당 소탕","봉쇄 돌파","교전","철문 돌파"];
const EVENT_NAMES_MAP=["금지 제단","기억 우물","그림자 장터","침묵 회랑","소원 제의"];
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
  types.push("boss");

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
          title:`${BOSS_NAMES[fn-1]}의 방`,enemyCount:1});
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
function startEvent(nd){state.phase=PHASE.EVENT;state.eventContext={node:nd,variant:EVENT_VARIANTS[randomInt(0,EVENT_VARIANTS.length-1)]};logLine(state,`선택지: ${nd.title}`);renderAll();}

function startCombat(nd,isBoss) {
  const run=state.run; let enemies;
  if(isBoss){enemies=[createBoss(run.floor)];aliveParty(state).forEach(m=>addStress(state,m,3));}
  else enemies=createEnemyGroup(run.floor);
  const combined=[];aliveParty(state).forEach(m=>combined.push(...[...m.deck]));shuffleArr(combined);
  state.combat={node:nd,isBoss,enemies,drawPile:combined,spentPile:[],hand:[],roundNumber:1};
  state.phase=PHASE.COMBAT;state.turnOrder=[];state.currentActionIdx=0;state.waitingForAlly=false;state.actingMember=null;
  logLine(state,`${isBoss?"보스전":"전투"} 시작 (카드 ${combined.length}장)`);renderAll();
}

/* ── 라운드 기반 전투 ────────────────────────── */

const DRAW_PER_CHAR = 2;

function startCombatRound() {
  const cb=state.combat, run=state.run; if(!cb)return;
  if(!cb.hand.length&&!cb.drawPile.length){handleFail("카드 전부 소진!");return;}

  const finalSpeeds = new Map();
  run.party.forEach((m,i) => { if(isActive(m)) finalSpeeds.set(`ally_${i}`, randomInt(1,6)); });
  cb.enemies.forEach((e,i) => { if(e.hp>0) finalSpeeds.set(`enemy_${i}`, randomInt(1,6)); });

  state.diceRolling = { active: true, startTime: Date.now(), settled: false, finalSpeeds };
  logLine(state, `── 턴 ${cb.roundNumber} 주사위 ──`);
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
      preview=`${e.name} ▶ ⚔ 공격 ${il.value+e.attackBonus}`;
    } else if(il.type==="defend"){ preview=`${e.name} ▶ 🛡 방어 +${il.value}`;
    } else if(il.type==="buff"){ preview=`${e.name} ▶ ↑ 강화 +${il.value}`; }

    state.enemyActing = { enemy: e, preview };
    renderAll();

    setTimeout(()=>{
      state.enemyActing = null;
      applyEnemyIntent(cb,e);
      if(!aliveParty(state).length){handleFail("파티 전멸.");return;}
      state.currentActionIdx++;
      renderAll();
      setTimeout(processNextAction, 400);
    }, 2500);
    return;
  }

  const member=state.run.party[unit.index];
  if(!isActive(member)){state.currentActionIdx++;processNextAction();return;}

  drawCardsFromPile(cb, DRAW_PER_CHAR);
  logLine(state, `${member.name} 카드 ${DRAW_PER_CHAR}장 드로우`);

  if(!cb.hand.length&&!cb.drawPile.length){
    logLine(state, `${member.name}: 카드 소진, 패스.`);
    state.currentActionIdx++;
    const allEmpty = !cb.hand.length && !cb.drawPile.length && aliveParty(state).every(() => true);
    if(allEmpty && state.currentActionIdx >= state.turnOrder.length){handleFail("카드 전부 소진!");return;}
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
  cb.hand.splice(cardIdx,1); cb.spentPile.push(cid);
  const ectx=makeEffectCtx(state,cb);
  applyCardEffect(cid,ectx,targetEnemyIdx);
  logLine(state,`▶ ${state.actingMember.name}: ${card.name}`);

  state.waitingForAlly=false;state.actingMember=null;state.currentActionIdx++;
  if(aliveEnemyList(cb).length===0){handleWin();return;}
  renderAll(); setTimeout(processNextAction,300);
}

function discardCard(cardIdx) {
  if(!state.discarding||!state.combat) return;
  const cb=state.combat, cid=cb.hand[cardIdx], card=CARD_LIBRARY[cid];
  cb.hand.splice(cardIdx,1); cb.spentPile.push(cid);
  logLine(state, `${state.actingMember?.name||"?"}: ${card.name} 버림`);
  if(cb.hand.length <= MAX_HAND) {
    state.discarding=false;
    state.waitingForAlly=true;
  }
  renderAll();
}

function allyPass() {
  if(!state.waitingForAlly)return;
  logLine(state,`${state.actingMember.name}: 패스.`);
  state.waitingForAlly=false;state.actingMember=null;state.currentActionIdx++;
  renderAll(); setTimeout(processNextAction,200);
}

function endRound() {
  const cb=state.combat;if(!cb)return;
  cb.enemies.forEach(e=>{if(e.hp>0&&e.bleed>0){e.hp=Math.max(0,e.hp-e.bleed);logLine(state,`${e.name} 출혈 ${e.bleed}`);if(e.hp<=0){logLine(state,`✦ ${e.name} 출혈 사망!`);aliveParty(state).forEach(m=>reduceStress(m,3));}}});
  if(aliveEnemyList(cb).length===0){handleWin();return;}
  cb.enemies.forEach(e=>{if(e.hp>0){e.block=0;advanceIntent(e);}});
  const alive=aliveParty(state);if(alive.length)addStress(state,alive[randomInt(0,alive.length-1)],1);
  cb.roundNumber++;state.turnOrder=[];state.waitingForAlly=false;state.actingMember=null;
  renderAll();
}

function applyEnemyIntent(cb,e) {
  const alive=aliveParty(state);if(!alive.length)return;
  if(e.intent.type==="attack"){const tgt=alive[randomInt(0,alive.length-1)];const inc=e.intent.value+e.attackBonus;const blk=Math.min(tgt.block,inc),act=inc-blk;tgt.block=Math.max(0,tgt.block-blk);tgt.hp=Math.max(0,tgt.hp-act);logLine(state,`${e.name}→${tgt.name} ${inc}${blk?` (방어${blk})`:""}`);if(act>0)addStress(state,tgt,3);if(tgt.hp<=0){logLine(state,`✖ ${tgt.name} 쓰러짐!`);aliveParty(state).forEach(m=>addStress(state,m,10));}}
  else if(e.intent.type==="defend"){e.block+=e.intent.value;logLine(state,`${e.name} 방어+${e.intent.value}`);}
  else if(e.intent.type==="buff"){e.attackBonus+=e.intent.value;logLine(state,`${e.name} 강화+${e.intent.value}`);}
}
function advanceIntent(e){e.intentIndex=(e.intentIndex+1)%e.pattern.length;e.intent=e.pattern[e.intentIndex];}

function handleWin(){const cb=state.combat;if(!cb)return;if(cb.isBoss){logLine(state,`★ ${cb.enemies[0].name} 격파!`);playCutscene(`boss_defeat_floor_${state.run.floor}`,()=>{state.floor.completedNodeIds.add(state.floor.bossNode.id);if(state.run.floor===5){const et=evalEnd(true);playCutscene(endSceneId(et),()=>moveEnd(et));}else{state.phase=PHASE.FLOOR_REWARD;state.combat=null;renderAll();}});return;}state.phase=PHASE.BATTLE_REWARD;state.rewardChoices=uniqueSample(CARD_REWARD_POOL,3);renderAll();}
function completeNode(nd){if(!nd||!state.floor)return;state.floor.completedNodeIds.add(nd.id);state.phase=PHASE.MAP;state.combat=null;state.eventContext=null;state.rewardChoices=[];state.pendingRewardCard=null;state.turnOrder=[];state.waitingForAlly=false;renderAll();}
function proceedFloor(){if(state.run.floor>=5)return;const n=state.run.floor+1;logLine(state,`${state.run.floor}층→${n}층`);loadFloor(n);}
function evalEnd(c){if(!c||!aliveParty(state).length)return"ENDING_FAIL";if(state.run.collapsedNames.length)return"ENDING_FAIL";if(state.run.consumedFoodCount===0)return"ENDING_TRUE";return"ENDING_LOOP";}
function endSceneId(et){return et==="ENDING_TRUE"?"ending_true_cutscene":et==="ENDING_LOOP"?"ending_loop_cutscene":"ending_fail_cutscene";}
function moveEnd(et){state.phase=PHASE.ENDING;state.combat=null;state.turnOrder=[];state.waitingForAlly=false;logLine(state,et==="ENDING_TRUE"?"진엔딩!":et==="ENDING_LOOP"?"회귀.":"실패.");renderAll();}
function handleFail(r){logLine(state,r);const et=evalEnd(false);playCutscene(endSceneId(et),()=>moveEnd(et));}

/* ── Cutscenes ───────────────────────────────── */
function playCutscene(id,onEnd){const sc=CUTSCENES[id];if(!sc){onEnd?.();return;}state.phase=PHASE.CUTSCENE;state.activeScene=sc;state.activeSceneIndex=0;state.activeSceneOnEnd=onEnd||null;state.eventContext=null;state.combat=null;renderAll();}
function nextFrame(){if(!state.activeScene)return;state.activeSceneIndex++;if(state.activeSceneIndex>=state.activeScene.frames.length)finishScene();else renderAll();}
function skipScene(){finishScene();}
function finishScene(){const cb=state.activeSceneOnEnd;state.activeScene=null;state.activeSceneIndex=0;state.activeSceneOnEnd=null;if(cb)cb();else{state.phase=PHASE.MAP;renderAll();}}

/* ══════════════════════════════════════════════════
   Canvas Drawing — 960×540 (16:9)
   ══════════════════════════════════════════════════ */

function drawScene(){const run=state.run;const fc=run?FLOOR_COLORS[run.floor-1]:[30,34,42];const g=ctx.createLinearGradient(0,0,960,540);g.addColorStop(0,`rgb(${fc[0]-18},${fc[1]-16},${fc[2]-18})`);g.addColorStop(1,`rgb(${fc[0]},${fc[1]},${fc[2]})`);ctx.fillStyle=g;ctx.fillRect(0,0,960,540);drawGrid();const fn={[PHASE.TITLE]:drawTitle,[PHASE.MAP]:drawMap,[PHASE.COMBAT]:drawCombat,[PHASE.BATTLE_REWARD]:drawCombat,[PHASE.BATTLE_REWARD_ASSIGN]:drawCombat,[PHASE.EVENT]:drawEvent,[PHASE.FLOOR_REWARD]:drawFloorRw,[PHASE.FLOOR_REWARD_PICK]:drawFloorRw,[PHASE.FLOOR_REWARD_REMOVE]:drawFloorRw,[PHASE.CUTSCENE]:drawCutscene,[PHASE.ENDING]:drawEnding}[state.phase];if(fn)fn();}
function drawGrid(){ctx.save();ctx.strokeStyle="rgba(255,255,255,0.04)";ctx.lineWidth=1;for(let x=0;x<960;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<540;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}ctx.restore();}
function drawTitle(){drawPanel(220,140,520,260,"rgba(0,0,0,0.55)");drawText("TARTAROS",480,200,52,"#f6d18d","center");drawText("Oath of Hunger",480,245,22,"#c8b07a","center");drawText(`속도 이니셔티브 │ D&D 카드 │ 5층 루프`,480,290,16,"#d1dae4","center");}

function drawMap(){
  if(!state.floor||!state.run) return;
  const fl=state.floor, s=fl.size;
  const adjIds=new Set(getAdj(fl).map(n=>n.id));
  const disc=state.run.discoveredPersistent, discR=state.run.discoveredRun;

  drawText(`${state.run.floor}층 — ${FLOOR_NAMES[state.run.floor-1]}`,480,32,22,"#f5f9ff","center");

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

  const legend=`현재위치=노랑 │ 완료=초록 │ 인접=하늘 │ 기억=파랑 │ 미지=회색`;
  drawText(legend,480,oy+s*cellSize+16,10,"#6a7888","center");
}

function drawCombat(){
  const run=state.run,cb=state.combat;if(!run)return;
  if(combatBg.complete&&combatBg.naturalWidth>0){ctx.drawImage(combatBg,0,0,960,540);}else{ctx.fillStyle="rgba(0,0,0,0.3)";ctx.fillRect(0,0,960,540);}
  run.party.forEach((m,i)=>{const x=60,y=120+i*100,act=isActive(m),a=act?0.7:0.3;const isActing=state.actingMember===m;
    drawPanel(x,y,240,85,isActing?"rgba(40,80,140,0.8)":`rgba(12,22,40,${a})`);
    if(isActing){ctx.strokeStyle="#5da4e6";ctx.lineWidth=2;ctx.strokeRect(x,y,240,85);}
    drawText(m.name,x+10,y+18,16,act?"#8bc1ff":"#556677","left");
    if(state.diceRolling.active && act) {
      const key=`ally_${i}`, fs=state.diceRolling.finalSpeeds;
      if(state.diceRolling.settled) { drawText(`🎲 ${fs.get(key)}`,x+170,y+18,14,"#ffc857","left"); }
      else { drawText(`🎲 ${randomInt(1,6)}`,x+170,y+18,14,"rgba(255,255,255,0.6)","left"); }
    } else if(m.speed>0) { drawText(`SPD ${m.speed}`,x+180,y+18,11,"#88aacc","left"); }
    const hp=m.maxHp>0?m.hp/m.maxHp:0,hc=hp>0.5?"#50c878":hp>0.25?"#e6b84d":"#ff4d4d";drawBarBg(x+10,y+36,160,8);drawBarFill(x+10,y+36,160*hp,8,hc);drawText(`${m.hp}/${m.maxHp}`,x+178,y+40,11,"#dde8f2","left");
    const sp=Math.min(m.stress,100)/100,sc=m.stress<=30?"#50c878":m.stress<=60?"#e6b84d":m.stress<=STRESS_LIMIT?"#d46ab0":"#ff4d4d";drawBarBg(x+10,y+52,100,6);drawBarFill(x+10,y+52,100*sp,6,sc);drawText(`ST ${m.stress}`,x+118,y+55,10,"#aabbcc","left");
    if(m.block>0)drawText(`🛡${m.block}`,x+175,y+55,10,"#5da4e6","left");if(!act)drawText(m.stress>STRESS_LIMIT?"붕괴":"사망",x+10,y+72,12,"#ff6666","left");});

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
    if(alive)drawText(`의도: ${intentLbl(e.intent)}`,x+10,y+56,12,"#eeddcc","left");else drawText("처치됨",x+10,y+56,12,"#884444","left");
    if(e.bleed>0)drawText(`🩸${e.bleed}`,x+10,y+72,10,"#cc6666","left");});
    drawText("VS",480,240,36,"rgba(255,255,255,0.1)","center");

    if(state.turnOrder.length){let ty=440;drawText(`턴 ${cb.roundNumber} 행동 순서:`,340,ty,12,"#8a9bb0","left");
      state.turnOrder.forEach((u,idx)=>{const isCur=idx===state.currentActionIdx;const nm=u.type==="ally"?state.run.party[u.index].name:cb.enemies[u.index].name;const done=idx<state.currentActionIdx;
        const col=done?"#555":isCur?"#ffc857":u.type==="ally"?"#88bbdd":"#cc8888";
        drawText(`${idx+1}.${nm}(${u.speed})`,340+idx*90,ty+18,10,col,"left");});}

    if(state.enemyActing){
      drawPanel(200,16,560,44,"rgba(60,20,20,0.92)");
      drawText(state.enemyActing.preview,480,38,18,"#ff9988","center");
    }}
}

function drawEvent(){if(!state.eventContext)return;const v=state.eventContext.variant;drawPanel(180,120,600,200,"rgba(14,29,33,0.75)");drawText(v.title,210,170,30,"#89f6d9","left");drawText(v.text,210,220,18,"#e0f0ff","left");}
function drawFloorRw(){drawPanel(220,140,520,200,"rgba(39,28,12,0.76)");drawText(`${state.run.floor}층 클리어`,480,200,34,"#f6cd89","center");drawText("보상 선택",480,260,18,"#e8e0d0","center");}
function drawCutscene(){const sc=state.activeScene;if(!sc)return;const fr=sc.frames[Math.min(state.activeSceneIndex,sc.frames.length-1)];const[r,g2,b]=fr.color;ctx.fillStyle=`rgba(${r},${g2},${b},0.3)`;ctx.fillRect(0,0,960,540);drawPanel(80,100,800,180,"rgba(0,0,0,0.5)");drawPanel(80,310,800,120,"rgba(0,0,0,0.6)");drawText(sc.title,110,150,28,"#f8eac1","left");drawText(fr.headline,110,200,22,"#ffffff","left");drawText(fr.line,110,370,20,"#f4f7fb","left");}
function drawEnding(){const et=evalEnd(state.run.floor>=5&&aliveParty(state).length>0);const t=et==="ENDING_TRUE"?"진엔딩":et==="ENDING_LOOP"?"일반 엔딩":"실패 엔딩";const tc=et==="ENDING_TRUE"?"#50c878":et==="ENDING_LOOP"?"#f6d18d":"#ff6b6b";drawPanel(200,80,560,380,"rgba(10,14,25,0.78)");drawText(t,480,140,36,tc,"center");drawText(`귀속: ${state.run.consumedFoodCount}`,480,210,20,"#e0e8f0","center");drawText(`골드: ${state.run.gold}`,480,245,20,"#e0e8f0","center");let y=300;state.run.party.forEach(m=>{const st=isActive(m)?"활성":m.stress>STRESS_LIMIT?"붕괴":"사망";drawText(`${m.name}: HP ${m.hp}/${m.maxHp} ST ${m.stress} [${st}]`,480,y,13,isActive(m)?"#88ccaa":"#cc6666","center");y+=20;});}

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

function buildCutscenes(){const sc={};for(let fl=1;fl<=5;fl++){const c=FLOOR_COLORS[fl-1];sc[`boss_intro_floor_${fl}`]={title:`${fl}층 보스 진입`,frames:[{headline:`${BOSS_NAMES[fl-1]} 등장`,line:`${fl}층의 문이 열린다.`,color:c},{headline:"결전 준비",line:"호흡을 고른다.",color:c},{headline:"전투 개시",line:"보스가 의도를 드러냈다.",color:c}]};sc[`boss_defeat_floor_${fl}`]={title:`${fl}층 격파`,frames:[{headline:`${BOSS_NAMES[fl-1]} 붕괴`,line:"길이 열린다.",color:c},{headline:"전리품",line:"단서를 찾는다.",color:c}]};}sc.ending_loop_cutscene={title:"일반 클리어",frames:[{headline:"문은 열렸다",line:"귀속 인장이 발목을 붙든다.",color:[84,77,52]},{headline:"낙하",line:"다시 감방으로.",color:[48,55,74]}]};sc.ending_true_cutscene={title:"진엔딩",frames:[{headline:"무귀속",line:"금식의 맹세가 효력을 발휘한다.",color:[93,130,94]},{headline:"지상 탈출",line:"새벽의 공기를 마신다.",color:[124,150,110]},{headline:"후일담",line:"루프는 끝났다.",color:[148,164,127]}]};sc.ending_fail_cutscene={title:"실패",frames:[{headline:"의지 붕괴",line:"소거한다.",color:[114,54,58]},{headline:"재기동",line:"낙인 리셋.",color:[62,47,74]}]};return sc;}
