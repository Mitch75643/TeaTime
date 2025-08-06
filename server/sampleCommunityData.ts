import type { IStorage } from "./storage";
import type { InsertPost, InsertReaction, InsertComment } from "@shared/schema";

export async function seedSampleCommunityData(storage: IStorage) {
  // Sample posts for each community topic
  const sampleCommunityPosts: InsertPost[] = [
    // Celebrity Tea
    {
      content: "Did anyone else notice that Taylor Swift and Travis Kelce were wearing matching bracelets at the game? The details are everything! 💫",
      category: "celebrity",
      tags: ["taylor swift", "travis kelce", "matching", "details"],
      allowComments: true,
      communitySection: "celebrity-tea",
    },
    {
      content: "The way Zendaya handles paparazzi with such grace is honestly inspiring. She's a whole mood and I'm here for it ✨",
      category: "celebrity",
      tags: ["zendaya", "paparazzi", "grace", "inspiring"],
      allowComments: true,
      communitySection: "celebrity-tea",
    },
    {
      content: "Ryan Reynolds' Twitter replies are literally the best part of social media. His wit is unmatched 😂",
      category: "celebrity", 
      tags: ["ryan reynolds", "twitter", "funny", "witty"],
      allowComments: true,
      communitySection: "celebrity-tea",
    },
    
    // Hot Topics  
    {
      content: "The new iPhone update is making everyone's battery die faster. Apple really said 'planned obsolescence' with their whole chest 📱",
      category: "technology",
      tags: ["iphone", "battery", "apple", "update"],
      allowComments: true,
      communitySection: "hot-topics",
      hotTopicType: "technology",
    },
    {
      content: "Gas prices going up again right before summer travel season. It's like they planned this perfectly 🚗💸",
      category: "current events",
      tags: ["gas prices", "summer", "travel", "economy"],
      allowComments: true,
      communitySection: "hot-topics", 
      hotTopicType: "current events",
    },
    {
      content: "New dating app trends are getting weird. Now there's one where you can only message through voice notes? What's next? 🎤",
      category: "social media",
      tags: ["dating apps", "voice notes", "trends", "social media"],
      allowComments: true,
      communitySection: "hot-topics",
      hotTopicType: "social media",
    },
    
    // Daily Debate (these will be auto-generated as Yes/No polls)
    {
      content: "Should pineapple on pizza be illegal?",
      category: "debate",
      tags: ["pineapple", "pizza", "food", "controversial"],
      allowComments: true,
      communitySection: "daily-debate",
      isDebatePost: true,
    },
    {
      content: "Is it okay to ghost someone after a bad first date?",
      category: "debate",
      tags: ["dating", "ghosting", "relationships", "ethics"],
      allowComments: true,
      communitySection: "daily-debate", 
      isDebatePost: true,
    },
    
    // Tea Experiments (polls with custom options)
    {
      content: "If you could only eat one cuisine for the rest of your life, what would it be?",
      category: "experiment", 
      tags: ["food", "cuisine", "choices", "forever"],
      allowComments: true,
      communitySection: "tea-experiments",
      pollOptions: ["Italian", "Japanese", "Mexican", "Indian", "Mediterranean", "Thai"],
    },
    {
      content: "What's the most important quality in a friend?",
      category: "experiment",
      tags: ["friendship", "qualities", "relationships", "values"],
      allowComments: true,
      communitySection: "tea-experiments",
      pollOptions: ["Loyalty", "Honesty", "Humor", "Reliability", "Empathy", "Spontaneity"],
    },
  ];

  console.log("[Sample Data] Creating sample community posts...");
  
  for (const post of sampleCommunityPosts) {
    try {
      const createdPost = await storage.createPost(post);
      
      // Add some sample reactions
      const reactionTypes = ["thumbsUp", "laugh", "heart", "fire"];
      const randomReactions = Math.floor(Math.random() * 18) + 5; // 5-22 reactions
      
      for (let i = 0; i < randomReactions; i++) {
        const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
        await storage.createReaction({
          type: reactionType,
          postId: createdPost.id,
          sessionId: `sample_community_${i}_${Math.random()}`,
        } as InsertReaction);
      }
      
      // Add sample poll votes if it's a poll/debate post
      if (post.isDebatePost) {
        // Add Yes/No votes for debate posts
        const yesVotes = Math.floor(Math.random() * 25) + 10;
        const noVotes = Math.floor(Math.random() * 20) + 8;
        
        for (let i = 0; i < yesVotes; i++) {
          await storage.createPollVote({
            postId: createdPost.id,
            sessionId: `sample_debate_yes_${i}_${Math.random()}`,
            option: "Yes",
          });
        }
        
        for (let i = 0; i < noVotes; i++) {
          await storage.createPollVote({
            postId: createdPost.id,
            sessionId: `sample_debate_no_${i}_${Math.random()}`,
            option: "No",
          });
        }
      } else if (post.pollOptions) {
        // Add votes for tea experiment polls
        const totalVotes = Math.floor(Math.random() * 40) + 15;
        for (let i = 0; i < totalVotes; i++) {
          const randomOption = post.pollOptions[Math.floor(Math.random() * post.pollOptions.length)];
          await storage.createPollVote({
            postId: createdPost.id,
            sessionId: `sample_poll_${i}_${Math.random()}`,
            option: randomOption,
          });
        }
      }
      
      // Add some sample comments
      const sampleComments = [
        "This is such a hot take!",
        "Finally someone said it 🔥",
        "I totally disagree but respect your opinion",
        "This is exactly what I've been thinking",
        "Spicy content right here ☕",
        "The tea is HOT today",
        "Controversial but I'm here for it",
        "This sparked a whole conversation at dinner"
      ];
      
      const commentCount = Math.floor(Math.random() * 6) + 2; // 2-7 comments
      for (let i = 0; i < commentCount; i++) {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        await storage.createComment({
          content: randomComment,
          postId: createdPost.id,
          sessionId: `sample_community_comment_${i}_${Math.random()}`,
        } as InsertComment);
      }
      
      console.log(`[Sample Data] Created community post: ${post.communitySection} - ${post.content.substring(0, 50)}...`);
    } catch (error) {
      console.error(`[Sample Data] Failed to create community post:`, error);
    }
  }
  
  console.log("[Sample Data] Finished creating sample community posts");
}