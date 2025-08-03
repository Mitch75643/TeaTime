// Fun alias generator for TeaSpill users
const adjectives = [
  // Drama & Gossip themed
  "Spicy", "Petty", "Chaotic", "Dramatic", "Messy", "Salty", "Shady", "Sneaky",
  "Scandalous", "Juicy", "Fierce", "Savage", "Iconic", "Legendary", "Epic", "Wild",
  
  // Personality based
  "Tired", "Unhinged", "Chill", "Moody", "Quirky", "Sassy", "Witty", "Bold",
  "Mysterious", "Feisty", "Classy", "Reckless", "Smooth", "Clever", "Awkward", "Confident",
  
  // Tea/Gossip specific
  "Brewing", "Stirring", "Spilling", "Serving", "Steeping", "Piping", "Fresh", "Hot"
];

const nouns = [
  // Gossip & Drama
  "TeaSpiller", "DramaMama", "GossipGuru", "SecretKeeper", "TruthTeller", "Whistleblower",
  "TalkShow", "Commentator", "Observer", "Witness", "Storyteller", "Narrator",
  
  // Characters & Roles
  "Queen", "King", "Prince", "Princess", "Diva", "Boss", "Legend", "Icon",
  "Intern", "Student", "Worker", "Freelancer", "Neighbor", "Roommate", "Sibling", "Cousin",
  
  // Animals (fun twist)
  "Cat", "Frog", "Bird", "Butterfly", "Fox", "Wolf", "Tiger", "Lion",
  "Owl", "Raven", "Peacock", "Flamingo", "Dolphin", "Shark", "Octopus", "Penguin",
  
  // Objects/Concepts
  "Energy", "Vibe", "Mood", "Spirit", "Soul", "Mind", "Heart", "Voice",
  "Shadow", "Light", "Star", "Moon", "Sun", "Storm", "Breeze", "Fire"
];

const emojiPrefixes = [
  "💅", "👑", "🔥", "✨", "💎", "🌟", "⚡", "🎭", 
  "🦋", "🌙", "☀️", "💫", "🌸", "🌺", "🍃", "🌊"
];

export interface UserAlias {
  alias: string;
  hasEmoji: boolean;
  generated: number; // timestamp
}

export function generateRandomAlias(useEmoji: boolean = Math.random() > 0.5): UserAlias {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  
  let alias = `${adjective}${noun}${number}`;
  
  if (useEmoji) {
    const emoji = emojiPrefixes[Math.floor(Math.random() * emojiPrefixes.length)];
    alias = `${emoji}${alias}`;
  }
  
  return {
    alias,
    hasEmoji: useEmoji,
    generated: Date.now()
  };
}

export function getUserAlias(): UserAlias {
  const saved = localStorage.getItem('userAlias');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // If parsing fails, generate new one
    }
  }
  
  // Generate new alias
  const newAlias = generateRandomAlias();
  localStorage.setItem('userAlias', JSON.stringify(newAlias));
  return newAlias;
}

export function refreshUserAlias(): UserAlias {
  const newAlias = generateRandomAlias();
  localStorage.setItem('userAlias', JSON.stringify(newAlias));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('userAliasChanged', { 
    detail: newAlias 
  }));
  
  return newAlias;
}

export function setUserAlias(alias: UserAlias): void {
  localStorage.setItem('userAlias', JSON.stringify(alias));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('userAliasChanged', { 
    detail: alias 
  }));
}