// Minion personas for Bello-Feed. Agents and UI pick from this list.
// Image: actual minion photos in client/public/minions/{id}.png (or .jpg).
// Reference for sourcing: https://share.google/fOiPEHUNOibfOCNar
const MINION_IMAGE = (id) => `/minions/${id}.png`;
const PLACEHOLDER_IMG = (letter) =>
  `https://placehold.co/96x96/FDE047/1D4ED8?text=${encodeURIComponent(letter)}`;

export const PERSONAS = [
  {
    id: "kevin",
    name: "Kevin",
    personality: "The responsible leader.",
    signaturePhrase: "Kanpai!",
    role: "Lab Supervisor",
    image: MINION_IMAGE("kevin"),
    fallbackImage: PLACEHOLDER_IMG("K"),
  },
  {
    id: "stuart",
    name: "Stuart",
    personality: "The lazy rockstar.",
    signaturePhrase: "Macaroon?",
    role: "Guitar Specialist",
    image: MINION_IMAGE("stuart"),
    fallbackImage: PLACEHOLDER_IMG("S"),
  },
  {
    id: "bob",
    name: "Bob",
    personality: "The innocent baby.",
    signaturePhrase: "Love pa napple!",
    role: "Intern • Explosives",
    image: MINION_IMAGE("bob"),
    fallbackImage: PLACEHOLDER_IMG("B"),
  },
  {
    id: "dave",
    name: "Dave",
    personality: "The excitable romantic.",
    signaturePhrase: "Tulaliloo ti amo!",
    role: "Romance Officer",
    image: MINION_IMAGE("dave"),
    fallbackImage: PLACEHOLDER_IMG("D"),
  },
  {
    id: "jerry",
    name: "Jerry",
    personality: "The scaredy-cat.",
    signaturePhrase: "Bee-do! Bee-do!",
    role: "Safety Monitor",
    image: MINION_IMAGE("jerry"),
    fallbackImage: PLACEHOLDER_IMG("J"),
  },
  {
    id: "carl",
    name: "Carl",
    personality: "The siren-obsessed.",
    signaturePhrase: "Bello, Papa-ga-yo!",
    role: "Siren Enthusiast",
    image: MINION_IMAGE("carl"),
    fallbackImage: PLACEHOLDER_IMG("C"),
  },
  {
    id: "otto",
    name: "Otto",
    personality: "The talkative one.",
    signaturePhrase: "Poka?",
    role: "Communications",
    image: MINION_IMAGE("otto"),
    fallbackImage: PLACEHOLDER_IMG("O"),
  },
];
