"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepGettingStarted from "@/components/App/Onboarding/StepGettingStarted";
import StepExperience from "@/components/App/Onboarding/StepExperience";
import StepChannels from "@/components/App/Onboarding/StepChannels";
import StepEducation from "@/components/App/Onboarding/StepEducation";
import StepEmployment from "@/components/App/Onboarding/StepEmployment";
import StepLanguages from "@/components/App/Onboarding/StepLanguages";
import StepAvailability from "@/components/App/Onboarding/StepAvailability";
import StepEnvironment from "@/components/App/Onboarding/StepEnvironment";
import StepHourlyRate from "@/components/App/Onboarding/StepHourlyRate";
import StepPhotoVideo from "@/components/App/Onboarding/StepPhotoVideo";
import StepLocation from "@/components/App/Onboarding/StepLocation";
import StepContact from "@/components/App/Onboarding/StepContact";
import StepAgreement from "@/components/App/Onboarding/StepAgreement";

const STEPS = [
  { num: 1, label: "Getting Started", component: StepGettingStarted },
  { num: 2, label: "Experience", component: StepExperience },
  { num: 3, label: "Channels", component: StepChannels },
  { num: 4, label: "Education", component: StepEducation },
  { num: 5, label: "Employment", component: StepEmployment },
  { num: 6, label: "Languages", component: StepLanguages },
  { num: 7, label: "Availability", component: StepAvailability },
  { num: 8, label: "Environment", component: StepEnvironment },
  { num: 9, label: "Hourly Rate", component: StepHourlyRate },
  { num: 10, label: "Photo & Video", component: StepPhotoVideo },
  { num: 11, label: "Location", component: StepLocation },
  { num: 12, label: "Contact", component: StepContact },
  { num: 13, label: "Agreement", component: StepAgreement },
];

const TOTAL = STEPS.length;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding/load");
      const data = await res.json();
      setAllData(data);
      return data;
    } catch {
      setError("Failed to load your profile data.");
      return null;
    }
  }, []);

  // Load all onboarding data on mount
  useEffect(() => {
    loadData().then((data) => {
      if (data) {
        const step = data.profile?.onboardingStep || 1;
        setCurrentStep(Math.min(step, TOTAL));
      }
      setLoading(false);
    });
  }, [loadData]);

  const saveStep = async (stepNum, stepData) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data: stepData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Save failed");
      }
      // Reload data so all steps see the latest
      await loadData();
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
        router.push("/dashboard");
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
    router.push("/dashboard");
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
        <p>Loading your profile...</p>
      </div>
    );
  }

  const stepConfig = STEPS[currentStep - 1];
  const StepComponent = stepConfig.component;
  const highestStep = allData?.profile?.onboardingStep || 1;

  return (
    <div className="onboarding">
      {/* Progress bubbles */}
      <div className="onboarding-header">
        <div className="onboarding-header-top">
          <h1 className="onboarding-title">Complete Your Profile</h1>
          <span className="onboarding-step-count">
            Step {currentStep} of {TOTAL}
          </span>
        </div>

        <div className="progress-bubbles">
          {STEPS.map((step, i) => {
            const isCompleted = step.num < highestStep;
            const isCurrent = step.num === currentStep;
            const isAccessible = step.num <= highestStep;
            return (
              <div key={step.num} className="progress-bubble-wrap">
                {i > 0 && (
                  <div className={`progress-line ${isCompleted ? "completed" : ""}`} />
                )}
                <button
                  type="button"
                  className={`progress-bubble ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""} ${isAccessible ? "accessible" : ""}`}
                  onClick={() => isAccessible && handleStepClick(step.num)}
                  disabled={!isAccessible}
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
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && <div className="form-error">{error}</div>}

      {/* Step content */}
      <div className="onboarding-body">
        <StepComponent
          data={allData}
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
