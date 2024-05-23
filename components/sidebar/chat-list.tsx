"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

export const ChatList = () => {
  const chats = useQuery(api.chats.list);
  const router = useRouter();
  const { chatId } = useParams<{ chatId: Id<"chats"> }>();

  if (chats === undefined) {
    return <div>Loading...</div>;
  }

  if (chats === null) {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {chats.map((chat) => (
        <div>{chat.title}</div>
      ))}
    </div>
  );
};
