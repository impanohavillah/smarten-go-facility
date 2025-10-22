import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, DoorOpen, Edit, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface ToiletCardProps {
  toilet: Toilet;
  onEdit: (toilet: Toilet) => void;
  onDelete: (id: string) => void;
}

const ToiletCard = ({ toilet, onEdit, onDelete }: ToiletCardProps) => {
  const { toast } = useToast();
  const [occupiedDuration, setOccupiedDuration] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (toilet.is_occupied && toilet.occupied_since) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - new Date(toilet.occupied_since!).getTime()) / 1000 / 60);
        setOccupiedDuration(duration);
        
        // Security alert if occupied for more than 15 minutes
        if (duration > 15) {
          setShowAlert(true);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setOccupiedDuration(0);
      setShowAlert(false);
    }
  }, [toilet.is_occupied, toilet.occupied_since]);

  const handleManualOpen = async () => {
    try {
      const { error } = await supabase
        .from("toilets")
        .update({ is_occupied: false, occupied_since: null, is_paid: false })
        .eq("id", toilet.id);

      if (error) throw error;

      toast({
        title: "Door Opened",
        description: `${toilet.name} has been manually opened.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = () => {
    if (toilet.status === "maintenance") return "bg-muted";
    if (toilet.is_occupied) return "bg-warning";
    return "bg-success";
  };

  const getStatusText = () => {
    if (toilet.status === "maintenance") return "Maintenance";
    if (toilet.is_occupied) return toilet.is_paid ? "Occupied (Paid)" : "Occupied (Unpaid)";
    return "Available";
  };

  return (
    <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{toilet.name}</CardTitle>
            {toilet.location && (
              <p className="text-sm text-muted-foreground">{toilet.location}</p>
            )}
          </div>
          <Badge className={`${getStatusColor()} text-white`}>{getStatusText()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {toilet.is_occupied && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Duration: <span className="font-medium text-foreground">{occupiedDuration} min</span>
              </span>
            </div>
            {showAlert && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-md">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Security Alert: Extended occupancy</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {toilet.manual_open_enabled && toilet.is_occupied && (
            <Button
              onClick={handleManualOpen}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              Manual Open
            </Button>
          )}
          <Button
            onClick={() => onEdit(toilet)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(toilet.id)}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ToiletCard;
