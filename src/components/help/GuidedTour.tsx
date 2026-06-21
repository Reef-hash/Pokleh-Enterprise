import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { tourSteps, type TourStep } from "@/lib/help-content";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";

interface GuidedTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onNavigate: (pageId: string) => void;
}

export const GuidedTour = ({ open, onComplete, onSkip, onNavigate }: GuidedTourProps) => {
  const [step, setStep] = useState(0);

  const current: TourStep | undefined = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    const nextStep = tourSteps[step + 1];
    onNavigate(nextStep.targetId.replace("tour-", ""));
    setStep(step + 1);
  }, [step, isLast, onComplete, onNavigate]);

  const handlePrev = useCallback(() => {
    if (step === 0) return;
    const prevStep = tourSteps[step - 1];
    onNavigate(prevStep.targetId.replace("tour-", ""));
    setStep(step - 1);
  }, [step, onNavigate]);

  const handleSkip = useCallback(() => {
    setStep(0);
    onSkip();
  }, [onSkip]);

  if (!open || !current) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={handleSkip} />
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-full max-w-lg mx-auto px-4">
        <div className="bg-card border shadow-xl rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {tourSteps.length}
            </span>
            <button onClick={handleSkip} className="p-1 hover:bg-muted rounded-md" aria-label="Skip tour">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-1">{current.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{current.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrev} disabled={step === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <SkipForward className="h-4 w-4 mr-1" /> Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {isLast ? "Finish" : "Next"} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
