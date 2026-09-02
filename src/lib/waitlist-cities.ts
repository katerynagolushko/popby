/** Major cities for the “launch in your city” waitlist. Country in label for founder demand signal. */

export type WaitlistCityOption = {
  /** Stored value, e.g. "Berlin, Germany" or "Other" */
  value: string;
  label: string;
};

export const WAITLIST_CITIES: WaitlistCityOption[] = [
  { value: "London, United Kingdom", label: "London, United Kingdom" },
  { value: "New York, United States", label: "New York, United States" },
  { value: "San Francisco, United States", label: "San Francisco, United States" },
  { value: "Los Angeles, United States", label: "Los Angeles, United States" },
  { value: "Austin, United States", label: "Austin, United States" },
  { value: "Seattle, United States", label: "Seattle, United States" },
  { value: "Chicago, United States", label: "Chicago, United States" },
  { value: "Boston, United States", label: "Boston, United States" },
  { value: "Miami, United States", label: "Miami, United States" },
  { value: "Toronto, Canada", label: "Toronto, Canada" },
  { value: "Vancouver, Canada", label: "Vancouver, Canada" },
  { value: "Montreal, Canada", label: "Montreal, Canada" },
  { value: "Berlin, Germany", label: "Berlin, Germany" },
  { value: "Munich, Germany", label: "Munich, Germany" },
  { value: "Amsterdam, Netherlands", label: "Amsterdam, Netherlands" },
  { value: "Paris, France", label: "Paris, France" },
  { value: "Lisbon, Portugal", label: "Lisbon, Portugal" },
  { value: "Madrid, Spain", label: "Madrid, Spain" },
  { value: "Barcelona, Spain", label: "Barcelona, Spain" },
  { value: "Dublin, Ireland", label: "Dublin, Ireland" },
  { value: "Stockholm, Sweden", label: "Stockholm, Sweden" },
  { value: "Copenhagen, Denmark", label: "Copenhagen, Denmark" },
  { value: "Zurich, Switzerland", label: "Zurich, Switzerland" },
  { value: "Milan, Italy", label: "Milan, Italy" },
  { value: "Tel Aviv, Israel", label: "Tel Aviv, Israel" },
  { value: "Dubai, United Arab Emirates", label: "Dubai, United Arab Emirates" },
  { value: "Singapore, Singapore", label: "Singapore, Singapore" },
  { value: "Hong Kong, China", label: "Hong Kong, China" },
  { value: "Tokyo, Japan", label: "Tokyo, Japan" },
  { value: "Seoul, South Korea", label: "Seoul, South Korea" },
  { value: "Sydney, Australia", label: "Sydney, Australia" },
  { value: "Melbourne, Australia", label: "Melbourne, Australia" },
  { value: "Bangalore, India", label: "Bangalore, India" },
  { value: "Mumbai, India", label: "Mumbai, India" },
  { value: "São Paulo, Brazil", label: "São Paulo, Brazil" },
  { value: "Mexico City, Mexico", label: "Mexico City, Mexico" },
  { value: "Lagos, Nigeria", label: "Lagos, Nigeria" },
  { value: "Cape Town, South Africa", label: "Cape Town, South Africa" },
  { value: "Other", label: "Other (type your city)" },
];

export const WAITLIST_CITY_OTHER = "Other";

export function parseCityCountry(cityValue: string): {
  city: string;
  country: string | null;
} {
  const trimmed = cityValue.trim();
  if (!trimmed) return { city: "", country: null };
  const comma = trimmed.lastIndexOf(",");
  if (comma === -1) return { city: trimmed, country: null };
  return {
    city: trimmed.slice(0, comma).trim(),
    country: trimmed.slice(comma + 1).trim() || null,
  };
}
