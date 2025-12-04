import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import FlightResult from "../components/FlightResult";

export default function FlightResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("price");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);

  useEffect(() => {
    if (state?.flights && state?.searchParams) {
      const flights = state.flights || [];
      const searchParams = state.searchParams || {};

      if (searchParams.trip_type === "twoway" && searchParams.return_date) {
        // Separate flights by departure date for round-trip
        const departDate = searchParams.departure_date;
        const returnDate = searchParams.return_date;

        const outbound = flights.filter((f) => {
          const depDate = f.itineraries?.[0]?.segments?.[0]?.departure?.at?.split("T")[0];
          return depDate === departDate;
        });

        const returnFlts = flights.filter((f) => {
          const depDate = f.itineraries?.[0]?.segments?.[0]?.departure?.at?.split("T")[0];
          return depDate === returnDate;
        });

        setOutboundFlights(outbound);
        setReturnFlights(returnFlts);
      }
    }
  }, [state]);

  if (!state || !state.flights) {
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

  const flights = state.flights || [];
  const searchParams = state.searchParams || {};
  const isRoundTrip = searchParams.trip_type === "twoway";

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

  const sortedFlights = isRoundTrip ? sortFlights(outboundFlights) : sortFlights(flights);

  const handleSelectFlight = () => {
    if (!selectedFlight) {
      alert("Please select a flight");
      return;
    }

    if (isRoundTrip) {
      // For round-trip: Go to return flight selection page
      navigate("/results/return", {
        state: {
          outboundFlight: selectedFlight,
          searchParams: searchParams,
          returnFlights: returnFlights,
        },
      });
    } else {
      // For one-way: Go directly to booking
      navigate("/booking/oneway", {
        state: {
          flight: selectedFlight,
          tripType: "oneway",
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white pt-6 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-blue-400 hover:text-blue-300 font-semibold mb-4 flex items-center gap-2"
          >
            ← Edit Search
          </button>

          <h1 className="text-4xl font-bold mb-2">
            {isRoundTrip ? "Select Outbound Flight" : "Flight Results"}
          </h1>
          <p className="text-gray-400">
            {`${searchParams.origin || searchParams.origin_display || "?"} → ${searchParams.destination || searchParams.destination_display || "?"} | ${searchParams.departure_date || "?"}`}
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

        {/* FLIGHTS LIST */}
        {sortedFlights.length > 0 ? (
          <>
            {selectedFlight && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleSelectFlight}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg sticky top-20 z-10"
                >
                  {isRoundTrip ? "Select Return Flight" : "Proceed to Booking"}
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
            <p className="text-xl text-gray-400 mb-6">No flights found for this route.</p>
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
