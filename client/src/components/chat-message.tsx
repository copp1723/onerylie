import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BotIcon, UserIcon } from "lucide-react";

interface ChatMessageProps {
  message: string;
  isCustomer: boolean;
}

export function ChatMessage({ message, isCustomer }: ChatMessageProps) {
  // Process the message to extract and format URLs nicely
  const formatMessage = (text: string) => {
    if (isCustomer) return text; // Only process AI responses
    
    // Replace markdown-style links with actual links
    const markdownLinkRegex = /\[(.*?)\]\((https?:\/\/[^\s]+)\)/g;
    const markdownReplaced = text.replace(markdownLinkRegex, (_, text, url) => {
      return `<a href="${url}" class="text-primary hover:underline" target="_blank">${url}</a>`;
    });
    
    // Also catch plain URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlsReplaced = markdownReplaced.replace(urlRegex, (url) => {
      // Skip if already wrapped in an <a> tag
      if (url.startsWith('<a ')) return url;
      return `<a href="${url}" class="text-primary hover:underline" target="_blank">${url}</a>`;
    });
    
    // Replace text like "Trade-In Valuation Tool: URL" with just the URL link
    const labeledUrlRegex = /(.*?)(?:trade-in valuation tool|trade-in tool|finance application|finance app|application):\s*(https?:\/\/[^\s]+)/gi;
    const cleanedText = urlsReplaced.replace(labeledUrlRegex, (_, prefix, url) => {
      return `${prefix}<a href="${url}" class="text-primary hover:underline" target="_blank">${url}</a>`;
    });
    
    // Add paragraph breaks
    const paragraphs = cleanedText.split('\n\n');
    return paragraphs.map(p => p.trim()).filter(p => p.length > 0).join('</p><p>');
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
          <div className="text-sm space-y-3">
            {formatMessage(message).split('</p><p>').map((paragraph, i) => (
              <p key={i} 
                 className="leading-relaxed" 
                 dangerouslySetInnerHTML={{ __html: paragraph }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}