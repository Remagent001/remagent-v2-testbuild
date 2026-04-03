"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  { num: 1, label: "Getting Started", short: "Start", full: "Getting Started", component: StepGettingStarted },
  { num: 2, label: "Experience", short: "Exp", full: "Experience", component: StepExperience },
  { num: 3, label: "Channels", short: "Chan", full: "Channels", component: StepChannels },
  { num: 4, label: "Education", short: "Edu", full: "Education", component: StepEducation },
  { num: 5, label: "Employment", short: "Work", full: "Employment", component: StepEmployment },
  { num: 6, label: "Languages", short: "Lang", full: "Languages", component: StepLanguages },
  { num: 7, label: "Availability", short: "Avail", full: "Availability", component: StepAvailability },
  { num: 8, label: "Environment", short: "Enviro", full: "Environment", component: StepEnvironment },
  { num: 9, label: "Hourly Rate", short: "Rate", full: "Hourly Rate", component: StepHourlyRate },
  { num: 10, label: "Photo & Video", short: "Media", full: "Photo & Video", component: StepPhotoVideo },
  { num: 11, label: "Location", short: "Loc", full: "Location", component: StepLocation },
  { num: 12, label: "Contact", short: "Contact", full: "Contact", component: StepContact },
  { num: 13, label: "Agreement", short: "Agree", full: "Agreement", component: StepAgreement },
];

const TOTAL = STEPS.length;

export default function OnboardingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step");
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
      if (requestedStep) {
        const s = parseInt(requestedStep, 10);
        if (s >= 1 && s <= TOTAL) setCurrentStep(s);
      } else if (data) {
        const step = data.profile?.onboardingStep || 1;
        setCurrentStep(Math.min(step, TOTAL));
      }
      setLoading(false);
    });

    // Silently record geolocation for business search
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetch("/api/onboarding/geo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        },
        () => {} // user denied — that's fine
      );
    }
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
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
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
  const completedSteps = allData?.profile?.completedSteps ? JSON.parse(allData.profile.completedSteps) : [];

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
