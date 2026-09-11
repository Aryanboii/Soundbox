"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { followUser, unfollowUser } from "@/lib/social/actions";

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      try {
        if (next) await followUser(targetUserId);
        else await unfollowUser(targetUserId);
        router.refresh();
      } catch {
        setFollowing(!next);
      }
    });
  }

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
