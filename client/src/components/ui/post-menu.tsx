import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Button } from "./button";
import { MoreHorizontal, Trash2, Flag, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PostMenuProps {
  postId: string;
  isOwner?: boolean;
}

export function PostMenu({ postId, isOwner = false }: PostMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been removed from the community.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest("POST", "/api/reports", {
        postId,
        reason,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: data.postRemoved ? "Post removed" : "Report submitted",
        description: data.postRemoved 
          ? "The post has been removed due to multiple reports. The user has been flagged."
          : "Thank you for helping keep our community safe.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReport = (reason: string) => {
    reportMutation.mutate(reason);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {isOwner ? (
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete post
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => handleReport("spam")}>
                <Flag className="h-4 w-4 mr-2" />
                Report as Spam
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReport("harassment")}>
                <Flag className="h-4 w-4 mr-2" />
                Report Harassment
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReport("inappropriate")}>
                <Flag className="h-4 w-4 mr-2" />
                Report Inappropriate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleReport("other")}>
                <Flag className="h-4 w-4 mr-2" />
                Report Other Issue
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}