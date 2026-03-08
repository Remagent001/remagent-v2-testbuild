"use client";

import { useEffect, useRef, useState } from "react";

let googleLoaded = false;
let googleLoadPromise = null;

function loadGoogle() {
  if (googleLoaded) return Promise.resolve();
  if (googleLoadPromise) return googleLoadPromise;

  const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (!key) return Promise.resolve();

  googleLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.onload = () => {
      googleLoaded = true;
      resolve();
    };
    script.onerror = () => resolve(); // fail silently
    document.head.appendChild(script);
  });
  return googleLoadPromise;
}

export default function AddressAutocomplete({ value, onChange, onPlaceSelect, placeholder, className }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadGoogle().then(() => {
      if (window.google?.maps?.places) setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      fields: ["address_components", "formatted_address"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place?.address_components) return;

      const get = (type) => {
        const c = place.address_components.find((c) => c.types.includes(type));
        return c?.short_name || "";
      };
      const getLong = (type) => {
        const c = place.address_components.find((c) => c.types.includes(type));
        return c?.long_name || "";
      };

      onPlaceSelect({
        fullAddress: place.formatted_address || "",
        city: getLong("locality") || getLong("sublocality_level_1") || "",
        state: get("administrative_area_level_1") || "",
        zip: get("postal_code") || "",
        country: getLong("country") || "",
      });
    });

    autocompleteRef.current = ac;
  }, [ready, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      className={className || "form-input"}
      placeholder={placeholder || "Start typing an address..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="off"
    />
  );
}
