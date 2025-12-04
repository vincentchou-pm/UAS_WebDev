import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FlightSearchPage() {
  const [form, setForm] = useState({
    origin: "",
    origin_display: "",
    destination: "",
    destination_display: "",
    departure_date: "",
    return_date: "",
    trip_type: "oneway",
    passenger_count: 1,
  });

  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Search for destinations/airports
  async function searchAirports(keyword) {
    if (keyword.length < 1) return [];
    
    try {
      const response = await fetch("http://localhost:8000/flight_app/search-destinations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      if (response.ok) {
        const results = await response.json();
        return results;
      }
    } catch (err) {
      console.error("Error searching airports:", err);
    }
    return [];
  }

  async function handleOriginChange(e) {
    const value = e.target.value;
    setForm({ ...form, origin_display: value });
    setError("");

    if (value.length > 0) {
      const suggestions = await searchAirports(value);
      setOriginSuggestions(suggestions);
      setShowOriginDropdown(true);
    } else {
      setShowOriginDropdown(false);
    }
  }

  async function handleDestinationChange(e) {
    const value = e.target.value;
    setForm({ ...form, destination_display: value });
    setError("");

    if (value.length > 0) {
      const suggestions = await searchAirports(value);
      setDestinationSuggestions(suggestions);
      setShowDestinationDropdown(true);
    } else {
      setShowDestinationDropdown(false);
    }
  }

  function selectOrigin(airport) {
    setForm({ 
      ...form, 
      origin: airport.iataCode,
      origin_display: airport.iataCode
    });
    setShowOriginDropdown(false);
  }

  function selectDestination(airport) {
    setForm({ 
      ...form, 
      destination: airport.iataCode,
      destination_display: airport.iataCode
    });
    setShowDestinationDropdown(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  }

  function swapAirports() {
    setForm({
      ...form,
      origin: form.destination,
      origin_display: form.destination_display,
      destination: form.origin,
      destination_display: form.origin_display,
    });
  }

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!form.origin_display || !form.destination_display || !form.departure_date) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (form.trip_type === "twoway" && !form.return_date) {
      setError("Please select return date for round trip");
      setLoading(false);
      return;
    }

    try {
      // Use the actual code if selected from dropdown, otherwise use the typed display value
      const origin = form.origin || form.origin_display;
      const destination = form.destination || form.destination_display;

      const payload = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_date: form.departure_date,
        return_date: form.return_date || null,
        trip_type: form.trip_type,
        passenger_count: parseInt(form.passenger_count),
      };

      const response = await fetch("http://localhost:8000/flight_app/search/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Search failed";
        
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}. Make sure Django backend is running on http://localhost:8000`;
        }
        throw new Error(errorMessage);
      }

      const flights = await response.json();

      if (!flights || flights.length === 0) {
        setError("No flights found for this route");
        setLoading(false);
        return;
      }

      navigate("/results", {
        state: {
          flights,
          searchParams: form,
        },
      });
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOriginFocus() {
    if (form.origin_display.length > 0) {
      const suggestions = await searchAirports(form.origin_display);
      setOriginSuggestions(suggestions);
      setShowOriginDropdown(true);
    }
  }

  async function handleDestinationFocus() {
    if (form.destination_display.length > 0) {
      const suggestions = await searchAirports(form.destination_display);
      setDestinationSuggestions(suggestions);
      setShowDestinationDropdown(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-900 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">✈ Flight Finder</h1>
          <p className="text-blue-100 text-lg">Discover your next adventure</p>
        </div>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-xl shadow-2xl p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Trip Type and Passengers Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trip Type
              </label>
              <select
                name="trip_type"
                value={form.trip_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium"
              >
                <option value="oneway">One Way</option>
                <option value="twoway">Round Trip</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Passengers
              </label>
              <select
                name="passenger_count"
                value={form.passenger_count}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "Adult" : "Adults"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class
              </label>
              <select
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium"
              >
                <option value="economy">Economy</option>
                <option value="business">Business</option>
              </select>
            </div>
          </div>

          {/* Airports Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                From
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="City or Airport Code"
                  value={form.origin_display}
                  onChange={handleOriginChange}
                  onFocus={handleOriginFocus}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium text-lg"
                />
                {showOriginDropdown && originSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                    {originSuggestions.map((airport, index) => (
                      <div
                        key={index}
                        onClick={() => selectOrigin(airport)}
                        className="px-4 py-3 hover:bg-blue-100 cursor-pointer text-black text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-bold text-lg">{airport.iataCode}</div>
                        <div className="text-gray-600 text-xs">{airport.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                To
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="City or Airport Code"
                  value={form.destination_display}
                  onChange={handleDestinationChange}
                  onFocus={handleDestinationFocus}
                  onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium text-lg"
                />
                {showDestinationDropdown && destinationSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg">
                    {destinationSuggestions.map((airport, index) => (
                      <div
                        key={index}
                        onClick={() => selectDestination(airport)}
                        className="px-4 py-3 hover:bg-blue-100 cursor-pointer text-black text-sm border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-bold text-lg">{airport.iataCode}</div>
                        <div className="text-gray-600 text-xs">{airport.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapAirports}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all"
              title="Swap airports"
            >
              ↔️
            </button>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Departure Date
              </label>
              <input
                type="date"
                name="departure_date"
                value={form.departure_date}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium"
                required
              />
            </div>

            {form.trip_type === "twoway" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Return Date
                </label>
                <input
                  type="date"
                  name="return_date"
                  value={form.return_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-gray-50 text-black font-medium"
                  required={form.trip_type === "twoway"}
                />
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg"
          >
            {loading ? "Searching..." : "🔍 Search Flights"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm">Popular routes: JKT → DPS • SIN → BKK • KUL → HAN</p>
        </div>
      </div>
    </div>
  );
}
