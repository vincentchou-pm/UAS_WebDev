import { useState } from "react";

export default function FlightResult({ flight, isSelected, onSelect }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!flight) {
    return <div className="text-red-500">Error: Flight data not available</div>;
  }

  const getFlightInfo = (flightData) => {
    try {
      const firstItinerary = flightData.itineraries?.[0];
      const firstSegment = firstItinerary?.segments?.[0];
      const lastSegment = firstItinerary?.segments?.[firstItinerary?.segments?.length - 1];

      const departure = firstSegment?.departure?.at || "N/A";
      const arrival = lastSegment?.arrival?.at || "N/A";
      const departureTime = departure
        ? new Date(departure).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "N/A";
      const arrivalTime = arrival
        ? new Date(arrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "N/A";
      const departureDate = departure ? new Date(departure).toLocaleDateString() : "N/A";
      const arrivalDate = arrival ? new Date(arrival).toLocaleDateString() : "N/A";

      const airline = firstSegment?.operating?.carrierCode || firstSegment?.carrierCode || "N/A";
      const airlineName = firstSegment?.operating?.name || firstSegment?.airline?.name || airline || "Unknown Airline";
      const flightNumber = firstSegment?.number || "N/A";
      const price = flightData.price?.total || "N/A";
      const currency = flightData.price?.currency || "IDR";
      const duration = firstItinerary?.duration || "PT0H";
      const departureCode = firstSegment?.departure?.iataCode || "N/A";
      const arrivalCode = lastSegment?.arrival?.iataCode || "N/A";
      const stops = (firstItinerary?.segments?.length || 1) - 1;

      return {
        departureTime,
        arrivalTime,
        departureDate,
        arrivalDate,
        airline,
        airlineName,
        flightNumber,
        price,
        currency,
        duration,
        departureCode,
        arrivalCode,
        stops,
        segments: firstItinerary?.segments || [],
      };
    } catch (error) {
      console.error("Error parsing flight info:", error);
      return {
        departureTime: "N/A",
        arrivalTime: "N/A",
        departureDate: "N/A",
        arrivalDate: "N/A",
        airline: "N/A",
        airlineName: "Unknown",
        flightNumber: "N/A",
        price: "N/A",
        currency: "IDR",
        duration: "N/A",
        departureCode: "N/A",
        arrivalCode: "N/A",
        stops: 0,
        segments: [],
      };
    }
  };

  const info = getFlightInfo(flight);

  const parseDuration = (isoDuration) => {
    if (!isoDuration || typeof isoDuration !== "string") return "N/A";

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return isoDuration;

    const hours = match[1] || "0";
    const minutes = match[2] || "0";
    return `${hours}h ${minutes}m`;
  };

  return (
    <div
      onClick={() => onSelect(flight)}
      className={`p-6 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-lg"
          : "border-gray-200 bg-white hover:border-blue-400 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: Airline & Flight Info */}
        <div className="flex-shrink-0">
          <p className="font-bold text-gray-900 text-sm">{info.airlineName}</p>
          <p className="text-xs text-gray-500">{info.airline} {info.flightNumber}</p>
        </div>

        {/* Middle: Flight times and route */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-gray-900">{info.departureTime}</p>
              <p className="text-sm text-gray-600">{info.departureCode}</p>
            </div>

            <div className="text-center px-4">
              <p className="text-sm font-semibold text-gray-700">{parseDuration(info.duration)}</p>
              <div className="flex items-center gap-2 my-1">
                <div className="h-px flex-1 bg-gray-400"></div>
                <span className="text-xs text-gray-500">
                  {info.stops === 0 ? "Direct" : `${info.stops} stop${info.stops > 1 ? "s" : ""}`}
                </span>
                <div className="h-px flex-1 bg-gray-400"></div>
              </div>
            </div>

            <div>
              <p className="text-2xl font-bold text-gray-900">{info.arrivalTime}</p>
              <p className="text-sm text-gray-600">{info.arrivalCode}</p>
            </div>
          </div>

          {/* Refund & Reschedule info */}
          <div className="text-xs text-green-600 font-semibold">Bisa reschedule & refund</div>
        </div>

        {/* Right: Price */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Setelah cashback</p>
          <p className="text-3xl font-bold text-red-500">{info.currency} {info.price}</p>
          <p className="text-xs text-gray-600">/pax</p>
          {isSelected && (
            <p className="text-xs text-green-600 font-semibold mt-2">✓ Selected</p>
          )}
        </div>
      </div>

      {/* Details Toggle */}
      {info.segments.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="mt-4 text-blue-600 hover:text-blue-700 text-xs font-semibold"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      )}

      {/* Details Section */}
      {showDetails && info.segments.length > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <h4 className="font-semibold text-gray-900 mb-3 text-sm">Flight Segments:</h4>
          {info.segments.map((segment, idx) => (
            <div key={idx} className="mb-2 text-xs text-gray-700">
              <p>
                <span className="font-semibold">{segment.departure?.iataCode}</span> →{" "}
                <span className="font-semibold">{segment.arrival?.iataCode}</span>
              </p>
              <p className="text-gray-600">
                {new Date(segment.departure?.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(segment.arrival?.at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
