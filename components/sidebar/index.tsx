import { ChatList } from "./chat-list"
import { NewChatButton } from "./new-chat-button"
import { UpgradePlanButton } from "./upgrade-plan-button"

export const Sidebar = () => {
    return (
        <div className="h-full hidden lg:flex lg:w-[300px] bg-neutral-950 lg:flex-col">
            <NewChatButton />
            <ChatList />
            <UpgradePlanButton />
        </div>
    )
}