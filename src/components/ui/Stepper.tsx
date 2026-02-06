import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300",
                    isCompleted && "border-primary bg-primary scale-100",
                    isCurrent && "border-white/30 bg-[hsl(var(--surface-3))] scale-110",
                    !isCompleted && !isCurrent && "border-white/10 bg-[hsl(var(--surface-2))]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrent ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {!isLast && (
                <div className="flex-1 h-px mx-4 mt-[-2rem]">
                  <div
                    className={cn(
                      "h-full bg-primary origin-left transition-transform duration-300",
                      isCompleted ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                  <div className="h-px bg-white/10 -mt-px" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
