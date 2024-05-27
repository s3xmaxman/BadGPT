import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface FormProps {
  chatId: Id<"chats">;
}

const Form = ({ chatId }: FormProps) => {
  const chat = useQuery(api.chats.get, { id: chatId });
  const sendMessage = useAction(api.messages.submit);

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (chat === null) {
    return null;
  }

  if (chat === undefined) {
    return <div>Loading...</div>;
  }

  const handleSendMessage = async () => {
    if (message === "" || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const temp = message;
      setMessage("");
      await sendMessage({
        role: "user",
        content: temp,
        chatId: chat._id,
      });
    } catch (error) {
      console.error("Error sending message:", error);
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

export default Form;
