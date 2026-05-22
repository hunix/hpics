import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppQuickActionProps {
  phoneNumber: string;
  contactName?: string;
  message?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WhatsAppQuickAction({ 
  phoneNumber, 
  contactName,
  message,
  variant = 'outline',
  size = 'sm',
  className
}: WhatsAppQuickActionProps) {
  const { toast } = useToast();

  const handleClick = () => {
    // Clean phone number
    let cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');
    if (!cleanNumber.startsWith('+')) {
      cleanNumber = '+' + cleanNumber;
    }
    // Remove + for wa.me URL
    const waNumber = cleanNumber.replace('+', '');

    // Build wa.me URL
    let url = `https://wa.me/${waNumber}`;
    if (message) {
      url += `?text=${encodeURIComponent(message)}`;
    }

    window.open(url, '_blank');
    
    toast({ 
      title: 'Opening WhatsApp', 
      description: `Starting chat with ${contactName || phoneNumber}` 
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title={`Message ${contactName || phoneNumber} on WhatsApp`}
    >
      <MessageCircle className="h-4 w-4 text-green-500" />
      {size !== 'icon' && <span className="ml-2">WhatsApp</span>}
    </Button>
  );
}
