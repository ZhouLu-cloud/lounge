export type CardSuit = {
  name: 'Hearts' | 'Spades' | 'Diamonds' | 'Clubs';
  icon: string;
  color: 'text-error' | 'text-on-surface';
};

export type PlayingCard = {
  v: string;
  s: string;
  c: 'text-error' | 'text-on-surface';
};

const cardValues = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const pokerSuits: PlayingCard[] = [
  { v: '', s: 'favorite', c: 'text-error' },
  { v: '', s: 'playing_cards', c: 'text-on-surface' },
  { v: '', s: 'diamond', c: 'text-error' },
  { v: '', s: 'spa', c: 'text-on-surface' },
];

export function randomDiceResults(diceCount: number) {
  return Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
}

export function randomPokerCard(): PlayingCard {
  const v = cardValues[Math.floor(Math.random() * cardValues.length)];
  const suit = pokerSuits[Math.floor(Math.random() * pokerSuits.length)];
  return {
    v,
    s: suit.s,
    c: suit.c,
  };
}

export function buildPokerHand() {
  const playerCards = [randomPokerCard(), randomPokerCard()];
  const allCommunityCards = [
    randomPokerCard(),
    randomPokerCard(),
    randomPokerCard(),
    randomPokerCard(),
    randomPokerCard(),
  ];

  return {
    playerCards,
    allCommunityCards,
    revealStage: 0,
    communityCards: [] as PlayingCard[],
  };
}

const CARD_RULES: Record<string, { name: string; rule: string; icon: string }> = {
  A: { name: 'Ace', rule: '选人喝酒', icon: 'person_add' },
  '2': { name: '2', rule: '是小姐', icon: 'woman' },
  '3': { name: '3', rule: '逛三园', icon: 'park' },
  '4': { name: '4', rule: '南北大战', icon: 'groups' },
  '5': { name: '5', rule: '照相机', icon: 'photo_camera' },
  '6': { name: '6', rule: '摸鼻子', icon: 'face' },
  '7': { name: '7', rule: '逢七过', icon: 'filter_7' },
  '8': { name: '8', rule: '厕所牌', icon: 'wc' },
  '9': { name: '9', rule: '自己喝酒', icon: 'local_bar' },
  '10': { name: '10', rule: '神经病', icon: 'psychology' },
  J: { name: 'Jack', rule: '左边喝', icon: 'arrow_back' },
  Q: { name: 'Queen', rule: '右边喝', icon: 'arrow_forward' },
  K: { name: 'King', rule: '自己定', icon: 'edit' },
};

const LADY_SUITS: CardSuit[] = [
  { name: 'Hearts', icon: 'favorite', color: 'text-error' },
  { name: 'Spades', icon: 'playing_cards', color: 'text-on-surface' },
  { name: 'Diamonds', icon: 'diamond', color: 'text-error' },
  { name: 'Clubs', icon: 'filter_vintage', color: 'text-on-surface' },
];

export function drawLadyCard() {
  const values = Object.keys(CARD_RULES);
  const randomValue = values[Math.floor(Math.random() * values.length)];
  const randomSuit = LADY_SUITS[Math.floor(Math.random() * LADY_SUITS.length)];

  return {
    v: randomValue,
    s: randomSuit,
    rule: CARD_RULES[randomValue].rule,
    icon: CARD_RULES[randomValue].icon,
    name: `${CARD_RULES[randomValue].name} of ${randomSuit.name}`,
  };
}
