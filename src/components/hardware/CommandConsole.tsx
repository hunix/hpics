import { useState } from 'react';
import { useHardwareCommands, COMMAND_TEMPLATES } from '@/hooks/useHardwareCommands';
import { HardwareDevice, DeviceType } from '@/types/hardware';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Terminal,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommandConsoleProps {
  devices: HardwareDevice[];
}

export function CommandConsole({ devices }: CommandConsoleProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [commandType, setCommandType] = useState<string>('');
  const [commandData, setCommandData] = useState<string>('{}');
  
  const selectedDevice = devices.find(d => d.id === selectedDeviceId);
  const templates = selectedDevice 
    ? COMMAND_TEMPLATES[selectedDevice.device_type as keyof typeof COMMAND_TEMPLATES] || []
    : [];

  const { 
    commands, 
    pendingCommands, 
    sendCommand, 
    cancelCommand,
    isLoading 
  } = useHardwareCommands(selectedDeviceId || undefined);

  const handleSendCommand = () => {
    if (!selectedDeviceId || !commandType) return;

    try {
      const data = JSON.parse(commandData);
      sendCommand.mutate({
        device_id: selectedDeviceId,
        command_type: commandType,
        command_data: data,
      });
      setCommandType('');
      setCommandData('{}');
    } catch (e) {
      console.error('Invalid JSON:', e);
    }
  };

  const applyTemplate = (template: { type: string; label: string; data: Record<string, unknown> }) => {
    setCommandType(template.type);
    setCommandData(JSON.stringify(template.data, null, 2));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Command Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Send Command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Selection */}
          <div className="space-y-2">
            <Label>Target Device</Label>
            <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${device.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {device.device_name || device.device_id}
                      <span className="text-muted-foreground text-xs capitalize">
                        ({device.device_type.replace('_', ' ')})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Commands */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Quick Commands</Label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.type}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Command Type */}
          <div className="space-y-2">
            <Label>Command Type</Label>
            <Input
              placeholder="e.g., capture_photo, read_sensors"
              value={commandType}
              onChange={(e) => setCommandType(e.target.value)}
            />
          </div>

          {/* Command Data */}
          <div className="space-y-2">
            <Label>Command Data (JSON)</Label>
            <Textarea
              placeholder='{"key": "value"}'
              value={commandData}
              onChange={(e) => setCommandData(e.target.value)}
              className="font-mono text-sm"
              rows={4}
            />
          </div>

          {/* Send Button */}
          <Button 
            className="w-full" 
            onClick={handleSendCommand}
            disabled={!selectedDeviceId || !commandType || sendCommand.isPending}
          >
            {sendCommand.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Command
          </Button>
        </CardContent>
      </Card>

      {/* Command History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Command History
            </span>
            {pendingCommands.length > 0 && (
              <Badge variant="secondary">
                {pendingCommands.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {commands.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No commands sent yet
                </p>
              ) : (
                commands.map((command) => (
                  <div
                    key={command.id}
                    className="p-3 rounded-lg border bg-card/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {command.status === 'pending' && (
                          <Clock className="h-4 w-4 text-yellow-500" />
                        )}
                        {command.status === 'sent' && (
                          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                        )}
                        {command.status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {(command.status === 'failed' || command.status === 'timeout') && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-mono text-sm">{command.command_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {command.status}
                        </Badge>
                        {command.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => cancelCommand.mutate(command.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground font-mono">
                      {JSON.stringify(command.command_data)}
                    </p>

                    {command.response && (
                      <div className="p-2 rounded bg-muted text-xs font-mono">
                        {JSON.stringify(command.response)}
                      </div>
                    )}

                    {command.error_message && (
                      <p className="text-xs text-red-500">
                        Error: {command.error_message}
                      </p>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(command.created_at))} ago
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
