import Image from "next/image";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-mark.png"
      alt="ResearchOS"
      width={44}
      height={44}
      priority
      className={cn("h-[22px] w-[22px] object-contain", className)}
    />
  );
}
