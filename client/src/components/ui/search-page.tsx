import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "./input";
import { Button } from "./button";
import { PostCard } from "./post-card";
import { Search, X, Hash, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Post } from "@shared/schema";

interface SearchPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularTags = [
  "#helpme", "#funny", "#advice", "#drama", "#college", "#work", 
  "#relationships", "#family", "#money", "#politics", "#fml", "#lol",
  "#rant", "#confession", "#tea", "#gossip", "#support", "#validation"
];

const categories = [
  { id: "all", label: "All", emoji: "" },
  { id: "college", label: "College", emoji: "🎓" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "relationships", label: "Relationships", emoji: "💕" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧‍👦" },
  { id: "money", label: "Money", emoji: "💰" },
  { id: "politics", label: "Politics", emoji: "🗳️" },
  { id: "drama", label: "Am I in the Wrong?", emoji: "🎭" },
];

export function SearchPage({ isOpen, onClose }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("");

  const { data: allPosts = [] } = useQuery<Post[]>({
    queryKey: ["/api/posts", { category: "all", sortBy: "new" }],
    queryFn: async () => {
      const response = await fetch("/api/posts?sortBy=new");
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
    enabled: isOpen,
  });

  const filteredPosts = useMemo(() => {
    let filtered = allPosts;

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.alias.toLowerCase().includes(query) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags && post.tags.some(tag => 
          tag.toLowerCase() === selectedTag.toLowerCase()
        )
      );
    }

    return filtered;
  }, [allPosts, searchQuery, selectedCategory, selectedTag]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTag("");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedTag;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, tags, or users..."
                className="pl-10 pr-4"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters */}
          <div className="mt-4 space-y-3">
            {/* Category Filter */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    selectedCategory === category.id
                      ? "bg-purple-500 text-white dark:bg-purple-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  )}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.emoji && <span className="mr-1">{category.emoji}</span>}
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Popular Tags */}
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Hash className="h-3 w-3 mr-1" />
                Popular Tags
              </p>
              <div className="flex flex-wrap gap-1">
                {popularTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs px-2 py-1 rounded transition-colors",
                      selectedTag === tag
                        ? "bg-purple-500 text-white dark:bg-purple-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                    )}
                    onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!hasActiveFilters ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Search TeaSpill
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Search for posts, tags, or browse by category
              </p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🤷‍♀️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filters
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="text-purple-600 border-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-400 dark:hover:bg-purple-900/20"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}