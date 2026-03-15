"use client";

const STEPS = [
  { num: 1, label: "Invite Sent" },
  { num: 2, label: "Reviewed" },
  { num: 3, label: "Questions" },
  { num: 4, label: "Interview" },
  { num: 5, label: "SOW Drafted" },
  { num: 6, label: "SOW Signed" },
  { num: 7, label: "Hired" },
];

export default function ProgressBubbles({ currentStep = 1, compact = false }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 0,
      padding: compact ? "4px 0" : "8px 0",
      width: "100%",
    }}>
      {STEPS.map((step, i) => {
        const isComplete = step.num <= currentStep;
        const isCurrent = step.num === currentStep;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.num} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            {/* Bubble */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: compact ? 24 : 32 }}>
              <div style={{
                width: compact ? 20 : 28,
                height: compact ? 20 : 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: compact ? "0.55rem" : "0.65rem",
                fontWeight: 700,
                transition: "all 0.3s",
                background: isComplete ? "var(--teal)" : "var(--gray-100)",
                color: isComplete ? "white" : "var(--gray-400)",
                border: isCurrent ? "2px solid var(--teal)" : "2px solid transparent",
                boxShadow: isCurrent ? "0 0 0 3px var(--teal-dim)" : "none",
              }}>
                {isComplete && step.num < currentStep ? (
                  <svg width={compact ? 10 : 14} height={compact ? 10 : 14} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              {!compact && (
                <span style={{
                  fontSize: "0.6rem",
                  fontWeight: isCurrent ? 700 : 500,
                  color: isComplete ? "var(--teal)" : "var(--gray-400)",
                  marginTop: 4,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                }}>
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: 2,
                background: step.num < currentStep ? "var(--teal)" : "var(--gray-200)",
                marginBottom: compact ? 0 : 18,
                minWidth: 8,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
