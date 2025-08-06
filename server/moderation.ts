import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ModerationResult {
  flagged: boolean;
  severityLevel: 1 | 2 | 3;
  categories: string[];
  action: 'allow' | 'hide' | 'review';
  supportMessage?: string;
  resources?: Array<{
    title: string;
    url: string;
    phone?: string;
  }>;
}

export interface ModerationCategories {
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  'harassment': boolean;
  'harassment/threatening': boolean;
  'hate': boolean;
  'hate/threatening': boolean;
  'violence': boolean;
  'violence/graphic': boolean;
}

const mentalHealthResources = [
  {
    title: "988 Suicide & Crisis Lifeline",
    url: "https://988lifeline.org",
    phone: "988"
  },
  {
    title: "Crisis Text Line",
    url: "https://www.crisistextline.org",
    phone: "Text HOME to 741741"
  },
  {
    title: "National Alliance on Mental Illness",
    url: "https://www.nami.org/help",
    phone: "1-800-950-NAMI (6264)"
  },
  {
    title: "International Association for Suicide Prevention",
    url: "https://www.iasp.info/resources/Crisis_Centres/",
  }
];

const supportMessages = {
  level3: "Hey, it sounds like you're going through something really tough. You're not alone, and there are people who want to help. 💛",
  level2: "We noticed you might be having a difficult time. Remember that reaching out for support is a sign of strength.",
  level1: "Take care of yourself. If you're struggling, there are resources available to help."
};

export async function moderateContent(content: string): Promise<ModerationResult> {
  try {
    const moderation = await openai.moderations.create({
      input: content,
    });

    const result = moderation.results[0];
    const categories = result.categories as ModerationCategories;
    
    // Determine severity level based on specific categories
    let severityLevel: 1 | 2 | 3 = 1;
    let action: 'allow' | 'hide' | 'review' = 'allow';
    let supportMessage: string | undefined;
    let resources: typeof mentalHealthResources | undefined;

    // Level 3 - Critical: Active harm, specific threats
    if (categories['self-harm/intent'] || 
        categories['self-harm/instructions'] || 
        categories['violence/graphic'] ||
        categories['harassment/threatening'] ||
        categories['hate/threatening']) {
      severityLevel = 3;
      action = 'hide';
      supportMessage = supportMessages.level3;
      resources = mentalHealthResources;
    }
    // Level 2 - Concerning: General self-harm discussion, harassment
    else if (categories['self-harm'] || 
             categories['harassment'] || 
             categories['violence'] ||
             categories['hate']) {
      severityLevel = 2;
      action = 'review';
      supportMessage = supportMessages.level2;
      resources = mentalHealthResources.slice(0, 2); // Show fewer resources
    }
    // Level 1 - Watch: Mild concerning content
    else if (result.flagged) {
      severityLevel = 1;
      action = 'allow';
      supportMessage = supportMessages.level1;
    }

    const flaggedCategories = Object.entries(categories)
      .filter(([_, flagged]) => flagged)
      .map(([category]) => category);

    return {
      flagged: result.flagged,
      severityLevel,
      categories: flaggedCategories,
      action,
      supportMessage,
      resources
    };

  } catch (error: any) {
    console.error('Moderation API error:', error);
    
    // Handle quota exceeded gracefully
    if (error.status === 429 || error.code === 'insufficient_quota') {
      console.log('[Moderation] OpenAI quota exceeded - allowing content with basic checks');
      return {
        flagged: false,
        severityLevel: 1,
        categories: [],
        action: 'allow'
      };
    }
    
    // Fail safely - allow content but log the error
    return {
      flagged: false,
      severityLevel: 1,
      categories: [],
      action: 'allow'
    };
  }
}

// Additional keyword-based checks for context that OpenAI might miss
export function additionalModerationChecks(content: string): Partial<ModerationResult> {
  const lowerContent = content.toLowerCase();
  
  // Suicide-related keywords
  const suicideKeywords = [
    'want to die', 'kill myself', 'end it all', 'suicide', 'suicidal',
    'not worth living', 'better off dead', 'ending my life'
  ];
  
  // Self-harm keywords
  const selfHarmKeywords = [
    'cutting myself', 'self harm', 'hurt myself', 'self-harm',
    'razor blade', 'cutting', 'burning myself'
  ];

  // Check for concerning patterns
  const hasSuicideContent = suicideKeywords.some(keyword => lowerContent.includes(keyword));
  const hasSelfHarmContent = selfHarmKeywords.some(keyword => lowerContent.includes(keyword));

  if (hasSuicideContent) {
    return {
      flagged: true,
      severityLevel: 3,
      categories: ['self-harm/intent'],
      action: 'hide',
      supportMessage: supportMessages.level3,
      resources: mentalHealthResources
    };
  }

  if (hasSelfHarmContent) {
    return {
      flagged: true,
      severityLevel: 2,
      categories: ['self-harm'],
      action: 'review',
      supportMessage: supportMessages.level2,
      resources: mentalHealthResources.slice(0, 2)
    };
  }

  return {};
}

export async function comprehensiveModeration(content: string): Promise<ModerationResult> {
  // Run both AI and keyword-based moderation
  const [aiResult, keywordResult] = await Promise.all([
    moderateContent(content),
    Promise.resolve(additionalModerationChecks(content))
  ]);

  // Use the more severe result
  if (keywordResult.severityLevel && keywordResult.severityLevel > aiResult.severityLevel) {
    return { ...aiResult, ...keywordResult };
  }

  return aiResult;
}