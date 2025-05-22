import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Persona {
  id: number;
  name: string;
  description: string;
  dealershipName: string;
  promptTemplate: string;
  arguments: {
    tone: string;
    priorityFeatures?: string[];
    [key: string]: any;
  };
  isDefault: boolean;
}

export default function Personas() {
  const [dealershipFilter, setDealershipFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sample personas data
  const samplePersonas: Persona[] = [
    {
      id: 1,
      name: "Friendly Advisor",
      description: "Approachable and helpful expert for first-time buyers",
      dealershipName: "Florida Motors",
      promptTemplate: "Be friendly, approachable and helpful. Focus on {priorityFeatures}. Use a {tone} tone.",
      arguments: {
        tone: "warm and friendly",
        priorityFeatures: ["safety", "reliability", "fuel economy"],
        expertise: "general",
      },
      isDefault: true,
    },
    {
      id: 2,
      name: "Technical Expert",
      description: "Detailed technical knowledge for car enthusiasts",
      dealershipName: "Texas Auto Group",
      promptTemplate: "Provide detailed technical information. Focus on {priorityFeatures}. Use a {tone} tone.",
      arguments: {
        tone: "precise and informative",
        priorityFeatures: ["performance", "technology", "specifications"],
        expertise: "technical",
      },
      isDefault: false,
    },
    {
      id: 3,
      name: "Concierge",
      description: "Premium service experience for luxury vehicles",
      dealershipName: "California Cars",
      promptTemplate: "Offer a premium concierge experience. Focus on {priorityFeatures}. Use a {tone} tone.",
      arguments: {
        tone: "professional and refined",
        priorityFeatures: ["luxury", "comfort", "exclusivity"],
        expertise: "luxury",
      },
      isDefault: true,
    },
    {
      id: 4,
      name: "Sales Assistant",
      description: "Helps qualify leads and move customers through the sales funnel",
      dealershipName: "Florida Motors",
      promptTemplate: "Help qualify leads by asking about preferences. Focus on {priorityFeatures}. Use a {tone} tone.",
      arguments: {
        tone: "helpful and direct",
        priorityFeatures: ["customer needs", "preferences", "availability"],
        expertise: "sales",
      },
      isDefault: false,
    },
    {
      id: 5,
      name: "Service Advisor",
      description: "Specialized in maintenance and service inquiries",
      dealershipName: "Texas Auto Group",
      promptTemplate: "Provide service and maintenance information. Focus on {priorityFeatures}. Use a {tone} tone.",
      arguments: {
        tone: "knowledgeable and reassuring",
        priorityFeatures: ["maintenance", "service intervals", "common issues"],
        expertise: "service",
      },
      isDefault: false,
    },
  ];

  // Filter personas based on search query and dealership
  const filteredPersonas = samplePersonas.filter((persona) => {
    const matchesSearch =
      searchQuery === "" ||
      persona.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDealership =
      dealershipFilter === "all" ||
      persona.dealershipName.toLowerCase().includes(dealershipFilter.toLowerCase());
    
    return matchesSearch && matchesDealership;
  });

  return (
    <>
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <h1 className="text-2xl font-medium">Personas</h1>
        <Button className="inline-flex items-center">
          <span className="material-icons text-sm mr-1">add</span>
          Create Persona
        </Button>
      </div>

      <Card className="p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search personas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="absolute top-2.5 left-3 material-icons text-neutral-400 text-sm">
              search
            </span>
          </div>
          <div className="relative">
            <select
              value={dealershipFilter}
              onChange={(e) => setDealershipFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Dealerships</option>
              <option value="florida">Florida Motors</option>
              <option value="texas">Texas Auto Group</option>
              <option value="california">California Cars</option>
            </select>
            <span className="absolute top-2.5 right-3 material-icons text-neutral-400 text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPersonas.map((persona) => (
          <Card key={persona.id} className="shadow hover:shadow-md transition-shadow">
            <div className="p-5 border-b flex justify-between items-center">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ${persona.isDefault ? 'bg-primary/20' : ''}`}>
                  <span className="material-icons text-primary">
                    {persona.isDefault ? 'star' : 'person'}
                  </span>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium">{persona.name}</h3>
                  <p className="text-sm text-neutral-500">{persona.dealershipName}</p>
                </div>
              </div>
              {persona.isDefault && (
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                  Default
                </span>
              )}
            </div>
            <div className="p-5">
              <p className="text-sm mb-4">{persona.description}</p>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Tone & Priorities</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs bg-neutral-100 rounded">
                    {persona.arguments.tone}
                  </span>
                  {persona.arguments.priorityFeatures?.map((feature, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-neutral-100 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Prompt Template</h4>
                <div className="bg-neutral-50 p-3 rounded text-sm font-mono overflow-x-auto">
                  {persona.promptTemplate}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center"
                >
                  <span className="material-icons text-xs mr-1">edit</span>
                  Edit
                </Button>
                {!persona.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center text-primary border-primary"
                  >
                    <span className="material-icons text-xs mr-1">star</span>
                    Set as Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs flex items-center text-error border-error hover:bg-error/10"
                >
                  <span className="material-icons text-xs mr-1">delete</span>
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
