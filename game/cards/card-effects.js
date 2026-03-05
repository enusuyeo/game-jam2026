/**
 * Card effect implementations.
 * All functions mutate state directly via the game context.
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
  ctx.log("All allies gain +5 Block");
}

function _focus(ctx) {
  ctx.drawCards(2);
  ctx.log("Drew 2 cards");
}

function _cleave(ctx) {
  ctx.aliveEnemyList().forEach(([, e]) => {
    ctx.dmgEnemy(ctx.combat.enemies.indexOf(e), 8 + ctx.state.run.attackBonus);
  });
  ctx.log("Attacked all enemies");
}

function _fortify(ctx) {
  ctx.aliveParty().forEach((m) => (m.block += 8));
  ctx.log("All allies gain +8 Block");
}

function _bleedCut(ctx, ti) {
  ctx.dmgEnemy(ti, 5 + ctx.state.run.attackBonus);
  const enemy = ctx.combat.enemies[ti];
  if (enemy && enemy.hp > 0) {
    enemy.bleed += 2;
    ctx.log(`${enemy.name} Bleed +2`);
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
