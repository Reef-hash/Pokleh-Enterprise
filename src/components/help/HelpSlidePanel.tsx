import { X, Lightbulb, AlertTriangle, ListChecks } from "lucide-react";
import type { HelpContent } from "@/lib/help-content";

interface HelpSlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: HelpContent | null;
}

export const HelpSlidePanel = ({ open, onClose, title, content }: HelpSlidePanelProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 lg:hidden" onClick={onClose} />
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Help: {title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md" aria-label="Close help panel">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-65px)] p-4 space-y-6">
          {!content ? (
            <p className="text-muted-foreground text-sm">No help content available for this page.</p>
          ) : (
            <>
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Purpose</h3>
                <p className="text-sm">{content.purpose}</p>
              </section>

              {content.steps.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ListChecks className="h-4 w-4" /> How to Use
                  </h3>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm">
                    {content.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </section>
              )}

              {content.mistakes.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Common Mistakes
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-destructive">
                    {content.mistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </section>
              )}

              {content.tips.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4" /> Tips
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-sm text-green-700 dark:text-green-400">
                    {content.tips.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
