import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7days");
  const [dealershipFilter, setDealershipFilter] = useState("all");

  // Sample data for analytics page
  const conversationData = [
    { name: "Jan", count: 400 },
    { name: "Feb", count: 300 },
    { name: "Mar", count: 600 },
    { name: "Apr", count: 800 },
    { name: "May", count: 700 },
    { name: "Jun", count: 900 },
    { name: "Jul", count: 1000 },
  ];

  const responseTimeData = [
    { name: "Jan", avgTime: 1.5 },
    { name: "Feb", avgTime: 1.3 },
    { name: "Mar", avgTime: 1.2 },
    { name: "Apr", avgTime: 1.0 },
    { name: "May", avgTime: 1.1 },
    { name: "Jun", avgTime: 0.9 },
    { name: "Jul", avgTime: 0.8 },
  ];

  const escalationReasonsData = [
    { name: "Price/Financing", value: 35 },
    { name: "Complex Question", value: 25 },
    { name: "Human Requested", value: 20 },
    { name: "Technical Issue", value: 10 },
    { name: "Inventory Question", value: 10 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const conversionRatesByDealership = [
    { name: "Florida Motors", conversionRate: 28 },
    { name: "Texas Auto Group", conversionRate: 24 },
    { name: "California Cars", conversionRate: 21 },
    { name: "New York Auto", conversionRate: 18 },
    { name: "Midwest Dealers", conversionRate: 15 },
  ];

  const dailyActivityData = [
    { name: "Monday", conversations: 120, escalations: 8 },
    { name: "Tuesday", conversations: 140, escalations: 10 },
    { name: "Wednesday", conversations: 160, escalations: 12 },
    { name: "Thursday", conversations: 180, escalations: 15 },
    { name: "Friday", conversations: 150, escalations: 11 },
    { name: "Saturday", conversations: 200, escalations: 16 },
    { name: "Sunday", conversations: 90, escalations: 5 },
  ];

  return (
    <>
      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <h1 className="text-2xl font-medium">Analytics</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full px-4 py-2 pr-8 text-sm border rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">Last Year</option>
            </select>
            <span className="absolute top-2.5 right-3 material-icons text-neutral-400 text-sm pointer-events-none">
              arrow_drop_down
            </span>
          </div>
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
          <Button className="inline-flex items-center">
            <span className="material-icons text-sm mr-1">download</span>
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4 bg-white shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-primary/10 rounded-full">
              <span className="material-icons text-primary">forum</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-500">Total Conversations</p>
              <p className="text-xl font-medium">12,845</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="material-icons text-success text-sm">trending_up</span>
            <span className="ml-1 text-xs text-success">15% increase</span>
            <span className="ml-1 text-xs text-neutral-500">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-success/10 rounded-full">
              <span className="material-icons text-success">thumb_up</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-500">Conversion Rate</p>
              <p className="text-xl font-medium">24.7%</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="material-icons text-success text-sm">trending_up</span>
            <span className="ml-1 text-xs text-success">3.2% increase</span>
            <span className="ml-1 text-xs text-neutral-500">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-info/10 rounded-full">
              <span className="material-icons text-info">access_time</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-500">Avg Response Time</p>
              <p className="text-xl font-medium">0.9s</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="material-icons text-success text-sm">trending_down</span>
            <span className="ml-1 text-xs text-success">0.2s improvement</span>
            <span className="ml-1 text-xs text-neutral-500">vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-white shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 bg-warning/10 rounded-full">
              <span className="material-icons text-warning">support_agent</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-neutral-500">Escalation Rate</p>
              <p className="text-xl font-medium">5.3%</p>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="material-icons text-success text-sm">trending_down</span>
            <span className="ml-1 text-xs text-success">1.5% decrease</span>
            <span className="ml-1 text-xs text-neutral-500">vs last period</span>
          </div>
        </Card>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Conversation Volume Trend */}
        <Card className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Conversation Volume Trend</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={conversationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Conversations"
                  stroke="#1976d2"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Response Time Trend */}
        <Card className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Response Time Trend</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={responseTimeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  name="Avg Time (seconds)"
                  stroke="#4caf50"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        {/* Escalation Reasons */}
        <Card className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Escalation Reasons</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={escalationReasonsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {escalationReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion Rate by Dealership */}
        <Card className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Conversion Rate by Dealership</h2>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={conversionRatesByDealership}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar
                  dataKey="conversionRate"
                  name="Conversion Rate"
                  fill="#1976d2"
                  unit="%"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Daily Activity</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={dailyActivityData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="conversations" name="Conversations" fill="#1976d2" />
              <Bar dataKey="escalations" name="Escalations" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Insights Summary */}
      <Card className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Key Insights</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="p-2 bg-success/10 rounded-full mt-1">
              <span className="material-icons text-success">trending_up</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Increasing Engagement</h3>
              <p className="text-sm text-neutral-600">
                Conversation volume has increased by 15% compared to the previous period, indicating growing customer engagement with the platform.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-2 bg-info/10 rounded-full mt-1">
              <span className="material-icons text-info">speed</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Improved Response Times</h3>
              <p className="text-sm text-neutral-600">
                Average response time has decreased to 0.9 seconds, improving the customer experience and potentially contributing to higher conversion rates.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-2 bg-warning/10 rounded-full mt-1">
              <span className="material-icons text-warning">priority_high</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Escalation Patterns</h3>
              <p className="text-sm text-neutral-600">
                Price and financing inquiries remain the top reason for escalations (35%). Consider updating persona configurations to better handle these topics within compliance guidelines.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="p-2 bg-primary/10 rounded-full mt-1">
              <span className="material-icons text-primary">insights</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">Dealership Performance</h3>
              <p className="text-sm text-neutral-600">
                Florida Motors continues to lead in conversion rates (28%), potentially due to their optimized persona configuration and inventory integration.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
