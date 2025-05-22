import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, Plus, Minus } from "lucide-react";
import { Label } from "@/components/ui/label";

const DEFAULT_SYSTEM_PROMPT = `# Rylie AI - Automotive Dealership Assistant

## Role & Purpose
You are Rylie, an AI assistant for automotive dealerships. Your primary goal is to provide helpful, friendly information about vehicles and services the dealership offers, answering customer questions professionally and accurately.

## Core Requirements
- Be friendly, professional, and conversational in your responses
- Always identify yourself as "Rylie" at the beginning of conversations
- Keep responses concise (2-3 paragraphs maximum)
- Use contractions (don't, can't, won't) to sound natural
- Adapt tone appropriately to communication channel (SMS vs Email)
- For SMS: Shorter, more direct responses with simple language
- For Email: Can be slightly longer with more detailed information
- Correctly format paragraph breaks for readability

## Customer Interaction Guidelines
- When a customer shows interest in a specific vehicle or has financing/pricing questions, collect their contact information
- Offer to connect interested customers with a sales representative
- Recognize when a customer requires human assistance and prepare a handover
- Address customers by name when they provide it
- Avoid sharing links in SMS responses, but can include links in email responses

## Vehicle Information Guidelines
- Provide accurate details about specific vehicles when available
- If vehicle details are unknown, offer to search inventory if provided with preferences
- Never fabricate vehicle specifications or pricing
- For pricing questions, provide general information but suggest speaking with a representative for exact figures

## Escalation Criteria
- Customer explicitly asks to speak to a human
- Customer expresses frustration
- Questions about specific financial details require a specialist
- Technical vehicle issues need service department expertise
- Customer requests a test drive appointment
- Complex trade-in scenarios

## Dealership Context
- You represent {dealershipName}
- The dealership sells {brandTypes}
- Located at {dealershipLocation}
- Hours of operation: {businessHours}`;

interface Vehicle {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  price: number;
  condition: string;
  description: string;
  features: string[];
}

interface CustomerInfo {
  name: string;
  conversationId?: number;
  phone?: string;
  email?: string;
}

