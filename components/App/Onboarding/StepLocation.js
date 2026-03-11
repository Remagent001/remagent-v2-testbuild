"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

const AddressAutocomplete = dynamic(() => import("@/components/App/AddressAutocomplete"), { ssr: false });

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function StepLocation({ data, onNext, onBack, onSaveExit, onSkip, saving }) {
  const loc = data?.location;
  const [fullAddress, setFullAddress] = useState(loc?.fullAddress || "");
  const [city, setCity] = useState(loc?.city || "");
  const [state, setState] = useState(loc?.state || "");
  const [zip, setZip] = useState(loc?.zip || "");
  const [country, setCountry] = useState(loc?.country || "United States");

  const [hasDifferentWork, setHasDifferentWork] = useState(!!(loc?.workAddress || loc?.workCity));
  const [workAddress, setWorkAddress] = useState(loc?.workAddress || "");
  const [workCity, setWorkCity] = useState(loc?.workCity || "");
  const [workState, setWorkState] = useState(loc?.workState || "");
  const [workZip, setWorkZip] = useState(loc?.workZip || "");
  const [workCountry, setWorkCountry] = useState(loc?.workCountry || "United States");

  const handleHomePlace = useCallback((place) => {
    setFullAddress(place.fullAddress);
    setCity(place.city);
    setState(place.state);
    setZip(place.zip);
    setCountry(place.country);
  }, []);

  const handleWorkPlace = useCallback((place) => {
    setWorkAddress(place.fullAddress);
    setWorkCity(place.city);
    setWorkState(place.state);
    setWorkZip(place.zip);
    setWorkCountry(place.country);
  }, []);

  const getData = () => ({
    fullAddress, city, state, zip, country,
    ...(hasDifferentWork ? { workAddress, workCity, workState, workZip, workCountry } : {}),
  });

  return (
    <div className="onboarding-step">
      <p className="onboarding-step-desc">
        Where are you located? Your address will only be shared after agreed upon employment.
      </p>

      <div className="form-group">
        <label className="form-label">Full Address</label>
        <AddressAutocomplete
          value={fullAddress}
          onChange={setFullAddress}
          onPlaceSelect={handleHomePlace}
          placeholder="Start typing your address..."
        />
      </div>

      <div className="form-row">
        <div className="form-group form-third">
          <label className="form-label">City</label>
          <input className="form-input" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="form-group form-third">
          <label className="form-label">State</label>
          <select className="form-input form-select" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group form-third">
          <label className="form-label">Zip Code</label>
          <input className="form-input" placeholder="Zip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-checkbox">
          <input type="checkbox" checked={hasDifferentWork} onChange={(e) => setHasDifferentWork(e.target.checked)} />
          My work location is different from my home
        </label>
      </div>

      {hasDifferentWork && (
        <>
          <div className="form-group">
            <label className="form-label">Work Address</label>
            <AddressAutocomplete
              value={workAddress}
              onChange={setWorkAddress}
              onPlaceSelect={handleWorkPlace}
              placeholder="Start typing your work address..."
            />
          </div>
          <div className="form-row">
            <div className="form-group form-third">
              <label className="form-label">Work City</label>
              <input className="form-input" placeholder="City" value={workCity} onChange={(e) => setWorkCity(e.target.value)} />
            </div>
            <div className="form-group form-third">
              <label className="form-label">Work State</label>
              <select className="form-input form-select" value={workState} onChange={(e) => setWorkState(e.target.value)}>
                <option value="">Select</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group form-third">
              <label className="form-label">Work Zip</label>
              <input className="form-input" placeholder="Zip" value={workZip} onChange={(e) => setWorkZip(e.target.value)} />
            </div>
          </div>
        </>
      )}

      <div className="onboarding-actions">
        <button className="btn-secondary" onClick={onBack} disabled={saving}>Back</button>
        <div className="onboarding-actions-right">
          <button className="btn-link" onClick={onSkip}>Skip</button>
          <button className="btn-secondary" onClick={() => onSaveExit(getData())} disabled={saving}>Save & Exit</button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => onNext(getData())} disabled={saving}>{saving ? "Saving..." : "Next"}</button>
        </div>
      </div>
    </div>
  );
}
