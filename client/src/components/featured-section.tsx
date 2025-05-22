import { Button } from "@/components/ui/button";

export default function FeaturedSection() {
  return (
    <div className="p-6 mt-6 bg-white rounded-lg shadow">
      <div className="flex flex-col items-start gap-6 md:flex-row">
        <div className="flex-1">
          <h2 className="mb-2 text-xl font-medium">Rylie AI Platform</h2>
          <p className="mb-4 text-neutral-600">
            The next-generation conversational AI for automotive dealerships. 
            Customize personas, manage inventory integration, and deliver 
            exceptional customer experiences.
          </p>
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="p-1 mt-0.5 text-primary bg-primary/10 rounded-full">
                <span className="material-icons text-sm">check</span>
              </span>
              <p className="ml-2 text-sm text-neutral-600">
                Seamless API integration with your existing systems
              </p>
            </div>
            <div className="flex items-start">
              <span className="p-1 mt-0.5 text-primary bg-primary/10 rounded-full">
                <span className="material-icons text-sm">check</span>
              </span>
              <p className="ml-2 text-sm text-neutral-600">
                Customizable personas for each dealership
              </p>
            </div>
            <div className="flex items-start">
              <span className="p-1 mt-0.5 text-primary bg-primary/10 rounded-full">
                <span className="material-icons text-sm">check</span>
              </span>
              <p className="ml-2 text-sm text-neutral-600">
                Real-time inventory awareness for accurate responses
              </p>
            </div>
            <div className="flex items-start">
              <span className="p-1 mt-0.5 text-primary bg-primary/10 rounded-full">
                <span className="material-icons text-sm">check</span>
              </span>
              <p className="ml-2 text-sm text-neutral-600">
                Intelligent escalation to human support when needed
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button className="inline-flex items-center">
              Learn More
              <span className="material-icons ml-1 text-sm">arrow_forward</span>
            </Button>
          </div>
        </div>
        <div className="w-full md:w-1/3 lg:w-2/5">
          <div 
            className="w-full h-56 rounded-lg shadow-md bg-cover bg-center"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400')"
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
