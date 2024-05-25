import React, { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const FormWithCreate = () => {
  const createChat = useMutation(api.chats.create);
  const sendMessage = useAction(api.messages.submit);
  const router = useRouter();
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    if (message === "") return;

    try {
      const newChatId = await createChat();
      await sendMessage({
        role: "user",
        content: message,
        chatId: newChatId,
      });
      router.push(`/chat/${newChatId}`);
    } catch (error) {
      console.error("Error creating chat or sending message:", error);
    }
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

export default FormWithCreate;
