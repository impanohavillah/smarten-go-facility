import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, AlertTriangle } from "lucide-react";
import { AccessLog, subscribeToRecentAccessLogs } from "@/services/accessLogService";

const AccessLogs = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToRecentAccessLogs((logsArray) => {
      setLogs(logsArray);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-RW", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Access Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Access Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No access logs yet
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
              >
                <div className="mt-1">
                  {log.security_alert ? (
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  ) : (
                    <Activity className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">
                      {log.toilet_name || "Unknown Toilet"}
                    </p>
                    {log.security_alert && (
                      <Badge className="bg-destructive text-white">Alert</Badge>
                    )}
                    {log.exit_time && !log.security_alert && (
                      <Badge className="bg-success text-white">Completed</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Entry: {formatDate(log.entry_time)}
                    </p>
                    {log.exit_time && (
                      <p className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Exit: {formatDate(log.exit_time)}
                      </p>
                    )}
                    {log.duration_minutes !== null && (
                      <p>Duration: {log.duration_minutes} minutes</p>
                    )}
                    {log.security_alert && log.alert_reason && (
                      <p className="text-destructive font-medium">
                        ⚠️ {log.alert_reason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccessLogs;
