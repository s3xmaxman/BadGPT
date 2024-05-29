import React, { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { duckGoSearch } from "@/lib/utils";
import { SearchResult } from "@/lib/types";

const FormWithCreate = () => {
  const createChat = useMutation(api.chats.create);
  const sendMessage = useAction(api.messages.submit);
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (message === "" || isLoading) return;

    setIsLoading(true);

    try {
      const newChatId = await createChat();
      const results = await duckGoSearch(message);

      // 検索結果をフォーマット
      const formattedResults = results
        .map(
          (result: SearchResult) =>
            `タイトル: ${result.title}\nリンク: ${result.link}\nスニペット: ${result.snippet}\n\n`
        )
        .join("");

      router.push(`/chat/${newChatId}`);

      await sendMessage({
        role: "user",
        content: message,
        chatId: newChatId,
        duckGo: formattedResults,
      });

      setMessage("");
    } catch (error) {
      console.error("Error creating chat or sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative px-2 sm:px-12 md:px-52 lg:pr-[500px] 2xl:px-96 w-full bg-neutral-800">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeydown}
        disabled={isLoading}
        className="border-[1px] border-neutral-500 ring-none rounded-xl bg-inherit text-neutral-200 placeholder:text-neutral-400 h-12"
        placeholder="BadGPTにメッセージを送信する"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 bg-opacity-50">
          <span className="text-neutral-400">送信中...</span>
        </div>
      )}
    </div>
  );
};

export default FormWithCreate;
