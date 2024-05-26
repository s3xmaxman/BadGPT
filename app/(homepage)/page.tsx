"use client";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { api } from "@/convex/_generated/api";
import { useMutation, useQueries, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Form from "../chat/[chatId]/_components/form";
import { Id } from "@/convex/_generated/dataModel";
import FormWithCreate from "./_components/FormWithCreate";

const Homepage = () => {
  // const storeUser = useMutation(api.users.store);
  // const router = useRouter();
  // useEffect(() => {
  //   const fetch = async () => {
  //     const chatId = await storeUser({});
  //     router.push(`/chat/${chatId}`);
  //   };
  //   fetch();
  // }, [storeUser, router]);

  return (
    <div className="bg-neutral-800 min-h-screen text-neutral-400 text-3xl text-center px-11 pt-11 relative">
      <div className="absolute top-0 left-0">
        <MobileSidebar />
      </div>
      <h1>新しいチャットを作成</h1>
      <div className="absolute bottom-0 left-0 w-full">
        <FormWithCreate />
      </div>
    </div>
  );
};

export default Homepage;
