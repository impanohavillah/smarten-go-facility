import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Clock, DoorOpen, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toilet, updateToilet } from "@/services/toiletService";

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

  const handleDoorToggle = async (isOpen: boolean) => {
    try {
      const updates = isOpen
        ? { is_occupied: false, occupied_since: null, is_paid: false, status: "available" as const }
        : { is_occupied: true, occupied_since: new Date().toISOString(), status: "occupied" as const };

      await updateToilet(toilet.id, updates);

      toast({
        title: isOpen ? "Door Opened" : "Door Closed",
        description: `${toilet.name} door ${isOpen ? "opened" : "closed"} successfully.`,
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

        {toilet.manual_open_enabled && toilet.status !== "maintenance" && (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor={`door-toggle-${toilet.id}`} className="text-sm font-medium cursor-pointer">
                Door Control
              </Label>
            </div>
            <Switch
              id={`door-toggle-${toilet.id}`}
              checked={!toilet.is_occupied}
              onCheckedChange={handleDoorToggle}
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
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
