import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BotIcon, UserIcon } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isCustomer: boolean;
}

export function ChatMessage({ message, isCustomer }: ChatMessageProps) {
  return (
    <div className={cn(
      "flex gap-3 p-4 rounded-lg",
      isCustomer ? "bg-muted justify-start" : "bg-primary/10 justify-start"
    )}>
      <Avatar className={cn(
        "h-8 w-8",
        isCustomer ? "bg-secondary" : "bg-primary"
      )}>
        {isCustomer ? (
          <UserIcon className="h-4 w-4 text-secondary-foreground" />
        ) : (
          <BotIcon className="h-4 w-4 text-primary-foreground" />
        )}
        <AvatarFallback>{isCustomer ? "C" : "AI"}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium">
          {isCustomer ? "Customer" : "Rylie AI"}
        </p>
        <div className="whitespace-pre-wrap text-sm">{message}</div>
      </div>
    </div>
  );
}