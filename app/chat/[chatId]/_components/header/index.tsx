import { UserButton } from "@clerk/clerk-react";
import React from "react";
import { SelectModal } from "./select-modal";

const Header = () => {
  return (
    <div className="flex h-[100px] justify-between p-5">
      {/* MobileSidebar  */}
      <SelectModal />
      <UserButton />
    </div>
  );
};

export default Header;
