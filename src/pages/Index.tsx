import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ToiletCard from "@/components/ToiletCard";
import ToiletDialog from "@/components/ToiletDialog";
import PaymentMessages from "@/components/PaymentMessages";
import AccessLogs from "@/components/AccessLogs";
import { Toilet, subscribeToToilets, deleteToilet } from "@/services/toiletService";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedToilet, setSelectedToilet] = useState<Toilet | null>(null);

  useEffect(() => {
    checkAuth();
    const unsubscribe = subscribeToToilets((toiletsArray) => {
      setToilets(toiletsArray);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
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
      await deleteToilet(id);
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
        onSuccess={() => {}}
      />
    </div>
  );
};

export default Index;
