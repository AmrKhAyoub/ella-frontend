import { Chat } from "@/components/ui/llmchat";
import { PipelineTester } from "@/components/pipeline-tester";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 px-[20px] font-sans dark:bg-black">
      <Chat />
    </div>
  );
}
