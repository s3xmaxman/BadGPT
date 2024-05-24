import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import React from "react";
import { Markdown } from "./markdown";
import { RefreshCcw } from "lucide-react";
import { useAction } from "convex/react"; // useAction をインポート

interface MessageBoxProps {
  message: Doc<"messages">;
  userImageUrl?: string;
  chatId: Id<"chats">; // chatId を受け取るように変更
  isLatestMessage: boolean; // isLatestMessage プロパティを追加
}

const MessageBox = ({
  message,
  userImageUrl,
  chatId,
  isLatestMessage,
}: MessageBoxProps) => {
  const nameString = message.role === "user" ? "You" : "BadGPT";
  const imageUrl = message.role === "user" ? userImageUrl : "/logo.svg";

  // regenerate アクションを使用
  const regenerate = useAction(api.messages.regenerate);

  // regenerate アクションを実行するハンドラーを定義
  const handleRegenerate = async () => {
    try {
      await regenerate({ chatId });
    } catch (error) {
      console.error("Failed to regenerate message:", error);
    }
  };

  return (
    <div className="flex space-x-3 items-start mb-10 max-w-[calc(80%)] md:max-w-full text-wrap">
      <Avatar className="w-7 h-7 text-white fill-white">
        <AvatarImage src={imageUrl} className="text-white fill-white" />
        <AvatarFallback className="text-neutral-900 font-semibold">
          {nameString[0]}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[calc(80%)]">
        <h3 className="font-bold">{nameString}</h3>
        <div className="flex flex-grow flex-col gap-3 gap-y-5">
          <Markdown content={message.content} />
        </div>
      </div>
      {message.role === "assistant" && isLatestMessage && (
        <RefreshCcw
          className="w-4 h-4 cursor-pointer"
          onClick={handleRegenerate}
        />
      )}
    </div>
  );
};

export default MessageBox;
