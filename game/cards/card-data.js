/**
 * 카드 정의 및 캐릭터별 시작 덱.
 */
export const MAX_DECK_SIZE = 15;

export const CARD_LIBRARY = {
  strike:    { id: "strike",    name: "강타",     cost: 1, text: "적 1체 피해 6",         type: "attack", needsTarget: true },
  guard:     { id: "guard",     name: "수비",     cost: 1, text: "아군 전체 방어 +5",     type: "skill",  needsTarget: false },
  focus:     { id: "focus",     name: "집중",     cost: 1, text: "카드 2장 드로우",       type: "skill",  needsTarget: false },
  cleave:    { id: "cleave",    name: "절개",     cost: 2, text: "적 전체 피해 8",         type: "attack", needsTarget: false, isAoe: true },
  fortify:   { id: "fortify",   name: "요새화",   cost: 2, text: "아군 전체 방어 +8",     type: "skill",  needsTarget: false },
  bleed_cut: { id: "bleed_cut", name: "유혈 베기", cost: 1, text: "적 1체 피해 5, 출혈 2", type: "attack", needsTarget: true },
};

export const CARD_REWARD_POOL = ["strike", "guard", "cleave", "fortify", "bleed_cut", "focus"];

export const STARTING_DECKS = {
  "아르케": [
    ...Array(4).fill("strike"), ...Array(5).fill("guard"),
    ...Array(2).fill("fortify"), ...Array(2).fill("focus"),
    "cleave", "bleed_cut",
  ],
  "리코스": [
    ...Array(6).fill("strike"), ...Array(2).fill("guard"),
    ...Array(2).fill("cleave"), ...Array(3).fill("bleed_cut"),
    ...Array(2).fill("focus"),
  ],
  "세린": [
    ...Array(3).fill("strike"), ...Array(4).fill("guard"),
    ...Array(4).fill("focus"), ...Array(2).fill("fortify"),
    ...Array(2).fill("bleed_cut"),
  ],
};
