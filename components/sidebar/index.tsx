import { ChatList } from "./chat-list";
import { HomeButton } from "./home-button";
import { NewChatButton } from "./new-chat-button";
import { UpgradePlanButton } from "./upgrade-plan-button";

export const Sidebar = () => {
  return (
    <div className="h-full hidden lg:flex lg:w-[300px] bg-neutral-950 lg:flex-col">
      <div className="my-1" />
      <HomeButton />
      <div className="my-2" />
      <NewChatButton />
      <div className="my-2" />
      <ChatList />
      <UpgradePlanButton />
    </div>
  );
};
