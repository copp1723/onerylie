import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
// Import components
import { ChatMessage } from "../components/chat-message";

interface PromptTestResponse {
  response: string;
  shouldEscalate: boolean;
  escalationReason?: string;
  responseTime?: number;
}

interface PersonaArguments {
  dealerName?: string;
  dealershipName?: string;
  website?: string;
  location?: string;
  phoneNumber?: string;
  specialties?: string[];
  workingHours?: string;
  salesEmail?: string;
  handoverEmail?: string;
  customInstructions?: string;
}

export default function PromptTesting() {
  const [customerMessage, setCustomerMessage] = useState("");
  const [promptTemplate, setPromptTemplate] = useState(
    `You are Rylie, a helpful AI assistant for {{dealershipName}}. 
Your goal is to assist customers, answer their questions, and help them find the right vehicle.

{{customInstructions}}

When responding to customers:
- Be friendly, helpful, and knowledgeable
- Provide specific information about vehicles when appropriate
- If you don't know something, be honest about it
- If the customer asks about pricing or financing, offer to connect them with a sales representative
- If the customer seems ready to make a purchase or wants to schedule a test drive, offer to connect them with a sales representative

If you need to escalate to a human representative, do so politely and explain that someone will be in touch shortly.`
  );

  const [personaArguments, setPersonaArguments] = useState<PersonaArguments>({
    dealershipName: "Southside Motors",
    dealerName: "John Smith",
    website: "www.southsidemotors.com",
    location: "123 Auto Drive, Springfield, IL",
    phoneNumber: "(555) 123-4567",
    specialties: ["SUVs", "Trucks", "Family Vehicles"],
    workingHours: "Mon-Sat 9am-8pm, Sun 10am-6pm",
    salesEmail: "sales@southsidemotors.com",
    handoverEmail: "leads@southsidemotors.com",
    customInstructions: "Focus on highlighting our current promotions. We have special financing on all SUVs this month."
  });

  const [conversationHistory, setConversationHistory] = useState<
    { role: "assistant" | "customer"; content: string }[]
  >([]);

  // Mutation for testing the prompt
  const testPromptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/prompt-test', {
        method: 'POST',
        data: {
          customerMessage,
          promptTemplate,
          personaArguments,
          previousMessages: conversationHistory
        }
      });
      return response as PromptTestResponse;
    },
    onSuccess: (data) => {
      // Add the customer message and AI response to the conversation history
      setConversationHistory([
        ...conversationHistory,
        { role: "customer", content: customerMessage },
        { role: "assistant", content: data.response }
      ]);
      
      // Clear the customer message input
      setCustomerMessage("");
    }
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerMessage.trim() === "") return;
    testPromptMutation.mutate();
  };

  // Helper to replace placeholders in the prompt template
  const getProcessedTemplate = () => {
    let processed = promptTemplate;
    Object.entries(personaArguments).forEach(([key, value]) => {
      if (typeof value === 'string') {
        processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
      } else if (Array.isArray(value)) {
        processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value.join(', '));
      }
    });
    return processed;
  };

  const handleReset = () => {
    setConversationHistory([]);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Prompt Testing Lab</h1>
        <Button variant="outline" onClick={handleReset}>Reset Conversation</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <Tabs defaultValue="template">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">Prompt Template</TabsTrigger>
              <TabsTrigger value="arguments">Dealer Arguments</TabsTrigger>
            </TabsList>
            <TabsContent value="template" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Prompt Template</CardTitle>
                  <CardDescription>
                    Edit the system prompt template. Use double curly braces for personalization.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="min-h-[300px] font-mono text-sm"
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    placeholder="Enter your system prompt template here..."
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Processed Template Preview</CardTitle>
                  <CardDescription>
                    This is how the template looks with all variables replaced
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-sm whitespace-pre-wrap">
                    {getProcessedTemplate()}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="arguments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dealer Arguments</CardTitle>
                  <CardDescription>
                    Customize the dealer-specific information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dealershipName">Dealership Name</Label>
                      <Input
                        id="dealershipName"
                        value={personaArguments.dealershipName || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, dealershipName: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dealerName">Dealer Name</Label>
                      <Input
                        id="dealerName"
                        value={personaArguments.dealerName || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, dealerName: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={personaArguments.phoneNumber || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, phoneNumber: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={personaArguments.website || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, website: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={personaArguments.location || ""}
                      onChange={(e) => setPersonaArguments({...personaArguments, location: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                    <Input
                      id="specialties"
                      value={personaArguments.specialties?.join(", ") || ""}
                      onChange={(e) => setPersonaArguments({
                        ...personaArguments, 
                        specialties: e.target.value.split(",").map(s => s.trim())
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Working Hours</Label>
                    <Input
                      id="workingHours"
                      value={personaArguments.workingHours || ""}
                      onChange={(e) => setPersonaArguments({...personaArguments, workingHours: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salesEmail">Sales Email</Label>
                      <Input
                        id="salesEmail"
                        value={personaArguments.salesEmail || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, salesEmail: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="handoverEmail">Handover Email</Label>
                      <Input
                        id="handoverEmail"
                        value={personaArguments.handoverEmail || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, handoverEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customInstructions">Custom Instructions</Label>
                    <Textarea
                      id="customInstructions"
                      className="min-h-[100px]"
                      value={personaArguments.customInstructions || ""}
                      onChange={(e) => setPersonaArguments({...personaArguments, customInstructions: e.target.value})}
                      placeholder="Add any custom instructions here..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right Column: Chat Interface */}
        <div className="space-y-6">
          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Conversation Preview</CardTitle>
              <CardDescription>
                Test how Rylie responds to customer messages
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-grow overflow-auto max-h-[500px] space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <p>No conversation yet. Start by sending a message below.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationHistory.map((message, index) => (
                    <ChatMessage 
                      key={index}
                      message={message.content}
                      isCustomer={message.role === "customer"}
                    />
                  ))}
                  
                  {testPromptMutation.isPending && (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Generating response...</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <form onSubmit={handleFormSubmit} className="w-full space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    placeholder="Type a customer message here..."
                    className="flex-grow"
                  />
                  <Button 
                    type="submit" 
                    disabled={testPromptMutation.isPending || customerMessage.trim() === ""}
                  >
                    {testPromptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Send
                  </Button>
                </div>
                
                {testPromptMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Error testing prompt. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
                
                {testPromptMutation.isSuccess && testPromptMutation.data.shouldEscalate && (
                  <Alert>
                    <AlertDescription className="flex items-center">
                      <Badge variant="outline" className="mr-2 bg-orange-100">Escalated</Badge>
                      {testPromptMutation.data.escalationReason || "This conversation would be escalated to a human."}
                    </AlertDescription>
                  </Alert>
                )}
                
                {testPromptMutation.isSuccess && testPromptMutation.data.responseTime && (
                  <div className="text-xs text-muted-foreground text-right">
                    Response time: {testPromptMutation.data.responseTime}ms
                  </div>
                )}
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}