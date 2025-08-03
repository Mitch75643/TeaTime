import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PostCard } from "@/components/ui/post-card";
import { PostModal } from "@/components/ui/post-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  BookOpen, 
  Flame, 
  Vote, 
  FlaskConical,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Dice6,
  Plus,
  Users,
  MessageCircle,
  Heart
} from "lucide-react";
import type { Post } from "@shared/schema";

const trendingTags = [
  { tag: "#Selena", count: 12 },
  { tag: "#Beef", count: 8 },
  { tag: "#Viral", count: 15 },
  { tag: "#Drama", count: 22 },
  { tag: "#Relationship", count: 18 }
];

const storyCategories = [
  { id: "scary", label: "😱 Scary", emoji: "😱" },
  { id: "funny", label: "😂 Funny", emoji: "😂" },
  { id: "emotional", label: "💔 Emotional", emoji: "💔" },
  { id: "shocking", label: "😲 Shocking", emoji: "😲" }
];

const dailyDebates = [
  "Is ghosting ever okay?",
  "Should friends date exes?",
  "Is texting back right away a green flag or too eager?",
  "Red flag or green flag: Someone who doesn't like dogs",
  "Is it weird to check your partner's phone?"
];

const randomPrompts = [
  "Share your most unpopular opinion",
  "What's something that shouldn't be legal but is?",
  "Describe your worst first date",
  "What's the weirdest thing you believed as a kid?",
  "Tell us about your most embarrassing moment"
];

function getTodaysDebate() {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return dailyDebates[dayOfYear % dailyDebates.length];
}