export default function AdvancedPromptTesting() {
  // Main tabs
  const [activeTab, setActiveTab] = useState("testing");
  
  // Basic testing configuration
  const [customerMessage, setCustomerMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [error, setError] = useState("");
  const [isHandoverLoading, setIsHandoverLoading] = useState(false);
  const [handoverDossier, setHandoverDossier] = useState<any>(null);
  
  // Communication channel
  const [channel, setChannel] = useState<string>("sms");
  
  // Customer info
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "John Smith",
    conversationId: 1,
    phone: "+15555555555",
    email: "john.smith@example.com"
  });
  
  // Dealership context
  const [dealershipContext, setDealershipContext] = useState({
    dealershipId: 1,
    dealershipName: "OnekeeL Automotive",
    brandTypes: "new and used vehicles from various manufacturers",
    dealershipLocation: "123 Auto Drive, Springfield, IL",
    businessHours: "Monday-Friday 9am-8pm, Saturday 9am-6pm, Sunday Closed",
  });
  
  // Conversation history
  const [conversationHistory, setConversationHistory] = useState<{role: string, content: string}[]>([]);
  const [includeHistory, setIncludeHistory] = useState(false);
  
  // Vehicle inventory
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: 1,
      vin: "1HGCM82633A123456",
      make: "Honda",
      model: "Accord",
      year: 2023,
      trim: "Sport",
      exteriorColor: "Crystal Black Pearl",
      interiorColor: "Black Leather",
      mileage: 5000,
      price: 28995,
      condition: "Used",
      description: "Well-maintained Honda Accord Sport with low mileage",
      features: ["Bluetooth", "Backup Camera", "Lane Departure Warning", "Heated Seats"]
    }
  ]);
  const [includeVehicles, setIncludeVehicles] = useState(false);
  
  // Output format & options
  const [formatOptions, setFormatOptions] = useState({
    enableJsonResponse: false,
    includeVehicleRecommendations: true,
    considerHandover: true,
    generateHandoverDossier: false
  });

  const addHistoryItem = () => {
    setConversationHistory([
      ...conversationHistory, 
      {role: "customer", content: ""}
    ]);
  };

  const removeHistoryItem = (index: number) => {
    setConversationHistory(
      conversationHistory.filter((_, i) => i !== index)
    );
  };

  const updateHistoryItem = (index: number, value: string, fieldName: 'role' | 'content') => {
    const updatedHistory = [...conversationHistory];
    updatedHistory[index] = {
      ...updatedHistory[index],
      [fieldName]: value
    };
    setConversationHistory(updatedHistory);
  };

  const addVehicle = () => {
    setVehicles([
      ...vehicles,
      {
        id: vehicles.length + 1,
        vin: "",
        make: "",
        model: "",
        year: 2023,
        trim: "",
        exteriorColor: "",
        interiorColor: "",
        mileage: 0,
        price: 0,
        condition: "New",
        description: "",
        features: []
      }
    ]);
  };

  const removeVehicle = (index: number) => {
    setVehicles(
      vehicles.filter((_, i) => i !== index)
    );
  };

  const updateVehicle = (index: number, field: keyof Vehicle, value: any) => {
    const updatedVehicles = [...vehicles];
    updatedVehicles[index] = {
      ...updatedVehicles[index],
      [field]: field === 'features' && typeof value === 'string' 
        ? value.split(',').map(f => f.trim()) 
        : value
    };
    setVehicles(updatedVehicles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Prepare the request payload
    const payload = {
      customerMessage,
      systemPrompt,
      channel,
      customerInfo,
      dealershipContext,
      conversationHistory: includeHistory ? conversationHistory : [],
      relevantVehicles: includeVehicles ? vehicles : [],
      formatOptions
    };
    
    try {
      const result = await fetch('/api/prompt-test/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!result.ok) {
        throw new Error(`Error: ${result.status}`);
      }
      
      const data = await result.json();
      
      // Update conversation history with this exchange
      const newCustomerMessage = {
        role: 'customer',
        content: customerMessage,
        timestamp: new Date()
      };
      
      const newAssistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      // Add both messages to the conversation history
      setConversationHistory([...conversationHistory, newCustomerMessage, newAssistantMessage]);
      
      // Update the response display
      setResponse(showJson ? JSON.stringify(data, null, 2) : data.response);
      
      // Clear the customer message input for the next message
      setCustomerMessage('');
    } catch (err) {
      console.error('Error testing prompt:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleHandover = async () => {
    if (conversationHistory.length === 0) {
      setError("You need to have a conversation before generating a handover dossier.");
      return;
    }
    
    setIsHandoverLoading(true);
    setError("");
    
    // Prepare the request payload
    const payload = {
      systemPrompt,
      channel,
      customerInfo,
      dealershipContext,
      conversationHistory: includeHistory ? conversationHistory : [],
      relevantVehicles: includeVehicles ? vehicles : [],
      formatOptions: {
        ...formatOptions,
        generateHandoverDossier: true
      }
    };
    
    try {
      const result = await fetch('/api/prompt-test/handover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!result.ok) {
        throw new Error(`Error: ${result.status}`);
      }
      
      const data = await result.json();
      setHandoverDossier(data.handoverDossier);
      setResponse(JSON.stringify(data, null, 2));
      setShowJson(true);
    } catch (err) {
      console.error('Error generating handover:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsHandoverLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Comprehensive Rylie Prompt Testing Interface</h1>
      <p className="text-muted-foreground mb-6">
        Test your Rylie AI prompts with full control over system context, customer details, and response options
      </p>

      <Tabs defaultValue="testing" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="system-prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="context">Context Configuration</TabsTrigger>
          <TabsTrigger value="conversation">Conversation History</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicle Inventory</TabsTrigger>
          <TabsTrigger value="output">Output Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="testing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Message</CardTitle>
                <CardDescription>
                  Enter the customer message you want to test
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Communication Channel
                    </label>
                    <Select
                      value={channel}
                      onValueChange={setChannel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="web">Web Chat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Customer Message
                    </label>
                    <Textarea
                      value={customerMessage}
                      onChange={(e) => setCustomerMessage(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Enter a customer message to test..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={isLoading || !customerMessage}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Processing...
                        </>
                      ) : (
                        "Test Prompt"
                      )}
                    </Button>
                    
                    <Button 
                      type="button"
                      variant="secondary"
                      className="flex items-center gap-1"
                      onClick={handleHandover}
                      disabled={isHandoverLoading || conversationHistory.length === 0}
                    >
                      {isHandoverLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                      )}
                      Handover
                    </Button>
                  </div>
                  {error && (
                    <div className="text-destructive text-sm mt-2">{error}</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Response</CardTitle>
                  <CardDescription>
                    View the AI generated response
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="json-format"
                    checked={showJson}
                    onCheckedChange={setShowJson}
                  />
                  <Label htmlFor="json-format">Show JSON</Label>
                </div>
              </CardHeader>
              <CardContent>
                {!response ? (
                  <div className="bg-muted rounded-md p-4 min-h-[300px] text-muted-foreground">
                    Response will appear here after testing a prompt...
                  </div>
                ) : showJson ? (
                  // Show full JSON response
                  <div className="bg-muted rounded-md p-4 min-h-[300px] relative">
                    <div className="font-mono text-sm overflow-auto max-h-[500px]">
                      {response}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(response)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  // Show only the customer-facing message
                  <div className="space-y-6">
                    <div className="bg-primary/10 rounded-md p-4 border-l-4 border-primary">
                      <h3 className="font-medium mb-2">Customer-Facing Message:</h3>
                      <div className="whitespace-pre-line">
                        {(() => {
                          try {
                            const parsedResponse = JSON.parse(response);
                            return parsedResponse.answer || "No customer message found in response";
                          } catch (e) {
                            // If not valid JSON, show the raw response
                            return response;
                          }
                        })()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          try {
                            const parsedResponse = JSON.parse(response);
                            copyToClipboard(parsedResponse.answer || "");
                          } catch (e) {
                            copyToClipboard(response);
                          }
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy Message
                      </Button>
                    </div>
                    
                    {handoverDossier && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-md p-4 border-l-4 border-amber-400 dark:border-amber-600 mb-4">
                        <h3 className="font-medium mb-2 text-amber-800 dark:text-amber-200">Lead Handover Dossier:</h3>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="font-semibold">Customer Name:</p>
                              <p>{handoverDossier.customerName || 'Unknown'}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Contact:</p>
                              <p>{handoverDossier.customerContact || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Urgency:</p>
                              <p className={`capitalize ${
                                handoverDossier.urgency === 'high' ? 'text-red-600 dark:text-red-400 font-medium' : 
                                handoverDossier.urgency === 'medium' ? 'text-amber-600 dark:text-amber-400' : 
                                'text-green-600 dark:text-green-400'
                              }`}>
                                {handoverDossier.urgency || 'Low'}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold">Escalation Reason:</p>
                              <p>{handoverDossier.escalationReason || 'Not specified'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="font-semibold">Conversation Summary:</p>
                            <p className="text-muted-foreground">{handoverDossier.conversationSummary}</p>
                          </div>
                          
                          {handoverDossier.customerInsights && handoverDossier.customerInsights.length > 0 && (
                            <div className="mt-3">
                              <p className="font-semibold">Customer Insights:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                {handoverDossier.customerInsights.map((insight, idx) => (
                                  <div key={idx} className="flex justify-between">
                                    <span>{insight.key}:</span>
                                    <span className="font-medium">{insight.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {handoverDossier.vehicleInterests && handoverDossier.vehicleInterests.length > 0 && (
                            <div className="mt-3">
                              <p className="font-semibold">Vehicle Interests:</p>
                              <div className="space-y-2 mt-1">
                                {handoverDossier.vehicleInterests.map((vehicle, idx) => (
                                  <div key={idx} className="bg-white dark:bg-gray-800 rounded p-2 text-xs">
                                    {vehicle.year && vehicle.make && vehicle.model ? (
                                      <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''}</p>
                                    ) : (
                                      <p className="font-medium">Vehicle details incomplete</p>
                                    )}
                                    {vehicle.vin && <p className="text-muted-foreground">VIN: {vehicle.vin}</p>}
                                    <div className="flex items-center mt-1">
                                      <span className="text-muted-foreground mr-1">Confidence:</span>
                                      <div className="h-1.5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full">
                                        <div 
                                          className="h-full bg-amber-500 rounded-full" 
                                          style={{ width: `${Math.min(100, vehicle.confidence * 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="ml-1 text-xs text-muted-foreground">
                                        {Math.round(vehicle.confidence * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <p className="font-semibold">Next Steps:</p>
                            <div className="space-y-2 mt-1">
                              {/* Display action items if available */}
                              {handoverDossier.actionItems && handoverDossier.actionItems.map((item, idx) => (
                                <p key={`action-${idx}`} className="text-muted-foreground whitespace-pre-line">{item}</p>
                              ))}
                              
                              {/* Display customer bullet points if available */}
                              {handoverDossier.customerBulletPoints && handoverDossier.customerBulletPoints.map((item, idx) => (
                                <p key={`customer-${idx}`} className="text-muted-foreground whitespace-pre-line">{item}</p>
                              ))}
                              
                              {/* Display next steps if available */}
                              {handoverDossier.nextSteps && handoverDossier.nextSteps.map((item, idx) => (
                                <p key={`next-${idx}`} className="text-muted-foreground whitespace-pre-line">{item}</p>
                              ))}
                              
                              {/* Fallback to suggested approach if no action items */}
                              {(!handoverDossier.actionItems && !handoverDossier.customerBulletPoints && !handoverDossier.nextSteps) && (
                                <p className="text-muted-foreground whitespace-pre-line">{handoverDossier.suggestedApproach}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-md p-4 border border-muted">
                      <h3 className="font-medium mb-2">Response Analysis:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          try {
                            const parsedResponse = JSON.parse(response);
                            // Create a concise summary of the response analysis
                            const analysisFields = [
                              { label: "Customer Name", value: parsedResponse.name },
                              { label: "Query", value: parsedResponse.user_query },
                              { label: "Analysis", value: parsedResponse.analysis },
                              { label: "Channel", value: parsedResponse.type },
                              { label: "Insights", value: parsedResponse.quick_insights },
                              { label: "Sales Readiness", value: parsedResponse.sales_readiness },
                              { label: "Handover Needed", value: parsedResponse.reply_required ? "Yes" : "No" }
                            ];
                            
                            return analysisFields.map((field, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{field.label}:</span>{" "}
                                <span className="text-muted-foreground">{field.value || "N/A"}</span>
                              </div>
                            ));
                          } catch (e) {
                            return <div className="text-muted-foreground">Could not parse response analysis</div>;
                          }
                        })()}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowJson(true)}
                    >
                      View Full JSON Response
                    </Button>
                  </div>
                )}
              </CardContent>
              {response && (
                <CardFooter>
                  <div className="text-xs text-muted-foreground">
                    To refine your response, adjust the configuration in the different tabs.
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="system-prompt">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt Configuration</CardTitle>
              <CardDescription>
                Customize the system prompt that defines Rylie's behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Enter the system prompt..."
              />
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
              >
                Reset to Default
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="context">
          <Card>
            <CardHeader>
              <CardTitle>Context Configuration</CardTitle>
              <CardDescription>
                Configure dealership and customer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Dealership Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dealershipId">Dealership ID</Label>
                      <Input 
                        id="dealershipId"
                        type="number"
                        value={dealershipContext.dealershipId}
                        onChange={(e) => setDealershipContext({
                          ...dealershipContext,
                          dealershipId: parseInt(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealershipName">Dealership Name</Label>
                      <Input 
                        id="dealershipName"
                        value={dealershipContext.dealershipName}
                        onChange={(e) => setDealershipContext({
                          ...dealershipContext,
                          dealershipName: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brandTypes">Brand Types</Label>
                      <Input 
                        id="brandTypes"
                        value={dealershipContext.brandTypes}
                        onChange={(e) => setDealershipContext({
                          ...dealershipContext,
                          brandTypes: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dealershipLocation">Location</Label>
                      <Input 
                        id="dealershipLocation"
                        value={dealershipContext.dealershipLocation}
                        onChange={(e) => setDealershipContext({
                          ...dealershipContext,
                          dealershipLocation: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessHours">Business Hours</Label>
                      <Input 
                        id="businessHours"
                        value={dealershipContext.businessHours}
                        onChange={(e) => setDealershipContext({
                          ...dealershipContext,
                          businessHours: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input 
                        id="customerName"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conversationId">Conversation ID</Label>
                      <Input 
                        id="conversationId"
                        type="number"
                        value={customerInfo.conversationId}
                        onChange={(e) => setCustomerInfo({
                          ...customerInfo,
                          conversationId: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input 
                        id="customerPhone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input 
                        id="customerEmail"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="conversation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversation History</span>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="include-history"
                    checked={includeHistory}
                    onCheckedChange={setIncludeHistory}
                  />
                  <Label htmlFor="include-history">Include in Request</Label>
                </div>
              </CardTitle>
              <CardDescription>
                Add previous messages to provide conversation context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversationHistory.map((item, index) => (
                  <div key={index} className="flex gap-4 items-start border p-4 rounded-md">
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Select
                          value={item.role}
                          onValueChange={(value) => updateHistoryItem(index, value, 'role')}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="assistant">Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Textarea
                        value={item.content}
                        onChange={(e) => updateHistoryItem(index, e.target.value, 'content')}
                        placeholder={`Enter ${item.role} message...`}
                        className="min-h-[100px]"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeHistoryItem(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addHistoryItem}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vehicle Inventory</span>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="include-vehicles"
                    checked={includeVehicles}
                    onCheckedChange={setIncludeVehicles}
                  />
                  <Label htmlFor="include-vehicles">Include in Request</Label>
                </div>
              </CardTitle>
              <CardDescription>
                Add vehicle information to provide inventory context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {vehicles.map((vehicle, index) => (
                  <div key={index} className="border p-4 rounded-md space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Vehicle #{index + 1}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeVehicle(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`vin-${index}`}>VIN</Label>
                        <Input 
                          id={`vin-${index}`}
                          value={vehicle.vin}
                          onChange={(e) => updateVehicle(index, 'vin', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`make-${index}`}>Make</Label>
                        <Input 
                          id={`make-${index}`}
                          value={vehicle.make}
                          onChange={(e) => updateVehicle(index, 'make', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`model-${index}`}>Model</Label>
                        <Input 
                          id={`model-${index}`}
                          value={vehicle.model}
                          onChange={(e) => updateVehicle(index, 'model', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`year-${index}`}>Year</Label>
                        <Input 
                          id={`year-${index}`}
                          type="number"
                          value={vehicle.year}
                          onChange={(e) => updateVehicle(index, 'year', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`trim-${index}`}>Trim</Label>
                        <Input 
                          id={`trim-${index}`}
                          value={vehicle.trim}
                          onChange={(e) => updateVehicle(index, 'trim', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`condition-${index}`}>Condition</Label>
                        <Select
                          value={vehicle.condition}
                          onValueChange={(value) => updateVehicle(index, 'condition', value)}
                        >
                          <SelectTrigger id={`condition-${index}`}>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Used">Used</SelectItem>
                            <SelectItem value="Certified Pre-Owned">Certified Pre-Owned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exteriorColor-${index}`}>Exterior Color</Label>
                        <Input 
                          id={`exteriorColor-${index}`}
                          value={vehicle.exteriorColor}
                          onChange={(e) => updateVehicle(index, 'exteriorColor', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`interiorColor-${index}`}>Interior Color</Label>
                        <Input 
                          id={`interiorColor-${index}`}
                          value={vehicle.interiorColor}
                          onChange={(e) => updateVehicle(index, 'interiorColor', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`mileage-${index}`}>Mileage</Label>
                        <Input 
                          id={`mileage-${index}`}
                          type="number"
                          value={vehicle.mileage}
                          onChange={(e) => updateVehicle(index, 'mileage', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Price</Label>
                        <Input 
                          id={`price-${index}`}
                          type="number"
                          value={vehicle.price}
                          onChange={(e) => updateVehicle(index, 'price', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Textarea 
                          id={`description-${index}`}
                          value={vehicle.description}
                          onChange={(e) => updateVehicle(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-3">
                        <Label htmlFor={`features-${index}`}>Features (comma-separated)</Label>
                        <Textarea 
                          id={`features-${index}`}
                          value={vehicle.features.join(', ')}
                          onChange={(e) => updateVehicle(index, 'features', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button 
                  variant="outline" 
                  onClick={addVehicle}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="output">
          <Card>
            <CardHeader>
              <CardTitle>Output Options</CardTitle>
              <CardDescription>
                Configure how responses are formatted and what content to include
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableJsonResponse">Enable JSON Response Format</Label>
                    <p className="text-sm text-muted-foreground">
                      Return responses in structured JSON format
                    </p>
                  </div>
                  <Switch 
                    id="enableJsonResponse"
                    checked={formatOptions.enableJsonResponse}
                    onCheckedChange={(value) => setFormatOptions({
                      ...formatOptions,
                      enableJsonResponse: value
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="includeVehicleRecommendations">Include Vehicle Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Include vehicle recommendations in response when appropriate
                    </p>
                  </div>
                  <Switch 
                    id="includeVehicleRecommendations"
                    checked={formatOptions.includeVehicleRecommendations}
                    onCheckedChange={(value) => setFormatOptions({
                      ...formatOptions,
                      includeVehicleRecommendations: value
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="considerHandover">Consider Handover Detection</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable detection of scenarios requiring human handover
                    </p>
                  </div>
                  <Switch 
                    id="considerHandover"
                    checked={formatOptions.considerHandover}
                    onCheckedChange={(value) => setFormatOptions({
                      ...formatOptions,
                      considerHandover: value
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="generateHandoverDossier">Generate Handover Dossier</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate detailed handover dossier for human representatives
                    </p>
                  </div>
                  <Switch 
                    id="generateHandoverDossier"
                    checked={formatOptions.generateHandoverDossier}
                    onCheckedChange={(value) => setFormatOptions({
                      ...formatOptions,
                      generateHandoverDossier: value
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}