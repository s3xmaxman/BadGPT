"use client";
import { PlusCircle, SquarePen } from "lucide-react";
import { Button } from "../ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export const NewChatButton = () => {
  const create = useMutation(api.chats.create);

  const onClick = async () => {
    await create({});
  };

  return (
    <Button
      onClick={onClick}
      className="w-full flex justify-start items-center bg-inherit hover:bg-inherit p-0"
    >
      <PlusCircle className="w-5 h-5" />
      <p className="font-semibold text-start ml-3">新しいチャット</p>
      <SquarePen className="w-4 h-4 ml-auto" />
    </Button>
  );
};
