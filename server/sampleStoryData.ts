import type { IStorage } from "./storage";
import type { InsertPost, InsertReaction, InsertComment } from "@shared/schema";

export async function seedSampleStoryData(storage: IStorage) {
  const sampleStories: InsertPost[] = [
    {
      content: "I was walking home alone at 2 AM when I heard footsteps behind me. Every time I stopped, they stopped. When I started running, they started running too. I turned around and... it was just my echo bouncing off the buildings, but my heart was pounding for hours afterward.",
      category: "story",
      storyType: "horror",
      tags: ["scary", "alone", "nighttime", "paranormal"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "My crush accidentally sent me a voice message meant for their best friend talking about how much they like me. I pretended I never heard it and we've been dating for 3 years now. They still don't know I heard that message first.",
      category: "story", 
      storyType: "romantic",
      tags: ["love", "crush", "relationship", "secret"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "I once ate an entire birthday cake that my roommate left in the fridge, thinking it was for everyone. Turns out it was for their mom's 60th birthday party the next day. I had to drive to 5 different stores at midnight to find ingredients to bake a replacement cake.",
      category: "story",
      storyType: "embarrassing",
      tags: ["food", "mistake", "roommate", "birthday"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "My neighbor has been leaving increasingly weird items on my doorstep for months. Started with cookies, then moved to rubber ducks, then tiny toy dinosaurs, and last week I found a single sock with 'CHOOSE WISELY' written on it. I'm both terrified and intrigued.",
      category: "story",
      storyType: "weird",
      tags: ["neighbor", "mystery", "strange", "gifts"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "I discovered my cat has been sneaking out at night and apparently has a whole second life. My neighbor showed me videos of my cat leading a gang of neighborhood cats in elaborate heists of garbage cans. My cat is basically a crime boss.",
      category: "story",
      storyType: "funny", 
      tags: ["cat", "pets", "funny", "crime", "sneaky"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "I was alone in the library late at night when all the lights suddenly went out. I used my phone flashlight and saw that all the books had been rearranged to spell out messages. I ran out and never went back to study alone.",
      category: "story",
      storyType: "horror",
      tags: ["library", "scary", "alone", "supernatural", "books"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "I accidentally sent a love letter meant for my crush to my professor instead. The professor replied with grammar corrections and a grade (B+). My crush still doesn't know about the letter, but my professor keeps asking about my 'romantic literature projects.'",
      category: "story",
      storyType: "embarrassing",
      tags: ["school", "professor", "love", "mistake", "awkward"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "Every morning at exactly 7:23 AM, a man in a bright yellow raincoat walks past my window backwards while juggling oranges. Rain or shine, he's always there. I've never seen his face and I'm too afraid to look outside at 7:22 to see where he comes from.",
      category: "story",
      storyType: "weird",
      tags: ["morning", "routine", "stranger", "mystery", "juggling"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "My dog somehow learned to order food delivery. I came home to find three pizza boxes, two bags of Chinese food, and a very guilty-looking Golden Retriever. The delivery drivers said a 'very polite customer' had been ordering all week. Apparently my dog has better manners than most humans.",
      category: "story",
      storyType: "funny",
      tags: ["dog", "pets", "food", "delivery", "smart"],
      allowComments: true,
      communitySection: "story-time",
    },
    {
      content: "I met my partner when we both got stuck in an elevator for 6 hours. We started as strangers, shared our deepest fears and dreams, and by the time rescue came, we knew we were meant to be together. We got married in that same elevator a year later.",
      category: "story",
      storyType: "romantic",
      tags: ["elevator", "stuck", "meeting", "marriage", "fate"],
      allowComments: true,
      communitySection: "story-time",
    }
  ];

  console.log("[Sample Data] Creating sample story posts...");
  
  for (const story of sampleStories) {
    try {
      const post = await storage.createPost(story);
      
      // Add some sample reactions and comments to make them feel more real
      const reactionTypes = ["thumbsUp", "laugh", "sad"];
      const randomReactions = Math.floor(Math.random() * 15) + 1;
      
      for (let i = 0; i < randomReactions; i++) {
        const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
        await storage.createReaction({
          type: reactionType,
          postId: post.id,
          sessionId: `sample_session_${i}`,
        } as InsertReaction);
      }
      
      // Add some sample comments
      const sampleComments = [
        "This is wild! 😱",
        "No way this actually happened",
        "I need to hear more about this story!",
        "This made my day 😂",
        "Relatable content right here",
        "Plot twist incoming...",
        "This is giving me chills",
        "Your storytelling is amazing!"
      ];
      
      const commentCount = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < commentCount; i++) {
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        await storage.createComment({
          content: randomComment,
          postId: post.id,
          sessionId: `sample_session_comment_${i}`,
        } as InsertComment);
      }
      
      console.log(`[Sample Data] Created story: ${story.storyType} - ${story.content.substring(0, 50)}...`);
    } catch (error) {
      console.error(`[Sample Data] Failed to create story:`, error);
    }
  }
  
  console.log("[Sample Data] Finished creating sample story posts");
}

export function shouldSeedSampleData(): boolean {
  // Only seed in development environment
  return process.env.NODE_ENV === 'development';
}