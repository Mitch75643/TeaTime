export function generateAlias(): string {
  const adjectives = [
    'Tired', 'Stressed', 'Confused', 'Drama', 'Anonymous', 'Secret', 'Mystery', 'Random',
    'Lonely', 'Frustrated', 'Worried', 'Anxious', 'Hopeful', 'Bitter', 'Salty', 'Spicy',
    'Sleepy', 'Busy', 'Chaotic', 'Peaceful', 'Wild', 'Calm', 'Bold', 'Shy'
  ];
  
  const nouns = [
    'Student', 'Intern', 'Employee', 'Person', 'Soul', 'Human', 'Individual', 'Being',
    'Queen', 'King', 'Philosopher', 'Wanderer', 'Dreamer', 'Thinker', 'Observer',
    'Writer', 'Listener', 'Watcher', 'Seeker', 'Fighter', 'Lover', 'Survivor'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}${noun}${number}`;
}

export function getAliasColor(alias: string): string {
  // Generate consistent color based on alias
  const colors = [
    'from-purple-400 to-pink-400',
    'from-blue-400 to-purple-400',
    'from-green-400 to-blue-400',
    'from-yellow-400 to-orange-400',
    'from-pink-400 to-red-400',
    'from-indigo-400 to-purple-400',
    'from-teal-400 to-green-400',
    'from-orange-400 to-red-400',
  ];

  let hash = 0;
  for (let i = 0; i < alias.length; i++) {
    hash = alias.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
