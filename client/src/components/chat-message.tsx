import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BotIcon, UserIcon } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isCustomer: boolean;
}

export function ChatMessage({ message, isCustomer }: ChatMessageProps) {
  // Process the message to extract and format URLs nicely
  const formatMessage = (text: string): { paragraphs: string[] } => {
    if (isCustomer) return { paragraphs: [text] }; // Only process AI responses
    
    // Find and process URLs to remove descriptive text
    const processText = (inputText: string): string => {
      // Replace text like "Trade-In Valuation Tool: URL" with just the URL
      const labeledUrlRegex = /(.*?)(?:trade-in valuation tool|trade-in tool|finance application|finance app|application):\s*(https?:\/\/[^\s]+)/gi;
      return inputText.replace(labeledUrlRegex, (_, prefix, url) => {
        return `${prefix.trim()} ${url}`;
      });
    };
    
    // Process the text to clean it up
    const cleanedText = processText(text);
    
    // Split text by paragraph breaks and clean each paragraph
    const paragraphs = cleanedText.split('\n\n');
    const formattedParagraphs = paragraphs
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);
    
    // Return paragraphs for rendering
    return {
      paragraphs: formattedParagraphs
    };
  };

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
        
        {isCustomer ? (
          <div className="whitespace-pre-wrap text-sm">{message}</div>
        ) : (
          <div className="text-sm space-y-4">
            {formatMessage(message).paragraphs.map((paragraph, i) => (
              <p key={i} className="leading-relaxed">
                {paragraph.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < paragraph.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}