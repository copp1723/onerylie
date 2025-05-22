import StatusCard from "@/components/status-card";
import ConversationTable, { Conversation } from "@/components/conversation-table";
import ApiStatus from "@/components/api-status";
import FeaturedDealership from "@/components/featured-dealership";
import ConversationChart from "@/components/conversation-chart";
import PersonaChart from "@/components/persona-chart";
import FeaturedSection from "@/components/featured-section";
import { useState } from "react";

export default function Dashboard() {
  const [dealershipFilter, setDealershipFilter] = useState("all");
  
  // Sample data for the dashboard
  const sampleConversations: Conversation[] = [
    {
      id: 1,
      customerName: "Sarah Miller",
      dealershipName: "Florida Motors",
      lastMessage: "Do you have the 2023 RAV4 in blue?",
      status: "active",
      updatedAt: "2023-06-15T14:30:00Z",
    },
    {
      id: 2,
      customerName: "Michael Chang",
      dealershipName: "Texas Auto Group",
      lastMessage: "I'd like to schedule a test drive",
      status: "waiting",
      updatedAt: "2023-06-15T13:45:00Z",
    },
    {
      id: 3,
      customerName: "Jessica Williams",
      dealershipName: "California Cars",
      lastMessage: "What warranty options are available?",
      status: "escalated",
      updatedAt: "2023-06-15T12:15:00Z",
    },
    {
      id: 4,
      customerName: "Robert Johnson",
      dealershipName: "Florida Motors",
      lastMessage: "What's the mileage on the 2022 Civic?",
      status: "completed",
      updatedAt: "2023-06-15T10:30:00Z",
    },
    {
      id: 5,
      customerName: "Amanda Garcia",
      dealershipName: "Texas Auto Group",
      lastMessage: "Is the Silverado still available?",
      status: "active",
      updatedAt: "2023-06-15T09:45:00Z",
    },
  ];

  const apiEndpoints = [
    { path: "/inbound", status: "operational" as const, uptime: "100% uptime" },
    { path: "/reply", status: "operational" as const, uptime: "99.8% uptime" },
    { path: "/handover", status: "operational" as const, uptime: "99.9% uptime" },
  ];

  const conversationChartData = [
    { name: "Mon", count: 30 },
    { name: "Tue", count: 45 },
    { name: "Wed", count: 60 },
    { name: "Thu", count: 75 },
    { name: "Fri", count: 50 },
    { name: "Sat", count: 85 },
    { name: "Sun", count: 70 },
  ];

  const personaChartData = [
    { name: "Friendly Advisor", value: 85, percentage: "28.4%" },
    { name: "Technical Expert", value: 74, percentage: "24.7%" },
    { name: "Concierge", value: 65, percentage: "21.9%" },
    { name: "Sales Assistant", value: 54, percentage: "18.2%" },
    { name: "Service Advisor", value: 47, percentage: "15.8%" },
  ];

  const handleViewConversation = (id: number) => {
    console.log(`View conversation ${id}`);
    // Navigate to conversation details page
  };

  return (
    <>
      {/* Dashboard Header */}
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
          <div className="relative">
            <select
              value={dealershipFilter}
              onChange={(e) => setDealershipFilter(e.target.value)}
              className="block w-full px-4 py-2 pr-8 text-sm border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          <button className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50">
            <span className="material-icons text-sm mr-1">add</span>
            New Connection
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatusCard
          title="API Status"
          value="Operational"
          icon="check_circle"
          iconBgColor="bg-success/10"
          iconColor="text-success"
          progressValue={99}
          progressColor="bg-success"
          progressLabel="99.9% uptime"
        />
        <StatusCard
          title="Active Conversations"
          value="2,148"
          icon="forum"
          iconBgColor="bg-info/10"
          iconColor="text-info"
          trend={{
            value: "12% increase",
            direction: "up",
            label: "compared to last week",
          }}
        />
        <StatusCard
          title="Response Time"
          value="1.2s"
          icon="access_time"
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
          progressValue={75}
          progressColor="bg-warning"
          progressLabel="75% of target"
        />
        <StatusCard
          title="Escalations"
          value="24"
          icon="priority_high"
          iconBgColor="bg-error/10"
          iconColor="text-error"
          trend={{
            value: "8% decrease",
            direction: "up",
            label: "compared to last week",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Conversations Table */}
        <div className="col-span-2">
          <ConversationTable
            conversations={sampleConversations}
            onViewConversation={handleViewConversation}
          />
        </div>

        {/* Info Cards */}
        <div className="space-y-6">
          <ApiStatus endpoints={apiEndpoints} />
          <FeaturedDealership
            name="Florida Motors"
            subtitle="Top Performing Dealership"
            stats={{
              conversations: 547,
              conversionRate: "24.3%",
            }}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
        <ConversationChart data={conversationChartData} />
        <PersonaChart data={personaChartData} />
      </div>

      {/* Featured Section */}
      <FeaturedSection />
    </>
  );
}
