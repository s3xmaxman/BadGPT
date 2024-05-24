import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface UpgradeModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const UpgradeModal = ({ open, setOpen }: UpgradeModalProps) => {
  const upgrade = useAction(api.users.upgrade);
  const router = useRouter();
  const handleUpgrade = async () => {
    const url = await upgrade({});
    if (!url) {
      return;
    }
    router.push(url);
  };
  return (
    <Dialog open={open} onOpenChange={(e) => setOpen(e)}>
      <DialogContent className="bg-neutral-700 text-white ">
        <DialogHeader className="p-3">
          <DialogTitle>現在のプランをアップグレードする</DialogTitle>
        </DialogHeader>
        {/* Free tier */}
        <Separator className="h-[1px] bg-white/20" />
        <div className="flex justify-between">
          <div className="w-1/2 p-4 gap-y-2">
            <h3 className="text-lg font-semibold">無料</h3>
            <p className="font-thin text-white">$0 ドル/月</p>
            <Button
              disabled
              className="font-semibold text-xs bg-neutral-500 p-4 my-4 text-warp"
            >
              現在のプラン
            </Button>
            <h4 className="text-sm mb-4">初めてのお客様へ</h4>
            <div className="flex flex-col gap-y-3 text-sm">
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>文書作成、問題解決などの支援</p>
              </div>
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>Smallモデルにアクセスする</p>
              </div>
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>高速な応答速度</p>
              </div>
            </div>
          </div>
          {/* Plus tier */}
          <Separator orientation="vertical" className="w-[1px] bg-white/20" />
          <div className="w-1/2 p-4 gap-y-2">
            <h3 className="text-lg font-semibold">Plus</h3>
            <p className="font-thin text-white/95">$20 ドル/月</p>
            <Button
              onClick={handleUpgrade}
              className="font-semibold text-xs bg-green-600 hover:bg-green-700 p-4 my-4"
            >
              Plusにアップグレードする
            </Button>
            <h4 className="text-sm mb-4">Mediumモデルをアンロック</h4>
            <div className="flex flex-col gap-y-3 text-sm">
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>最もスマートなモデルにアクセス</p>
              </div>
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>新機能への早期アクセス</p>
              </div>
              <div className="flex gap-x-4 items-center">
                <Check className="h-4 w-4" />
                <p>ガンも治る！</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
