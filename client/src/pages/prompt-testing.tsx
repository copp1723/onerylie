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
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
// Import components
import { ChatMessage } from "../components/chat-message";
import { ProtectedRoute } from "../components/ProtectedRoute";

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
  financeApplicationUrl?: string;
  tradeInUrl?: string;
  customInstructions?: string;
  constraints?: string;
}

export default function PromptTesting() {
  const [customerMessage, setCustomerMessage] = useState("");
  const [promptTemplate, setPromptTemplate] = useState(
    `ONEKEEL DEALERSHIP SALES/SERVICE SYSTEM PROMPT

AI Role: Human Sales or Service Rep

⸻

ROLE & PURPOSE

You are a real sales or service agent—never reveal or hint you are an AI, digital assistant, or anything but a knowledgeable, friendly person.
Your job: Connect, engage, and guide every customer toward their best next step with our dealership—making it feel personal, exciting, and effortless.

⸻

EMPLOYER DETAILS
• Name: {{dealershipName}}
• Contact: {{phoneNumber}}
• About: {{customInstructions}}
• Products/Services: {{specialties}}
• Colleague for Handoff: {{dealerName}}, {{salesEmail}}
• Approved Links: Trade-in – {{tradeInUrl}}, Financing – {{financeApplicationUrl}}
• Service Hours/Location: {{workingHours}}, {{location}}
• Inventory: [INPUT-Product Inventory]

⸻

CONVERSATION CONTEXT
• Customer Name: [INPUT-CUSTOMER NAME]
• Preferred Name: [if provided, use it every time]
• Conversation History: [INPUT-CONVERSATION]

⸻

GUIDELINES & STYLE

Conversational Tone & Authenticity
• Always open with a friendly, casual greeting (e.g., "Hey, thanks for reaching out!" or "Hi [Name], glad you messaged!")
• Use contractions, everyday words, and phrases you'd say out loud in a real conversation—avoid any corporate or scripted-sounding language
• It's good to admit when you don't have an answer—say "I don't have all the details in front of me," not "I am unable to provide…"
• Reference common situations naturally ("A lot of folks ask about this," or "You're definitely not the first!")
• When handing off, make it sound like you're connecting them with someone you know, not "arranging an appointment"
• Close each response with a simple, direct action question ("Would you like me to have someone reach out to you directly?" or "Want me to put you in touch with our shipping expert?")
• No stiff sign-offs, no "strive to accommodate," "assist you further," or "our valued customers"—just be real

Personal Touch
• Always greet by the customer's name—if unknown, ask warmly:
"Hey, what's your name so I can help you better?"
• Adapt instantly if they share a preferred name.
• Reference their interests, past questions, or mood from conversation history to make it real.

Fun, Friendly, and Helpful
• Share cool, relevant facts or ask engaging questions:
"This SUV's got top safety ratings—how big a priority is that for you?"
• Spark excitement about features that matter to them.
• If they're frustrated or urgent, meet that energy:
"I hear you—let's fix this fast!"

Concise & Clear
• Responses are a max of 5 sentences or 3 short paragraphs, with line breaks for readability—never a wall of text.
• Stick to inventory and info provided—never guess, never over-explain.
• Always end with a next step, phrased as a warm invitation:
"Want to take it for a spin? Let me know when works for you!"

Strict Compliance & Professionalism
• NEVER discuss: price, payments, financing terms, delivery, or remote vehicle diagnosis.
• If asked, redirect or escalate:
"Our finance team can sort that out—check [financing URL]!"
"Can't say without seeing it—let's set up a quick check-up?"
• Use only approved links (one per message), and only when they're directly relevant.
• Stop immediately if the customer says: "Thank you," "Not interested," "Stop messaging," or "I already bought a car."
Resume only if they ask about trade-ins, test drives, or follow up.
• Escalate/handoff any legal complaints, competitor price/deal requests, or demands for a human rep.
"Let me get our expert on this—hang tight!"

Channel Awareness
• Text/SMS: Keep it short and casual (2-3 sentences max). Perfect for quick questions and friendly check-ins. Occasionally use emojis that fit naturally with the conversation. Example:
"Hey! We've got a few F-150s that match what you're looking for. Want to swing by this weekend to check them out? 😊"

• Email: Can be slightly longer (3-5 sentences), more detailed but still conversational. Include more specifics about vehicles, options, or next steps. No emojis in emails. Example:
"Hi there! Thanks for asking about our SUV lineup. We've got several models that would be perfect for your family trips, including the Explorer with that third-row seating you mentioned. The new models just arrived last week, and they've got all the safety features you were looking for. Would you like me to set up a time for you to come see them?"

Inventory Handling
• Answer only from available inventory.
• If info is missing, set "retrieve_inventory_data": true and include a friendly explanation.
• Suggest alternatives if their choice is unavailable.

Example of Natural Conversational Response:
"Hey, thanks for reaching out! We actually help a lot of folks with out-of-state deliveries, so you're definitely not the first to ask.

I don't have all the exact shipping details in front of me, but I can get you in touch with one of our sales reps who handles this all the time.

They'll walk you through the process and answer any questions you have.

Would you like me to have someone reach out to you directly?"

⸻

RESPONSE FORMAT

Respond only in the following JSON format:

{
  "watermark": "onekeel",
  "name": "[Customer Name]",
  "modified_name": "[Preferred Name or blank]",
  "user_query": "[Customer's last question or statement]",
  "analysis": "[Compliance and personalization check—how you followed the rules and engaged]",
  "type": "email or text",
  "quick_insights": "[Their needs/mood]",
  "empathetic_response": "[How you connect emotionally]",
  "engagement_check": "[Your strategy for keeping them engaged]",
  "sales_readiness": "low | medium | high",
  "answer": "[Your tailored, concise reply]",
  "retrieve_inventory_data": true | false,
  "research_queries": ["Specific inventory questions if info is missing"],
  "reply_required": true | false
}

⸻

EXAMPLES OF CHALLENGING SCENARIOS

(LLM should learn from these patterns)

1. Pricing Request (Competitor Offer):
"Riverdale Ford offered $42,875 for an F-150 XLT. Can you do $41,500?"

"Hey, awesome you're looking at the F-150! I can't talk pricing here, but our team's great—want me to connect you with {{dealerName}}?"

2. Frustrated Trade-In Request:
"Third time asking—what's my Tacoma worth?!"

"Sorry for the delay! I can't give values myself, but check {{tradeInUrl}} or I'll connect you with {{dealerName}} to help you out fast."

3. Vague Interest:
"Saw the thing online. Worth it?"

"Hey [Name], glad you spotted something! What caught your eye? I'll tell you why it's a win—just give me a hint!"

4. Emotional Situation:
"My wife needs a reliable car for chemo—what's the lowest on the CR-V?"

"I'm really sorry to hear what you're going through. The CR-V is super reliable. For the best options, want me to connect you with our team?"

⸻

QUALITY ASSURANCE – SELF-CHECK BEFORE SENDING
1. Did I use a warm, friendly, and personal tone?
2. Is my answer concise (max 5 sentences or 3 short paragraphs)?
3. Did I avoid price, payments, or shipping info?
4. Did I offer a clear, action-oriented next step?
5. If I used a link, was it approved and relevant?
6. Did I adapt to the right communication channel (text/email)?

If anything's off, rephrase before sending.

⸻

You are here to make customers feel like they're working with a real, excited, and caring dealership pro.
Build trust, keep it upbeat, and always move the customer forward—never robotic, always human.

{{constraints}}`
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
    financeApplicationUrl: "https://southsidemotors.com/finance-application",
    tradeInUrl: "https://southsidemotors.com/trade-in-value",
    customInstructions: "Focus on highlighting our current promotions. We have special financing on all SUVs this month.",
    constraints: "- Do not discuss specific pricing details without confirming with a sales rep\n- Do not ask for personal identifiable information like SSN\n- Do not make commitments about specific vehicle availability\n- Do not disparage competitor brands"
  });

  const [conversationHistory, setConversationHistory] = useState<
    { role: "assistant" | "customer"; content: string }[]
  >([]);

  // Mutation for testing the prompt
  const [jsonDetails, setJsonDetails] = useState<any>(null);
  const [channelType, setChannelType] = useState<string>("text");

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
      
      // Reset any previous handover results when sending a new message
      setHandoverResult(null);
      
      // Parse JSON response
      const data = await response.json();
      return data as PromptTestResponse & { 
        jsonResponse?: any; 
        channelType?: string;
      };
    },
    onSuccess: (data) => {
      // Add the customer message and AI response to the conversation history
      setConversationHistory([
        ...conversationHistory,
        { role: "customer", content: customerMessage },
        { role: "assistant", content: data.response }
      ]);
      
      // Store JSON details if available
      if (data.jsonResponse) {
        setJsonDetails(data.jsonResponse);
      }
      
      // Set channel type if available
      if (data.channelType) {
        setChannelType(data.channelType);
      }
      
      // Clear the customer message input
      setCustomerMessage("");
    }
  });
  
  // Mutation for handling lead handover
  const [handoverResult, setHandoverResult] = useState<any>(null);
  
  const handoverMutation = useMutation({
    mutationFn: async () => {
      // First, create a conversation if we don't have one
      if (conversationHistory.length === 0) {
        throw new Error("Cannot create handover dossier without a conversation");
      }
      
      const response = await apiRequest('/api/prompt-test/handover', {
        method: 'POST',
        data: {
          promptTemplate,
          personaArguments,
          previousMessages: conversationHistory,
          reason: "Test handover requested via testing interface"
        }
      });
      
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      // Store the handover result
      setHandoverResult(data);
      
      // Add a system message to the conversation history
      setConversationHistory([
        ...conversationHistory,
        { 
          role: "assistant", 
          content: "🔄 Conversation has been escalated to human support. A comprehensive lead handover dossier has been generated." 
        }
      ]);
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="financeApplicationUrl">Finance Application URL</Label>
                      <Input
                        id="financeApplicationUrl"
                        value={personaArguments.financeApplicationUrl || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, financeApplicationUrl: e.target.value})}
                        placeholder="https://dealer.com/finance-application"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tradeInUrl">Trade-In URL</Label>
                      <Input
                        id="tradeInUrl"
                        value={personaArguments.tradeInUrl || ""}
                        onChange={(e) => setPersonaArguments({...personaArguments, tradeInUrl: e.target.value})}
                        placeholder="https://dealer.com/trade-in-value"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="constraints">Constraints / Do Not Instructions</Label>
                    <Textarea
                      id="constraints"
                      className="min-h-[100px]"
                      value={personaArguments.constraints || ""}
                      onChange={(e) => setPersonaArguments({...personaArguments, constraints: e.target.value})}
                      placeholder="Add specific restrictions like: Do not ask for SSN, do not discuss competitor pricing, etc."
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
                  
                  {/* Show channel type and other metadata */}
                  {channelType && conversationHistory.length > 0 && (
                    <div className="bg-muted p-3 rounded-md mt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={channelType === 'email' ? 'default' : 'secondary'}>
                          {channelType === 'email' ? 'Email Response' : 'SMS Response'}
                        </Badge>
                        {jsonDetails?.sales_readiness && (
                          <Badge variant={jsonDetails.sales_readiness === 'high' ? 'destructive' : 
                                         jsonDetails.sales_readiness === 'medium' ? 'warning' : 'outline'}>
                            Sales Readiness: {jsonDetails.sales_readiness}
                          </Badge>
                        )}
                        {jsonDetails?.retrieve_inventory_data && (
                          <Badge variant="warning">Needs Inventory Data</Badge>
                        )}
                      </div>
                      
                      {jsonDetails && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="json-details">
                            <AccordionTrigger>View JSON Response Details</AccordionTrigger>
                            <AccordionContent>
                              <pre className="text-xs overflow-auto max-h-[200px] bg-background p-2 rounded-md">
                                {JSON.stringify(jsonDetails, null, 2)}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  )}
                  
                  {/* Display handover dossier results if available */}
                  {handoverResult && (
                    <Card className="mt-4 border-amber-500">
                      <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          </svg>
                          Lead Handover Dossier
                        </CardTitle>
                        <CardDescription>
                          Comprehensive information about the lead for sales representatives
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {handoverResult.dossier && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                <h3 className="text-lg font-semibold">Conversation Summary</h3>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                                  {handoverResult.dossier.conversationSummary}
                                </p>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Details</h3>
                                <div className="mt-1 space-y-1 text-sm">
                                  <p><span className="font-medium">Urgency:</span> <Badge variant={
                                    handoverResult.dossier.urgency === 'high' ? 'destructive' : 
                                    handoverResult.dossier.urgency === 'medium' ? 'default' : 'outline'
                                  }>{handoverResult.dossier.urgency}</Badge></p>
                                  <p><span className="font-medium">Customer:</span> {handoverResult.dossier.customerName}</p>
                                  {handoverResult.dossier.id && <p><span className="font-medium">ID:</span> {handoverResult.dossier.id}</p>}
                                </div>
                              </div>
                            </div>
                            
                            {handoverResult.dossier.customerInsights && handoverResult.dossier.customerInsights.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold">Customer Insights</h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {handoverResult.dossier.customerInsights.map((insight, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium">{insight.key}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(insight.confidence * 100)}%
                                        </Badge>
                                      </div>
                                      <p className="text-sm mt-1">{insight.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {handoverResult.dossier.vehicleInterests && handoverResult.dossier.vehicleInterests.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold">Vehicle Interests</h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {handoverResult.dossier.vehicleInterests.map((vehicle, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium">
                                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(vehicle.confidence * 100)}%
                                        </Badge>
                                      </div>
                                      {vehicle.vin && <p className="text-xs mt-1">VIN: {vehicle.vin}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {handoverResult.dossier.suggestedApproach && (
                              <div>
                                <h3 className="text-lg font-semibold">Suggested Approach</h3>
                                <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                                  {handoverResult.dossier.suggestedApproach}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {handoverResult.analysis && (
                          <Accordion type="single" collapsible className="mt-4">
                            <AccordionItem value="analysis-details">
                              <AccordionTrigger>AI Analysis</AccordionTrigger>
                              <AccordionContent>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4">
                                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-[400px]">
                                    {JSON.stringify(handoverResult.analysis, null, 2)}
                                  </pre>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                      </CardContent>
                    </Card>
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
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-grow"
                      disabled={testPromptMutation.isPending || customerMessage.trim() === ""}
                    >
                      {testPromptMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Send
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="secondary"
                      className="flex items-center gap-1"
                      onClick={() => handoverMutation.mutate()}
                      disabled={handoverMutation.isPending || conversationHistory.length === 0}
                    >
                      {handoverMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                      )}
                      Handover Lead
                    </Button>
                  </div>
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