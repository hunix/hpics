import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  User,
  FileText,
  Calendar,
  MessageSquare,
  Image,
  Search,
  Clock,
  Sparkles,
  Building2,
  Briefcase,
  Filter,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { AdvancedContactSearch } from "./AdvancedContactSearch";

interface SearchResult {
  id: string;
  type: "contact" | "document" | "event" | "message" | "media";
  title: string;
  subtitle?: string;
  avatar?: string;
  url: string;
  timestamp?: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("pics-recent-searches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search contacts with multi-word matching
  const { data: contacts = [] } = useQuery({
    queryKey: ["global-search-contacts", query],
    queryFn: async () => {
      if (!user || query.length < 2) return [];
      
      const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length >= 2);
      if (searchTerms.length === 0) return [];
      
      // Fetch contacts matching the first term, then filter client-side for multi-word
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, organization, job_title, avatar_url")
        .eq("user_id", user.id)
        .or(`first_name.ilike.%${searchTerms[0]}%,last_name.ilike.%${searchTerms[0]}%,organization.ilike.%${searchTerms[0]}%,job_title.ilike.%${searchTerms[0]}%`)
        .limit(50);
      
      // Filter for ALL terms matching
      const filtered = (data || []).filter(c => {
        const fullText = [c.first_name, c.last_name, c.organization, c.job_title]
          .filter(Boolean).join(' ').toLowerCase();
        return searchTerms.every(term => fullText.includes(term));
      }).slice(0, 5);
      
      return filtered.map((c): SearchResult => ({
        id: c.id,
        type: "contact",
        title: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Unnamed",
        subtitle: [c.job_title, c.organization].filter(Boolean).join(" at "),
        avatar: c.avatar_url || undefined,
        url: `/contacts/${c.id}`,
      }));
    },
    enabled: !!user && query.length >= 2,
  });

