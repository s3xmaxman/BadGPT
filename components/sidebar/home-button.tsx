import Image from "next/image";
import Link from "next/link";

export const HomeButton = () => {
  return (
    <div>
      <Link href="/">
        <div className="flex flex-1 space-x-2 items-center">
          <Image src="/logo.svg" alt="logo" width={20} height={20} />
          <h1 className="text-2xl font-bold">BadGPT</h1>
        </div>
      </Link>
    </div>
  );
};
