import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Lightbulb, AlertTriangle, ListChecks } from "lucide-react";
import { getAllHelpTopics, getHelpContent } from "@/lib/help-content";
import type { HelpContent } from "@/lib/help-content";

interface HelpCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  { key: "all", label: "All Topics" },
  { key: "management", label: "Management" },
  { key: "stock", label: "Stock" },
  { key: "sales-debt", label: "Sales & Debt" },
  { key: "operations", label: "Operations" },
];

const topicCategory: Record<string, string> = {
  dashboard: "all",
  trucks: "management",
  customers: "management",
  suppliers: "management",
  "staff-assignments": "management",
  "stock-intake": "stock",
  "stock-distribution": "stock",
  "stock-return": "stock",
  sales: "sales-debt",
  "debt-ledger": "sales-debt",
  "debt-collection": "sales-debt",
  expenses: "operations",
  "price-history": "management",
  settlements: "operations",
  "daily-closing": "operations",
  "pokleh-reports": "operations",
};

export const HelpCenterModal = ({ open, onOpenChange }: HelpCenterModalProps) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = getAllHelpTopics();
  const filtered = topics.filter(
    (t) =>
      (filter === "all" || topicCategory[t.id] === filter) &&
      (search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || t.content.purpose.toLowerCase().includes(search.toLowerCase()))
  );

  const selectedContent = selectedTopic ? getHelpContent(selectedTopic) : null;
  const selectedTitle = selectedTopic ? topics.find((t) => t.id === selectedTopic)?.title ?? "" : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSearch(""); setFilter("all"); setSelectedTopic(null); }}}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Help Center</DialogTitle>
          <DialogDescription>Search or browse help topics for all Pokleh Enterprise features.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help topics..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedTopic(null); }}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat.key}
              variant={filter === cat.key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => { setFilter(cat.key); setSelectedTopic(null); }}
            >
              {cat.label}
            </Badge>
          ))}
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-56 shrink-0 overflow-y-auto border-r pr-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No topics found.</p>
            ) : (
              <div className="space-y-1">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedTopic === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!selectedContent ? (
              <p className="text-sm text-muted-foreground">Select a topic from the list to view help content.</p>
            ) : (
              <div className="space-y-4 pr-2">
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Purpose</h3>
                  <p className="text-sm">{selectedContent.purpose}</p>
                </section>

                {selectedContent.steps.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ListChecks className="h-4 w-4" /> How to Use
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {selectedContent.steps.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </section>
                )}

                {selectedContent.mistakes.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Common Mistakes
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                      {selectedContent.mistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {selectedContent.tips.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" /> Tips
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-400">
                      {selectedContent.tips.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
