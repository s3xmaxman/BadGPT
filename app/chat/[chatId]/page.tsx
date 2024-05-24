"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Header from "./_components/header";
import Body from "./_components/body";
import Form from "./_components/form";

interface ChatPageProps {
  params: {
    chatId: Id<"chats">;
  };
}

const Chat = (params: ChatPageProps) => {
  const chat = useQuery(api.chats.get, { id: params.params.chatId });
  const router = useRouter();
  const chatId = params.params.chatId;

  if (chat === null) {
    router.push("/");
  }

  return (
    <div className="bg-neutral-800 w-full flex flex-col">
      <Header />
      <div className="flex flex-col h-full w-full">
        <Body chatId={chatId} />
        <div className="w-full bottom-0 fixed">
          <Form chatId={chatId} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
