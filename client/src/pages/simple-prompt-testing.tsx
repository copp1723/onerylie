import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Copy } from "lucide-react";

export default function SimplePromptTesting() {
  const [customerMessage, setCustomerMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(`You are Rylie, an AI assistant for automotive dealerships. Your goal is to provide helpful, friendly information about vehicles and services the dealership offers. Answer customer questions professionally and accurately. 

When a customer is interested in a specific vehicle or has financing/pricing questions, collect their contact information and offer to connect them with a sales representative. Be conversational but efficient in your responses.

Context about dealership: You represent [Dealership Name], which sells new and used vehicles from various manufacturers. The dealership offers financing, service, and parts departments.`);
  
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const result = await fetch('/api/prompt-test/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerMessage,
          systemPrompt
        }),
      });
      
      if (!result.ok) {
        throw new Error(`Error: ${result.status}`);
      }
      
      const data = await result.json();
      setResponse(data.response);
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Simple Prompt Testing Interface</h1>
      <p className="text-muted-foreground mb-6">
        Test your Rylie AI prompts without requiring authentication.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Prompt Configuration</CardTitle>
            <CardDescription>
              Configure the system prompt and customer message
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    System Prompt
                  </label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[200px]"
                    placeholder="Enter the system prompt..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer Message
                  </label>
                  <Textarea
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Enter a customer message to test..."
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading || !customerMessage || !systemPrompt}
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
                {error && (
                  <div className="text-destructive text-sm mt-2">{error}</div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              View the AI generated response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-4 min-h-[300px] relative">
              {response ? (
                <div className="whitespace-pre-line">{response}</div>
              ) : (
                <div className="text-muted-foreground">
                  Response will appear here after testing a prompt...
                </div>
              )}
              {response && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(response)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
          {response && (
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                To refine your response, adjust the system prompt and try again.
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}