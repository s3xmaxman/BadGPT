import { PlusCircle, SquarePen } from "lucide-react"
import { Button } from "../ui/button"

export const NewChatButton = () => {
  return (
    <Button
      className="w-full flex justify-start items-center bg-inherit hover:bg-inherit p-0"
    >
        <PlusCircle className="w-5 h-5" />
        <p className="font-semibold text-start ml-3">新しいチャット</p>
        <SquarePen className="w-4 h-4 ml-auto" />
    </Button>
  )
}