"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepPositionDetail from "./StepPositionDetail";
import StepContext from "./StepContext";
import StepEnvironment from "./StepEnvironment";
import StepAvailability from "./StepAvailability";
import StepHourlyRate from "./StepHourlyRate";
import StepDatesDuration from "./StepDatesDuration";
import StepAttachments from "./StepAttachments";
import StepScreening from "./StepScreening";
import StepComplete from "./StepComplete";

const STEPS = [
  { num: 1, label: "Position Detail", short: "Detail", full: "Position Detail" },
  { num: 2, label: "Experience", short: "Exp", full: "Experience" },
  { num: 3, label: "Environment", short: "Enviro", full: "Environment" },
  { num: 4, label: "Availability", short: "Avail", full: "Availability" },
  { num: 5, label: "Hourly Rate", short: "Rate", full: "Hourly Rate" },
  { num: 6, label: "Dates & Duration", short: "Dates", full: "Dates & Duration" },
  { num: 7, label: "Attachments", short: "Attach", full: "Attachments" },
  { num: 8, label: "Screening", short: "Screen", full: "Screening" },
  { num: 9, label: "Complete Posting", short: "Post", full: "Complete Posting" },
];

const STEP_COMPONENTS = [
  StepPositionDetail, StepContext, StepEnvironment, StepAvailability,
  StepHourlyRate, StepDatesDuration, StepAttachments, StepScreening, StepComplete,
];

const TOTAL = STEPS.length;

export default function JobPostingWizard({ positionId }) {
  const router = useRouter();
  const isNew = !positionId || positionId === "new";
  const [currentStep, setCurrentStep] = useState(1);
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [posId, setPosId] = useState(positionId === "new" ? null : positionId);

  const loadData = useCallback(async (id) => {
    try {
      const url = id ? `/api/positions/${id}` : "/api/positions/lookup";
      const res = await fetch(url);
      const data = await res.json();
      setAllData(data);
      return data;
    } catch {
      setError("Failed to load data.");
      return null;
    }
  }, []);

  useEffect(() => {
    if (isNew) {
      // Check if there's a default position to pre-fill from
      fetch("/api/positions/lookup")
        .then((r) => r.json())
        .then((data) => {
          setAllData(data);
          // Create a draft position immediately
          return fetch("/api/positions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "draft" }),
          });
        })
        .then((r) => r.json())
        .then((result) => {
          if (result.position?.id) {
            setPosId(result.position.id);
            // Reload with the new position data
            return loadData(result.position.id);
          }
        })
        .finally(() => setLoading(false));
    } else {
      loadData(positionId).then((data) => {
        if (data?.position) {
          const step = data.position.currentStep || 1;
          setCurrentStep(Math.min(step, TOTAL));
        }
        setLoading(false);
      });
    }
  }, [isNew, positionId, loadData]);

  const saveStep = async (stepNum, stepData) => {
    if (!posId) return false;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/positions/${posId}/step`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data: stepData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      await loadData(posId);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async (stepData) => {
    const ok = await saveStep(currentStep, stepData);
    if (ok) {
      if (currentStep === TOTAL) {
        router.push("/positions");
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveExit = async (stepData) => {
    await saveStep(currentStep, stepData);
    router.push("/positions");
  };

  const handleSkip = () => {
    if (currentStep < TOTAL) setCurrentStep(currentStep + 1);
  };

  const handleStepClick = (stepNum) => {
    setCurrentStep(stepNum);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <div className="onboarding-spinner" />
        <p>Loading job posting...</p>
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[currentStep - 1];
  const completedSteps = allData?.position?.completedSteps
    ? JSON.parse(allData.position.completedSteps)
    : [];

  return (
    <div className="onboarding">
      {/* Progress bubbles */}
      <div className="onboarding-header">
        <div className="onboarding-header-top">
          <div>
            <button
              className="btn-link"
              style={{ padding: 0, fontSize: "0.85rem", marginBottom: 4 }}
              onClick={() => router.push("/positions")}
            >
              &larr; Back to Job Postings
            </button>
            <h1 className="onboarding-title">
              {allData?.position?.title || "New Job Posting"}
            </h1>
          </div>
          <span className="onboarding-step-count">
            Step {currentStep} of {TOTAL}
          </span>
        </div>

        <div className="progress-bubbles">
          {STEPS.map((step, i) => {
            const isCompleted = completedSteps.includes(step.num);
            const isCurrent = step.num === currentStep;
            return (
              <div key={step.num} className="progress-bubble-wrap">
                {i > 0 && (
                  <div className={`progress-line ${isCompleted && completedSteps.includes(STEPS[i - 1].num) ? "completed" : ""}`} />
                )}
                <button
                  type="button"
                  className={`progress-bubble ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""} accessible`}
                  onClick={() => handleStepClick(step.num)}
                  title={step.label}
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </button>
                <span className={`progress-label ${isCurrent ? "current" : ""}`}>
                  {isCurrent ? step.full : step.short}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="onboarding-body">
        <StepComponent
          data={allData}
          positionId={posId}
          onNext={handleNext}
          onBack={handleBack}
          onSaveExit={handleSaveExit}
          onSkip={handleSkip}
          isFirst={currentStep === 1}
          isLast={currentStep === TOTAL}
          saving={saving}
        />
      </div>
    </div>
  );
}
