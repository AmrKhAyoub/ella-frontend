import { Chat } from "@/components/ui/llmchat";
import { PipelineTester } from "@/components/pipeline-tester";

export default function Home() {
  return (
  <div className="flex flex-col flex-1 items-center justify-center bg-white px-0 sm:px-[10px] font-sans dark:bg-zinc-950">
    <Chat />
  </div>
  );
}
