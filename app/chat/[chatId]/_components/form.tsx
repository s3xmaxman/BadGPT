import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAction, useQuery } from "convex/react";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";

interface FormProps {
  chatId: Id<"chats">;
}

const Form = ({ chatId }: FormProps) => {
  const chat = useQuery(api.chats.get, { id: chatId });
  const sendMessage = useAction(api.messages.submit);

  const [message, setMessage] = useState("");

  if (chat === null) {
    return null;
  }

  if (chat === undefined) {
    return <div>Loading...</div>;
  }

  const handleSendMessage = async () => {
    if (message === "") {
      return;
    }

    const temp = message;
    setMessage("");
    await sendMessage({
      role: "user",
      content: temp,
      chatId: chat._id,
    });
  };

  const handleKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="relative px-2 sm:px-12 md:px-52 lg:pr-[500px] 2xl:px-96 w-full bg-neutral-800">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeydown}
        className="border-[1px] border-neutral-500 ring-none rounded-xl bg-inherit text-neutral-200 placeholder:text-neutral-400 h-12"
        placeholder="BadGPTにメッセージを送信する"
      />
    </div>
  );
};

export default Form;
