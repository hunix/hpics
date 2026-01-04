import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Contact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url?: string | null;
}

interface ContactPickerProps {
  contacts: Contact[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ContactPicker({ 
  contacts, 
  selectedId, 
  onSelect, 
  placeholder = "Search contacts...",
  disabled = false 
}: ContactPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedId),
    [contacts, selectedId]
  );

  const filteredContacts = useMemo(() => {
    if (!search) return contacts.slice(0, 100); // Show first 100 when no search
    const lower = search.toLowerCase();
    return contacts.filter(c => {
      const fullName = `${c.first_name} ${c.last_name || ''}`.toLowerCase();
      return fullName.includes(lower);
    }).slice(0, 100);
  }, [contacts, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedContact 
            ? `${selectedContact.first_name} ${selectedContact.last_name || ''}`.trim()
            : placeholder
          }
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup>
              {filteredContacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={contact.id}
                  onSelect={() => {
                    onSelect(contact.id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === contact.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {contact.first_name} {contact.last_name || ''}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