export default function Community() {
  const [activeTab, setActiveTab] = useState("celebrity");
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [promptText, setPromptText] = useState("");

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts", "community", activeTab],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const allPosts = await response.json();
      
      // Filter posts based on active tab
      switch (activeTab) {
        case "celebrity":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#celebrity", "#selena", "#beef", "#viral", "#drama"].includes(tag.toLowerCase()))
          );
        case "stories":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#story", "#scary", "#funny", "#emotional", "#shocking"].includes(tag.toLowerCase()))
          );
        case "hot":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#hot", "#spicy", "#controversial"].includes(tag.toLowerCase()))
          );
        case "debate":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#debate", "#poll", "#vote"].includes(tag.toLowerCase()))
          );
        case "experiments":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#experiment", "#help", "#advice"].includes(tag.toLowerCase()))
          );
        case "fun":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#fun", "#meme", "#random", "#lol"].includes(tag.toLowerCase()))
          );
        case "suggestions":
          return allPosts.filter((post: Post) => 
            post.tags?.some(tag => ["#suggestion", "#feature", "#feedback"].includes(tag.toLowerCase()))
          );
        default:
          return allPosts.slice(0, 10);
      }
    },
  });

  const handleCreatePost = (category: string, tags: string[] = [], prompt = "") => {
    setSelectedCategory(category);
    setSelectedTags(tags);
    setPromptText(prompt);
    setIsPostModalOpen(true);
  };

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * randomPrompts.length);
    return randomPrompts[randomIndex];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center space-x-2 mb-6">
          <Users className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Community</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="flex w-max space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <TabsTrigger value="celebrity" className="flex items-center space-x-2 px-3 py-2">
                <Star className="h-4 w-4" />
                <span>🎤 Celebrity</span>
              </TabsTrigger>
              <TabsTrigger value="stories" className="flex items-center space-x-2 px-3 py-2">
                <BookOpen className="h-4 w-4" />
                <span>📖 Stories</span>
              </TabsTrigger>
              <TabsTrigger value="hot" className="flex items-center space-x-2 px-3 py-2">
                <Flame className="h-4 w-4" />
                <span>🔥 Hot Topics</span>
              </TabsTrigger>
              <TabsTrigger value="debate" className="flex items-center space-x-2 px-3 py-2">
                <Vote className="h-4 w-4" />
                <span>🗳️ Daily Debate</span>
              </TabsTrigger>
              <TabsTrigger value="experiments" className="flex items-center space-x-2 px-3 py-2">
                <FlaskConical className="h-4 w-4" />
                <span>🧪 Experiments</span>
              </TabsTrigger>
              <TabsTrigger value="fun" className="flex items-center space-x-2 px-3 py-2">
                <Sparkles className="h-4 w-4" />
                <span>🎉 Just for Fun</span>
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="flex items-center space-x-2 px-3 py-2">
                <Lightbulb className="h-4 w-4" />
                <span>💡 Suggestions</span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Celebrity Tea */}
          <TabsContent value="celebrity" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>🎤 Celebrity Tea</span>
                </CardTitle>
                <p>Spill the latest celebrity gossip, pop culture moments, and influencer drama</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {trendingTags.map(({ tag, count }) => (
                    <Badge key={tag} variant="secondary" className="bg-white/20 text-white">
                      {tag} ({count})
                    </Badge>
                  ))}
                </div>
                <Button 
                  onClick={() => handleCreatePost("celebrity", ["#celebrity"])}
                  className="w-full bg-white text-pink-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Share Celebrity Tea
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No celebrity tea yet. Be the first to spill!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Story Time */}
          <TabsContent value="stories" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>📖 Story Time</span>
                </CardTitle>
                <p>Share personal or fictional stories with the community</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {storyCategories.map((category) => (
                    <Button
                      key={category.id}
                      onClick={() => handleCreatePost("story", [`#story`, `#${category.id}`])}
                      variant="secondary"
                      className="bg-white/20 text-white hover:bg-white/30"
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
                <Button 
                  onClick={() => handleCreatePost("story", ["#story"])}
                  className="w-full bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tell Your Story
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No stories yet. Share your first tale!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Hot Topics */}
          <TabsContent value="hot" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-5 w-5" />
                  <span>🔥 Hot Topics</span>
                </CardTitle>
                <p>Fast-moving trends and spicy community discussions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4 text-sm">
                  <p>"Is ghosting ever okay?"</p>
                  <p>"Should friends date exes?"</p>
                  <p>"Red flags in dating that people ignore?"</p>
                </div>
                <Button 
                  onClick={() => handleCreatePost("hot", ["#hot", "#spicy"])}
                  className="w-full bg-white text-red-600 hover:bg-gray-100"
                >
                  <Flame className="h-4 w-4 mr-2" />
                  Start Hot Discussion
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Flame className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hot topics yet. Heat things up!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Daily Debate */}
          <TabsContent value="debate" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Vote className="h-5 w-5" />
                  <span>🗳️ Daily Debate</span>
                </CardTitle>
                <p>Today's Question:</p>
                <p className="text-lg font-semibold">"{getTodaysDebate()}"</p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleCreatePost("debate", ["#debate", "#poll"], getTodaysDebate())}
                  className="w-full bg-white text-green-600 hover:bg-gray-100"
                >
                  <Vote className="h-4 w-4 mr-2" />
                  Join Today's Debate
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No debates yet. Share your take!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Tea Experiments */}
          <TabsContent value="experiments" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FlaskConical className="h-5 w-5" />
                  <span>🧪 Tea Experiments</span>
                </CardTitle>
                <p>Submit real-life dilemmas and let the community help decide</p>
              </CardHeader>
              <CardContent>
                <div className="text-sm mb-4">
                  <p className="mb-2">Format: "I'm thinking of [action]. Should I?"</p>
                  <p>Community votes between outcomes like an A/B test!</p>
                </div>
                <Button 
                  onClick={() => handleCreatePost("experiment", ["#experiment", "#help"])}
                  className="w-full bg-white text-purple-600 hover:bg-gray-100"
                >
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Start Experiment
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <FlaskConical className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No experiments yet. Test your ideas!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Just for Fun */}
          <TabsContent value="fun" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>🎉 Just for Fun</span>
                </CardTitle>
                <p>Memes, jokes, weird thoughts, and random rants</p>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Button 
                    onClick={() => handleCreatePost("fun", ["#fun", "#random"])}
                    className="flex-1 bg-white text-yellow-600 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Something
                  </Button>
                  <Button 
                    onClick={() => handleCreatePost("fun", ["#fun", "#random"], getRandomPrompt())}
                    variant="secondary"
                    className="bg-white/20 text-white hover:bg-white/30"
                  >
                    <Dice6 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No fun posts yet. Let's get silly!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions" className="mt-6 space-y-4">
            <Card className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>💡 Suggest Something</span>
                </CardTitle>
                <p>Share feature ideas and feedback to improve TeaSpill</p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handleCreatePost("suggestion", ["#suggestion", "#feature"])}
                  className="w-full bg-white text-cyan-600 hover:bg-gray-100"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Submit Suggestion
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No suggestions yet. Share your ideas!</p>
                </div>
              ) : (
                posts.map((post: Post) => <PostCard key={post.id} post={post} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="pb-20"></div>

      <PostModal 
        isOpen={isPostModalOpen} 
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedCategory("");
          setSelectedTags([]);
          setPromptText("");
        }}
        defaultCategory={selectedCategory}
        defaultTags={selectedTags}
        promptText={promptText}
      />
      
      <BottomNav />
    </div>
  );
}