import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { database } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ToiletCard from "@/components/ToiletCard";
import ToiletDialog from "@/components/ToiletDialog";
import PaymentMessages from "@/components/PaymentMessages";
import AccessLogs from "@/components/AccessLogs";

interface Toilet {
  id: string;
  name: string;
  location: string | null;
  status: "available" | "occupied" | "maintenance";
  is_occupied: boolean;
  occupied_since: string | null;
  is_paid: boolean;
  last_payment_time: string | null;
  manual_open_enabled: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  useEffect(() => {
    checkAuth();
    fetchToilets();
    setupRealtimeSubscription();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchToilets = () => {
    try {
      const toiletsRef = ref(database, 'toilets');
      onValue(toiletsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const toiletsArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setToilets(toiletsArray);
        } else {
          setToilets([]);
        }
        setLoading(false);
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Firebase onValue already provides real-time updates
    // No additional setup needed
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleEdit = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const toiletRef = ref(database, `toilets/${id}`);
      await remove(toiletRef);

      toast({
        title: "Success",
        description: "Toilet deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setSelectedToilet(null);
    setDialogOpen(true);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SmartenGo
            </h1>
            <p className="text-sm text-muted-foreground">Smart Toilet Management System</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Toilet Overview</h2>
            <p className="text-sm text-muted-foreground">{toilets.length} total toilets</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Toilet
          </Button>
        </div>

        {toilets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No toilets added yet</p>
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Toilet
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toilets.map((toilet) => (
                <ToiletCard key={toilet.id} toilet={toilet} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentMessages />
              <AccessLogs />
            </div>
          </div>
        )}
      </main>

      <ToiletDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        toilet={selectedToilet}
        onSuccess={fetchToilets}
      />
    </div>
  );
};

export default Index;
