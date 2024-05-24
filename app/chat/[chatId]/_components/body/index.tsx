import { Id } from "@/convex/_generated/dataModel";
import React from "react";

interface BodyProps {
  chatId: Id<"chats">;
}

const Body = ({ chatId }: BodyProps) => {
  return <div>index</div>;
};

export default Body;
