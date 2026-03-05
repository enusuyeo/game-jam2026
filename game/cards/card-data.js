/**
 * Card definitions and per-character starting decks.
 */
export const MAX_DECK_SIZE = 15;

export const CARD_LIBRARY = {
  strike:    { id: "strike",    name: "Strike",    cost: 1, text: "Deal 6 damage to 1 enemy",       type: "attack", needsTarget: true },
  guard:     { id: "guard",     name: "Guard",     cost: 1, text: "Gain +5 Block for all allies",    type: "skill",  needsTarget: false },
  focus:     { id: "focus",     name: "Focus",     cost: 1, text: "Draw 2 cards",                    type: "skill",  needsTarget: false },
  cleave:    { id: "cleave",    name: "Cleave",    cost: 2, text: "Deal 8 damage to all enemies",    type: "attack", needsTarget: false, isAoe: true },
  fortify:   { id: "fortify",   name: "Fortify",   cost: 2, text: "Gain +8 Block for all allies",    type: "skill",  needsTarget: false },
  bleed_cut: { id: "bleed_cut", name: "Bleed Cut", cost: 1, text: "Deal 5 damage and Bleed 2 to 1 enemy", type: "attack", needsTarget: true },
};

export const CARD_REWARD_POOL = ["strike", "guard", "cleave", "fortify", "bleed_cut", "focus"];

export const STARTING_DECKS = {
  "Arke": [
    ...Array(4).fill("strike"), ...Array(5).fill("guard"),
    ...Array(2).fill("fortify"), ...Array(2).fill("focus"),
    "cleave", "bleed_cut",
  ],
  "Rikos": [
    ...Array(6).fill("strike"), ...Array(2).fill("guard"),
    ...Array(2).fill("cleave"), ...Array(3).fill("bleed_cut"),
    ...Array(2).fill("focus"),
  ],
  "Serin": [
    ...Array(3).fill("strike"), ...Array(4).fill("guard"),
    ...Array(4).fill("focus"), ...Array(2).fill("fortify"),
    ...Array(2).fill("bleed_cut"),
  ],
};
