/**
 * 카드 효과 구현.
 * 모든 함수는 game context 객체를 받아 직접 상태를 변경.
 */

export function applyCardEffect(cardId, ctx, targetIdx) {
  const fn = EFFECTS[cardId];
  if (!fn) throw new Error(`unknown card: ${cardId}`);
  fn(ctx, targetIdx);
}

function _strike(ctx, ti) {
  ctx.dmgEnemy(ti, 6 + ctx.state.run.attackBonus);
}

function _guard(ctx) {
  ctx.aliveParty().forEach((m) => (m.block += 5));
  ctx.log("아군 전체 방어 +5");
}

function _focus(ctx) {
  ctx.drawCards(2);
  ctx.log("카드 2장 드로우");
}

function _cleave(ctx) {
  ctx.aliveEnemyList().forEach(([, e]) => {
    ctx.dmgEnemy(ctx.combat.enemies.indexOf(e), 8 + ctx.state.run.attackBonus);
  });
  ctx.log("적 전체 공격!");
}

function _fortify(ctx) {
  ctx.aliveParty().forEach((m) => (m.block += 8));
  ctx.log("아군 전체 방어 +8");
}

function _bleedCut(ctx, ti) {
  ctx.dmgEnemy(ti, 5 + ctx.state.run.attackBonus);
  const enemy = ctx.combat.enemies[ti];
  if (enemy && enemy.hp > 0) {
    enemy.bleed += 2;
    ctx.log(`${enemy.name} 출혈 +2`);
  }
}

const EFFECTS = {
  strike: _strike,
  guard: _guard,
  focus: _focus,
  cleave: _cleave,
  fortify: _fortify,
  bleed_cut: _bleedCut,
};