  // Search documents (including AI metadata)
  const { data: documents = [] } = useQuery({
    queryKey: ["global-search-documents", query],
    queryFn: async () => {
      if (!user || query.length < 2) return [];
      
      // Search by title
      const { data: byTitle } = await supabase
        .from("documents")
        .select("id, title, document_type, created_at, profile_id, ai_metadata")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`)
        .limit(5);
      
      // Also search by AI metadata
      const { data: byAIMetadata } = await supabase
        .from("documents")
        .select("id, title, document_type, created_at, profile_id, ai_metadata")
        .eq("user_id", user.id)
        .eq("ai_generation_status", "completed")
        .or(`ai_metadata->ai_summary.ilike.%${query}%`)
        .limit(5);
      
      // Combine and dedupe
      const allDocs = [...(byTitle || []), ...(byAIMetadata || [])];
      const seen = new Set<string>();
      const deduped = allDocs.filter(d => {
        if (seen.has(d.id)) return false;
        seen.add(d.id);
        return true;
      }).slice(0, 5);
      
      return deduped.map((d: any): SearchResult => {
        const aiSummary = d.ai_metadata?.ai_summary;
        return {
          id: d.id,
          type: "document",
          title: d.title,
          subtitle: aiSummary 
            ? `${aiSummary.substring(0, 50)}${aiSummary.length > 50 ? "..." : ""}`
            : d.document_type,
          url: d.profile_id ? `/contacts/${d.profile_id}` : "/documents",
          timestamp: d.created_at,
        };
      });
    },
    enabled: !!user && query.length >= 2,
  });

  // Search events
  const { data: events = [] } = useQuery({
    queryKey: ["global-search-events", query],
    queryFn: async () => {
      if (!user || query.length < 2) return [];
      
      const { data } = await supabase
        .from("events")
        .select("id, title, event_type, event_date, profile_id")
        .eq("user_id", user.id)
        .ilike("title", `%${query}%`)
        .limit(5);
      
      return (data || []).map((e): SearchResult => ({
        id: e.id,
        type: "event",
        title: e.title,
        subtitle: `${e.event_type} • ${format(new Date(e.event_date), "MMM d, yyyy")}`,
        url: "/calendar",
        timestamp: e.event_date,
      }));
    },
    enabled: !!user && query.length >= 2,
  });

  // Search messages
  const { data: messages = [] } = useQuery({
    queryKey: ["global-search-messages", query],
    queryFn: async () => {
      if (!user || query.length < 2) return [];
      
      const { data } = await supabase
        .from("messages")
        .select("id, content, sent_at, conversation_id, conversations(profile_id, profiles(first_name, last_name))")
        .eq("user_id", user.id)
        .ilike("content", `%${query}%`)
        .limit(5);
      
      return (data || []).map((m: any): SearchResult => {
        const profile = m.conversations?.profiles;
        const contactName = profile 
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
          : "Unknown";
        
        return {
          id: m.id,
          type: "message",
          title: m.content?.substring(0, 80) + (m.content?.length > 80 ? "..." : ""),
          subtitle: `Message with ${contactName}`,
          url: m.conversations?.profile_id ? `/contacts/${m.conversations.profile_id}` : "/communications",
          timestamp: m.sent_at,
        };
      });
    },
    enabled: !!user && query.length >= 2,
  });

  // Search media (including AI metadata)
  const { data: media = [] } = useQuery({
    queryKey: ["global-search-media", query],
    queryFn: async () => {
      if (!user || query.length < 2) return [];
      
      // Search by caption
      const { data: byCaption } = await supabase
        .from("media")
        .select("id, caption, mime_type, created_at, profile_id, ai_metadata, profiles(first_name, last_name)")
        .eq("user_id", user.id)
        .ilike("caption", `%${query}%`)
        .limit(5);
      
      // Also search by AI metadata description and tags
      const { data: byAIMetadata } = await supabase
        .from("media")
        .select("id, caption, mime_type, created_at, profile_id, ai_metadata, profiles(first_name, last_name)")
        .eq("user_id", user.id)
        .eq("ai_generation_status", "completed")
        .or(`ai_metadata->ai_description.ilike.%${query}%,ai_metadata->transcription.ilike.%${query}%,ai_metadata->summary.ilike.%${query}%`)
        .limit(5);
      
      // Combine and dedupe
      const allMedia = [...(byCaption || []), ...(byAIMetadata || [])];
      const seen = new Set<string>();
      const deduped = allMedia.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      }).slice(0, 5);
      
      return deduped.map((m: any): SearchResult => {
        const profile = m.profiles;
        const contactName = profile 
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() 
          : "Unassigned";
        
        // Use AI description if available
        const aiDesc = m.ai_metadata?.ai_description || m.ai_metadata?.summary;
        const displayTitle = m.caption || "Unnamed media";
        
        return {
          id: m.id,
          type: "media",
          title: displayTitle,
          subtitle: aiDesc 
            ? `${aiDesc.substring(0, 50)}${aiDesc.length > 50 ? "..." : ""}`
            : `${m.mime_type || "Media"} • ${contactName}`,
          url: m.profile_id ? `/contacts/${m.profile_id}` : "/media",
          timestamp: m.created_at,
        };
      });
    },
    enabled: !!user && query.length >= 2,
  });

  const handleSelect = useCallback((result: SearchResult) => {
    // Save to recent searches
    const newRecent = [result.title, ...recentSearches.filter(r => r !== result.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem("pics-recent-searches", JSON.stringify(newRecent));
    
    setOpen(false);
    setQuery("");
    navigate(result.url);
  }, [navigate, recentSearches]);

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "contact": return <User className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      case "event": return <Calendar className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      case "media": return <Image className="h-4 w-4" />;
    }
  };

  const hasResults = contacts.length > 0 || documents.length > 0 || events.length > 0 || messages.length > 0 || media.length > 0;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-md border border-border transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
        <button
          onClick={() => navigate('/semantic-search')}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          title="AI-Powered Search"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <AdvancedContactSearch />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search contacts, documents, events, messages..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((search, i) => (
                <CommandItem 
                  key={i} 
                  onSelect={() => setQuery(search)}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {query.length >= 2 && !hasResults && (
            <CommandEmpty>No results found for "{query}"</CommandEmpty>
          )}

          {contacts.length > 0 && (
            <CommandGroup heading="Contacts">
              {contacts.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={result.avatar} />
                    <AvatarFallback className="text-xs">
                      {result.title.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {documents.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Documents">
                {documents.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {events.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Events">
                {events.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {messages.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Messages">
                {messages.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {media.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Media">
                {media.map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    {getIcon(result.type)}
                    <div className="flex flex-col">
                      <span className="line-clamp-1">{result.title}</span>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {query.length < 2 && recentSearches.length === 0 && (
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-4">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            </CommandEmpty>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
