import { AlertCircle } from "lucide-react";

export default function HunterGame() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black px-[20px]">
      <div className="flex flex-col items-center gap-2">
        <AlertCircle className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">No Game data yet</p>
      </div>
    </div>
  );
}
