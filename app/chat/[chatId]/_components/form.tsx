import { Id } from "@/convex/_generated/dataModel";
import React from "react";

interface FormProps {
  chatId: Id<"chats">;
}

const Form = ({ chatId }: FormProps) => {
  return <div>form</div>;
};

export default Form;
