// Pre-made avatar collection for Tfess
// Using SVG-based avatars for copyright-free, customizable profile pictures

export interface Avatar {
  id: string;
  name: string;
  category: 'moods' | 'animals' | 'objects' | 'characters';
  svg: string;
}

export const avatars: Avatar[] = [
  // Mood-based avatars
  {
    id: 'happy-face',
    name: 'Happy Vibes',
    category: 'moods',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FFE4B5" stroke="#DEB887" stroke-width="3"/>
      <circle cx="35" cy="40" r="4" fill="#8B4513"/>
      <circle cx="65" cy="40" r="4" fill="#8B4513"/>
      <path d="M 30 65 Q 50 80 70 65" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="25" cy="45" r="6" fill="#FF69B4" opacity="0.7"/>
      <circle cx="75" cy="45" r="6" fill="#FF69B4" opacity="0.7"/>
    </svg>`
  },
  {
    id: 'wink-face',
    name: 'Wink Queen',
    category: 'moods',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#F0E68C" stroke="#DAA520" stroke-width="3"/>
      <circle cx="35" cy="40" r="4" fill="#8B4513"/>
      <path d="M 60 35 Q 65 40 70 35" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 35 60 Q 50 70 65 60" stroke="#8B4513" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 45 25 Q 50 20 55 25" stroke="#8B4513" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'sassy-face',
    name: 'Sassy Energy',
    category: 'moods',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FFB6C1" stroke="#FF1493" stroke-width="3"/>
      <circle cx="35" cy="40" r="4" fill="#8B0000"/>
      <circle cx="65" cy="40" r="4" fill="#8B0000"/>
      <path d="M 40 65 Q 50 60 60 65" stroke="#8B0000" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 25 35 Q 35 30 40 35" stroke="#8B0000" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 60 35 Q 65 30 75 35" stroke="#8B0000" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'sleepy-face',
    name: 'Sleepy Mood',
    category: 'moods',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#E6E6FA" stroke="#9370DB" stroke-width="3"/>
      <path d="M 30 40 Q 35 35 40 40" stroke="#4B0082" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 60 40 Q 65 35 70 40" stroke="#4B0082" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="65" rx="8" ry="4" fill="#4B0082"/>
      <path d="M 20 30 Q 25 25 30 30" stroke="#9370DB" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 70 30 Q 75 25 80 30" stroke="#9370DB" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'shocked-face',
    name: 'Tea Shocked',
    category: 'moods',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FFF8DC" stroke="#F0E68C" stroke-width="3"/>
      <circle cx="35" cy="40" r="6" fill="#000"/>
      <circle cx="65" cy="40" r="6" fill="#000"/>
      <ellipse cx="50" cy="65" rx="6" ry="10" fill="#000"/>
      <path d="M 30 20 L 35 15 M 40 15 L 45 20" stroke="#F0E68C" stroke-width="2" stroke-linecap="round"/>
      <path d="M 70 20 L 65 15 M 60 15 L 55 20" stroke="#F0E68C" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },

  // Animal avatars
  {
    id: 'tea-cat',
    name: 'Tea Cat',
    category: 'animals',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="55" rx="35" ry="30" fill="#FFB347" stroke="#FF8C00" stroke-width="2"/>
      <polygon points="25,35 35,20 40,35" fill="#FFB347" stroke="#FF8C00" stroke-width="2"/>
      <polygon points="60,35 65,20 75,35" fill="#FFB347" stroke="#FF8C00" stroke-width="2"/>
      <circle cx="40" cy="50" r="3" fill="#000"/>
      <circle cx="60" cy="50" r="3" fill="#000"/>
      <polygon points="47,60 50,65 53,60" fill="#FF69B4"/>
      <path d="M 35 65 Q 50 75 65 65" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 30 55 L 25 55 M 70 55 L 75 55" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'gossip-bird',
    name: 'Gossip Bird',
    category: 'animals',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="55" rx="30" ry="25" fill="#98FB98" stroke="#32CD32" stroke-width="2"/>
      <circle cx="45" cy="45" r="8" fill="#FFF"/>
      <circle cx="45" cy="45" r="4" fill="#000"/>
      <polygon points="30,55 15,50 30,60" fill="#FFA500"/>
      <path d="M 20 40 Q 25 35 30 40" stroke="#32CD32" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="65" cy="40" rx="8" ry="15" fill="#98FB98" stroke="#32CD32" stroke-width="2"/>
      <path d="M 35 70 Q 50 75 65 70" stroke="#32CD32" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'drama-frog',
    name: 'Drama Frog',
    category: 'animals',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="60" rx="35" ry="25" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
      <circle cx="35" cy="40" r="12" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
      <circle cx="65" cy="40" r="12" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
      <circle cx="35" cy="38" r="6" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
      <circle cx="65" cy="38" r="6" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
      <circle cx="35" cy="38" r="3" fill="#000"/>
      <circle cx="65" cy="38" r="3" fill="#000"/>
      <ellipse cx="50" cy="70" rx="15" ry="8" fill="#FF69B4"/>
    </svg>`
  },

  // Object avatars
  {
    id: 'spilled-tea',
    name: 'Spilled Tea',
    category: 'objects',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="45" cy="70" rx="25" ry="8" fill="#DEB887" opacity="0.6"/>
      <path d="M 30 50 Q 35 45 45 50 L 50 70 Q 45 75 35 70 Z" fill="#8B4513"/>
      <ellipse cx="42" cy="55" rx="8" ry="12" fill="#FFF"/>
      <path d="M 55 45 Q 60 40 70 45 Q 75 50 70 55 Q 60 60 55 55 Z" fill="#8B4513"/>
      <circle cx="20" cy="30" r="3" fill="#DEB887"/>
      <circle cx="75" cy="35" r="2" fill="#DEB887"/>
      <circle cx="80" cy="60" r="2.5" fill="#DEB887"/>
      <path d="M 25 65 Q 30 60 35 65" stroke="#DEB887" stroke-width="2" fill="none"/>
    </svg>`
  },
  {
    id: 'cool-sunglasses',
    name: 'Cool Vibes',
    category: 'objects',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="#FFE4E1" stroke="#FFC0CB" stroke-width="3"/>
      <rect x="20" y="35" width="25" height="20" rx="10" fill="#000"/>
      <rect x="55" y="35" width="25" height="20" rx="10" fill="#000"/>
      <rect x="42" y="40" width="16" height="4" fill="#000"/>
      <path d="M 35 65 Q 50 75 65 65" stroke="#FF69B4" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 15 40 Q 20 35 25 40" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 75 40 Q 80 35 85 40" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'lipstick-kiss',
    name: 'Lipstick Kiss',
    category: 'objects',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="#FFE4E1" stroke="#FF1493" stroke-width="3"/>
      <circle cx="40" cy="45" r="3" fill="#8B4513"/>
      <circle cx="60" cy="45" r="3" fill="#8B4513"/>
      <path d="M 40 65 Q 45 70 50 65 Q 55 70 60 65" fill="#DC143C" stroke="#B22222" stroke-width="1"/>
      <rect x="65" y="25" width="6" height="20" fill="#DC143C"/>
      <rect x="63" y="20" width="10" height="8" fill="#DC143C"/>
      <path d="M 25 35 Q 30 30 35 35" stroke="#FF69B4" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },

  // Character avatars
  {
    id: 'meme-face',
    name: 'Meme Energy',
    category: 'characters',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="#FFFF99" stroke="#FFD700" stroke-width="3"/>
      <circle cx="40" cy="40" r="4" fill="#000"/>
      <circle cx="60" cy="40" r="4" fill="#000"/>
      <path d="M 30 65 Q 50 80 70 65" stroke="#000" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 20 45 Q 25 40 30 45" stroke="#FFD700" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 70 45 Q 75 40 80 45" stroke="#FFD700" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="35" cy="55" r="2" fill="#FF0000"/>
      <circle cx="65" cy="55" r="2" fill="#FF0000"/>
    </svg>`
  },
  {
    id: 'alien-tea',
    name: 'Alien Tea',
    category: 'characters',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="50" rx="35" ry="40" fill="#98FB98" stroke="#00FF00" stroke-width="2"/>
      <ellipse cx="35" cy="35" rx="8" ry="12" fill="#000"/>
      <ellipse cx="65" cy="35" rx="8" ry="12" fill="#000"/>
      <ellipse cx="35" cy="33" rx="3" ry="5" fill="#FFF"/>
      <ellipse cx="65" cy="33" rx="3" ry="5" fill="#FFF"/>
      <ellipse cx="50" cy="65" rx="6" ry="3" fill="#000"/>
      <circle cx="30" cy="15" r="4" fill="#98FB98"/>
      <circle cx="70" cy="15" r="4" fill="#98FB98"/>
      <circle cx="30" cy="13" r="2" fill="#00FF00"/>
      <circle cx="70" cy="13" r="2" fill="#00FF00"/>
    </svg>`
  },
  {
    id: 'robot-gossip',
    name: 'Robot Gossip',
    category: 'characters',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="35" width="50" height="45" rx="10" fill="#C0C0C0" stroke="#808080" stroke-width="2"/>
      <rect x="30" y="40" width="15" height="10" rx="2" fill="#FF0000"/>
      <rect x="55" y="40" width="15" height="10" rx="2" fill="#FF0000"/>
      <rect x="40" y="60" width="20" height="8" rx="4" fill="#000"/>
      <circle cx="20" cy="30" r="3" fill="#C0C0C0"/>
      <circle cx="80" cy="30" r="3" fill="#C0C0C0"/>
      <rect x="18" y="27" width="4" height="6" fill="#808080"/>
      <rect x="78" y="27" width="4" height="6" fill="#808080"/>
      <rect x="45" y="25" width="10" height="6" fill="#00FF00"/>
    </svg>`
  },

  // Additional fun options
  {
    id: 'pizza-slice',
    name: 'Pizza Mood',
    category: 'objects',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 20 L 20 70 Q 30 80 40 70 Q 50 85 60 70 Q 70 80 80 70 Z" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
      <circle cx="40" cy="50" r="4" fill="#FF0000"/>
      <circle cx="60" cy="55" r="4" fill="#FF0000"/>
      <circle cx="45" cy="65" r="3" fill="#228B22"/>
      <circle cx="55" cy="45" r="3" fill="#228B22"/>
      <ellipse cx="35" cy="40" rx="2" ry="1" fill="#000"/>
      <ellipse cx="65" cy="40" rx="2" ry="1" fill="#000"/>
      <path d="M 45 60 Q 50 65 55 60" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'coffee-bean',
    name: 'Coffee Vibes',
    category: 'objects',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="50" rx="30" ry="40" fill="#8B4513" stroke="#654321" stroke-width="2"/>
      <path d="M 35 30 Q 50 40 65 30 Q 50 50 35 30" fill="#DEB887"/>
      <circle cx="42" cy="35" r="2" fill="#FFF"/>
      <circle cx="58" cy="35" r="2" fill="#FFF"/>
      <path d="M 45 65 Q 50 70 55 65" stroke="#FFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 25 25 Q 30 20 35 25" stroke="#8B4513" stroke-width="1" fill="none" stroke-linecap="round"/>
      <path d="M 65 25 Q 70 20 75 25" stroke="#8B4513" stroke-width="1" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'unicorn-dream',
    name: 'Unicorn Dreams',
    category: 'characters',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="55" r="35" fill="#FFE4E1" stroke="#FF69B4" stroke-width="2"/>
      <polygon points="50,15 45,35 55,35" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
      <circle cx="40" cy="45" r="3" fill="#000"/>
      <circle cx="60" cy="45" r="3" fill="#000"/>
      <path d="M 40 65 Q 50 75 60 65" stroke="#FF69B4" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 35 30 Q 40 25 45 30" stroke="#FF69B4" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M 55 30 Q 60 25 65 30" stroke="#FF69B4" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="25" cy="40" r="2" fill="#FFB6C1"/>
      <circle cx="75" cy="40" r="2" fill="#FFB6C1"/>
      <circle cx="30" cy="30" r="1.5" fill="#DDA0DD"/>
      <circle cx="70" cy="35" r="1.5" fill="#DDA0DD"/>
    </svg>`
  }
];

export const getAvatarsByCategory = (category: Avatar['category']) => {
  return avatars.filter(avatar => avatar.category === category);
};

export const getAvatarById = (id: string) => {
  return avatars.find(avatar => avatar.id === id);
};

export const categoryLabels = {
  moods: '😊 Moods',
  animals: '🐱 Animals',
  objects: '☕ Objects',
  characters: '👽 Characters'
};