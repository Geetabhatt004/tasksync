import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  users: { id: number; name: string; image?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function AvatarGroup({ users, max = 4, size = "md" }: AvatarGroupProps) {
  const sizeClasses = {
    sm: "h-6 w-6 border-[1.5px]",
    md: "h-8 w-8 border-2",
    lg: "h-10 w-10 border-2",
  };

  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className="flex -space-x-2">
      {displayUsers.map((user) => (
        <Avatar
          key={user.id}
          className={cn(
            sizeClasses[size],
            "border-white rounded-full"
          )}
        >
          {user.image ? (
            <AvatarImage src={user.image} alt={user.name} />
          ) : (
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          )}
        </Avatar>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            sizeClasses[size],
            "bg-gray-200 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium"
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
