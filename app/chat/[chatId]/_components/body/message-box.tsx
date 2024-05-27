import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import React, { useState } from "react";
import { Markdown } from "./markdown";
import { Copy, RefreshCcw } from "lucide-react";
import { useAction } from "convex/react"; // useAction をインポート
import { toast } from "sonner";

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
  const imageUrl = message.role === "user" ? userImageUrl : "/BadGPT.png";
  const [isLoading, setIsLoading] = useState(false);

  // regenerate アクションを使用
  const regenerate = useAction(api.messages.regenerate);

  // regenerate アクションを実行するハンドラーを定義
  const handleRegenerate = async () => {
    try {
      setIsLoading(true);
      await regenerate({ chatId });
    } catch (error) {
      console.error("Failed to regenerate message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    toast("メッセージをコピーしました");
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
      <div className="flex items-center space-x-3">
        <Copy className="w-4 h-4 cursor-pointer" onClick={copyToClipboard} />
        {message.role === "assistant" && isLatestMessage && !isLoading && (
          <RefreshCcw
            className="w-4 h-4 cursor-pointer"
            onClick={handleRegenerate}
          />
        )}
      </div>
    </div>
  );
};

export default MessageBox;
