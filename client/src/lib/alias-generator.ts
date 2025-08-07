// Fun username generator for Postyn users
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
  "StoryTeller", "DramaMama", "GossipGuru", "SecretKeeper", "TruthTeller", "Whistleblower",
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

export function generateRandomUsername(useEmoji: boolean = Math.random() > 0.5): UserAlias {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  
  let username = `${adjective}${noun}${number}`;
  
  if (useEmoji) {
    const emoji = emojiPrefixes[Math.floor(Math.random() * emojiPrefixes.length)];
    username = `${emoji}${username}`;
  }
  
  return {
    alias: username,
    hasEmoji: useEmoji,
    generated: Date.now()
  };
}

export function getUserUsername(): UserAlias {
  const saved = localStorage.getItem('userUsername');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // If parsing fails, generate new one
    }
  }
  
  // Generate new username
  const newUsername = generateRandomUsername();
  localStorage.setItem('userUsername', JSON.stringify(newUsername));
  return newUsername;
}

export function refreshUserUsername(): UserAlias {
  const newUsername = generateRandomUsername();
  localStorage.setItem('userUsername', JSON.stringify(newUsername));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('userUsernameChanged', { 
    detail: newUsername 
  }));
  
  return newUsername;
}

export function setUserUsername(username: UserAlias): void {
  localStorage.setItem('userUsername', JSON.stringify(username));
  
  // Dispatch custom event to notify components
  window.dispatchEvent(new CustomEvent('userUsernameChanged', { 
    detail: username 
  }));
}