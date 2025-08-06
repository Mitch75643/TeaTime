import type { IStorage } from "./storage";
import type { InsertPost, InsertComment } from "@shared/schema";

export async function seedSampleHomeData(storage: IStorage) {
  // Sample posts for each category to populate the home page
  const sampleHomePosts: InsertPost[] = [
    // Family
    {
      content: "My mom just called to ask how to turn on the TV... for the third time today. She's been using the same remote for 5 years 😅",
      category: "family",
      tags: ["parents", "tech", "funny"],
      allowComments: true,
      postContext: "home",
      postType: "regular",
    },
    {
      content: "Found out my sister has been stealing my hoodies for years and has built an entire collection in her closet. The audacity!",
      category: "family", 
      tags: ["siblings", "clothes", "theft"],
      allowComments: true,
    },
    
    // Work
    {
      content: "Boss scheduled a 'quick 15-minute meeting' that somehow turned into 2 hours. Still don't know what we actually decided.",
      category: "work",
      tags: ["meetings", "boss", "time"],
      allowComments: true,
    },
    {
      content: "Coworker microwaved fish in the office kitchen again. The smell has been lingering for 3 days. We need an intervention.",
      category: "work",
      tags: ["coworker", "office", "food", "smell"],
      allowComments: true,
    },
    
    // School
    {
      content: "Professor assigned a group project and said 'choose your own groups.' The panic in everyone's eyes was visible.",
      category: "school",
      tags: ["group project", "professor", "anxiety"],
      allowComments: true,
    },
    {
      content: "Studied for the wrong exam and didn't realize until I sat down in class. Improvised my way through it somehow.",
      category: "school",
      tags: ["exam", "mistake", "study"],
      allowComments: true,
    },
    
    // Friends
    {
      content: "Friend borrowed my car 'for an hour' and returned it 6 hours later with an empty gas tank and mysterious stains.",
      category: "friends",
      tags: ["car", "borrowing", "trust"],
      allowComments: true,
    },
    {
      content: "Group chat has been arguing about where to eat dinner for 3 hours. We could have eaten at 5 different places by now.",
      category: "friends", 
      tags: ["group chat", "decisions", "food"],
      allowComments: true,
    },
    
    // Relationships
    {
      content: "Partner asked what I was thinking about and I panicked and said 'photosynthesis.' Now they think I'm really deep.",
      category: "relationships",
      tags: ["partner", "awkward", "thinking"],
      allowComments: true,
    },
    {
      content: "We've been together for 2 years and I just found out they hate pizza. How did I miss this red flag?",
      category: "relationships",
      tags: ["dating", "food preferences", "discovery"],
      allowComments: true,
    },
    
    // Other
    {
      content: "Saw a dog wearing sunglasses today and it looked cooler than I ever have in my entire life.",
      category: "other",
      tags: ["dogs", "sunglasses", "cool"],
      allowComments: true,
    },
    {
      content: "Grocery store employee asked if I found everything okay. I said yes even though I couldn't find half my list.",
      category: "other",
      tags: ["grocery store", "shopping", "social interaction"],
      allowComments: true,
    },
  ];

  console.log("[Sample Data] Creating sample home posts...");
  
  for (const post of sampleHomePosts) {
    try {
      const createdPost = await storage.createPost(post);
      
      // Add some sample reactions to make them feel real
      const reactionTypes = ["thumbsUp", "laugh", "heart"];
      const randomReactions = Math.floor(Math.random() * 12) + 3; // 3-15 reactions
      
      for (let i = 0; i < randomReactions; i++) {
        const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
        await storage.createReaction({
          type: reactionType,
          postId: createdPost.id,
          sessionId: `sample_home_${i}_${Math.random()}`,
        } as InsertReaction);
      }
      
      // Add some sample comments
      const sampleComments = [
        "So relatable! 😂",
        "This happens to me all the time",
        "I can't even...",
        "Story of my life",
        "Why is this so accurate?",
        "I felt this in my soul",
        "Same energy",
        "This made my day!"
      ];
      
      const commentCount = Math.floor(Math.random() * 4) + 1; // 1-4 comments
      for (let i = 0; i < commentCount; i++) {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        await storage.createComment({
          content: randomComment,
          postId: createdPost.id,
          sessionId: `sample_home_comment_${i}_${Math.random()}`,
        } as InsertComment);
      }
      
      console.log(`[Sample Data] Created home post: ${post.category} - ${post.content.substring(0, 50)}...`);
    } catch (error) {
      console.error(`[Sample Data] Failed to create home post:`, error);
    }
  }
  
  console.log("[Sample Data] Finished creating sample home posts");
}