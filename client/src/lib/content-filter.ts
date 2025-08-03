export function filterContent(content: string): string {
  // Basic content filtering - in production, this would be more sophisticated
  const inappropriateWords = [
    'spam', 'scam', 'fake', 'bot', 'advertisement', 'promo',
    // Add more inappropriate words as needed
  ];

  let filtered = content;
  inappropriateWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });

  return filtered;
}

export function containsInappropriateContent(content: string): boolean {
  const filtered = filterContent(content);
  return filtered !== content;
}

export function validatePostContent(content: string): { isValid: boolean; error?: string } {
  if (!content.trim()) {
    return { isValid: false, error: "Content cannot be empty" };
  }

  if (content.length > 500) {
    return { isValid: false, error: "Content must be 500 characters or less" };
  }

  if (containsInappropriateContent(content)) {
    return { isValid: false, error: "Content contains inappropriate language" };
  }

  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]+/gi, // URLs
    /\b\d{10,}\b/, // Long numbers (phone numbers, etc.)
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(content)) {
      return { isValid: false, error: "Content appears to be spam" };
    }
  }

  return { isValid: true };
}
