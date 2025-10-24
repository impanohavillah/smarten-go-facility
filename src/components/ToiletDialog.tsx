import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Toilet, createToilet, updateToilet } from "@/services/toiletService";

interface ToiletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toilet: Toilet | null;
  onSuccess: () => void;
}

const ToiletDialog = ({ open, onOpenChange, toilet, onSuccess }: ToiletDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "available" as "available" | "occupied" | "maintenance",
    manual_open_enabled: true,
  });

  useEffect(() => {
    if (toilet) {
      setFormData({
        name: toilet.name,
        location: toilet.location || "",
        status: toilet.status,
        manual_open_enabled: toilet.manual_open_enabled,
      });
    } else {
      setFormData({
        name: "",
        location: "",
        status: "available",
        manual_open_enabled: true,
      });
    }
  }, [toilet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (toilet) {
        await updateToilet(toilet.id, formData);
        toast({
          title: "Success",
          description: "Toilet updated successfully.",
        });
      } else {
        await createToilet({
          ...formData,
          is_occupied: false,
          occupied_since: null,
          is_paid: false,
          last_payment_time: null,
        });
        toast({
          title: "Success",
          description: "Toilet created successfully.",
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{toilet ? "Edit Toilet" : "Add New Toilet"}</DialogTitle>
          <DialogDescription>
            {toilet ? "Update toilet information" : "Create a new toilet entry"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Toilet 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Ground Floor"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "available" | "occupied" | "maintenance") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="manual-open">Manual Open Enabled</Label>
            <Switch
              id="manual-open"
              checked={formData.manual_open_enabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, manual_open_enabled: checked })
              }
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : toilet ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ToiletDialog;
