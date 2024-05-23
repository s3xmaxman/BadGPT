"use client";

import { Loading } from "@/components/auth/loading";
import { api } from "@/convex/_generated/api";
import { useConvexAuth, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SignUp = () => {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const router = useRouter();

  useEffect(() => {
    const storeUserData = async () => {
      if (isAuthenticated) {
        await storeUser();
        router.push("/");
      } else {
        console.log("User not authenticated");
      }
    };

    storeUserData();
  }, [isAuthenticated, router, storeUser]);

  return <Loading />;
};

export default SignUp;
