"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./message-box";
import DuckGoResults from "./duckGo";

interface BodyProps {
  chatId: Id<"chats">;
}

const Body = ({ chatId }: BodyProps) => {
  const messages = useQuery(api.messages.list, { chatId }) || [];
  const { user } = useUser();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottom();
  }, [messages]);

  const scrollBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  return (
    <>
      <ScrollArea className="max-h-[calc(100%-150px)] h-full w-full flex-1">
        <div className="px-4 sm:px-12 md:px-52 2xl:px-[430px] relative">
          {messages?.map((message, index) => (
            <MessageBox
              key={message._id}
              message={message}
              userImageUrl={user?.imageUrl}
              chatId={chatId}
              duckGo={message.duckGo}
              isLatestMessage={index === messages.length - 1}
            />
          ))}
        </div>
        <div ref={scrollRef} />
      </ScrollArea>
    </>
  );
};

export default Body;
