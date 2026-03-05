/**
 * Enemy factory.
 */

const ENEMY_NAMES = ["Lower Warden", "Seal Guard", "Rift Scout", "Forgetful Sentinel", "Abyss Walker", "Ruin Drifter"];
export const BOSS_NAMES = ["Chain Jailer", "Rift Guardian", "Memory Executor", "Judgment Archivist", "Gatekeeper of Tartaros"];
const SUFFIXES = ["α", "β", "γ"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function createEnemyGroup(floor) {
  const count = randomInt(1, 3);
  const budget = 40 + floor * 12;
  const hpEach = Math.floor(budget / count);
  const enemies = [];

  for (let i = 0; i < count; i++) {
    const hp = hpEach + randomInt(0, 5);
    let pattern;
    if (count >= 3) {
      pattern = [{ type: "attack", value: 6 + floor }, { type: "attack", value: 5 + floor }];
    } else if (count === 2) {
      pattern = [
        [{ type: "attack", value: 7 + floor }, { type: "defend", value: 5 + floor }],
        [{ type: "attack", value: 8 + floor }, { type: "buff", value: 1 }],
      ][randomInt(0, 1)];
    } else {
      pattern = [
        [{ type: "attack", value: 8 + floor }, { type: "defend", value: 7 + floor }],
        [{ type: "attack", value: 9 + floor }, { type: "buff", value: 1 }],
        [{ type: "defend", value: 8 + floor }, { type: "attack", value: 10 + floor }],
      ][randomInt(0, 2)];
    }

    const baseName = ENEMY_NAMES[randomInt(0, ENEMY_NAMES.length - 1)];
    enemies.push({
      name: count > 1 ? `${baseName} ${SUFFIXES[i]}` : baseName,
      hp, maxHp: hp, block: 0, bleed: 0, attackBonus: 0,
      intentIndex: 0, pattern, intent: pattern[0], speed: 0,
    });
  }
  return enemies;
}

export function createBoss(floor) {
  const hp = 86 + floor * 22;
  const pattern = [
    { type: "attack", value: 12 + floor * 2 },
    { type: "defend", value: 10 + floor },
    { type: "attack", value: 15 + floor * 2 },
    { type: "buff", value: 2 },
  ];
  return {
    name: BOSS_NAMES[floor - 1], hp, maxHp: hp,
    block: 0, bleed: 0, attackBonus: floor,
    intentIndex: 0, pattern, intent: pattern[0], speed: 0,
  };
}
