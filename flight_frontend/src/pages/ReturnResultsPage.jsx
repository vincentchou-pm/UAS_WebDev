import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import FlightResult from "../components/FlightResult";

export default function ReturnResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("price");
  const [selectedFlight, setSelectedFlight] = useState(null);

  if (!state || !state.outboundFlight || !state.returnFlights) {
    return (
      <div className="min-h-screen bg-gray-900 text-white pt-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-2xl mb-6">No flight data found.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  const outboundFlight = state.outboundFlight;
  const returnFlights = state.returnFlights || [];
  const searchParams = state.searchParams || {};

  const sortFlights = (flightsToSort) => {
    return [...flightsToSort].sort((a, b) => {
      if (sortBy === "price") {
        return parseFloat(a.price?.total || 0) - parseFloat(b.price?.total || 0);
      } else if (sortBy === "duration") {
        const durationA = a.itineraries?.[0]?.duration || "PT0H";
        const durationB = b.itineraries?.[0]?.duration || "PT0H";
        return durationA.localeCompare(durationB);
      }
      return 0;
    });
  };

  const sortedFlights = sortFlights(returnFlights);

  const handleSelectFlight = () => {
    if (!selectedFlight) {
      alert("Please select a return flight");
      return;
    }

    navigate("/booking/roundtrip", {
      state: {
        outboundFlight: outboundFlight,
        returnFlight: selectedFlight,
        tripType: "twoway",
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-400 hover:text-blue-300 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back
          </button>

          <h1 className="text-4xl font-bold mb-2">Select Return Flight</h1>
          <p className="text-gray-400">
            {`${searchParams.destination || searchParams.destination_display || "?"} → ${searchParams.origin || searchParams.origin_display || "?"} | ${searchParams.return_date || "?"}`}
          </p>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mt-6 mb-6 flex justify-between items-center">
            <span className="text-gray-400">
              {`Found ${sortedFlights.length} flights`}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-gray-700 text-white rounded px-4 py-2 border border-gray-600"
            >
              <option value="price">Sort by Price</option>
              <option value="duration">Sort by Duration</option>
            </select>
          </div>
        </div>

        {/* OUTBOUND FLIGHT SUMMARY */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Your Outbound Flight:</h3>
          <FlightResult flight={outboundFlight} isSelected={true} onSelect={() => {}} />
        </div>

        {/* RETURN FLIGHTS LIST */}
        {sortedFlights.length > 0 ? (
          <>
            {selectedFlight && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSelectFlight}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg sticky top-20 z-10"
                >
                  Proceed to Booking
                </button>
              </div>
            )}

            <div className="space-y-4">
              {sortedFlights.map((flight, index) => (
                <FlightResult
                  key={index}
                  flight={flight}
                  isSelected={selectedFlight === flight}
                  onSelect={() => setSelectedFlight(flight)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-6">No return flights found for this route.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Try Another Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
