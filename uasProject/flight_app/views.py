from amadeus import Client, ResponseError, Location
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.http import JsonResponse
import json
import uuid

amadeus = Client(
    client_id=settings.AMADEUS_API_KEY,
    client_secret=settings.AMADEUS_API_SECRET
)

@csrf_exempt
def search_destinations(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    keyword = data.get("keyword", "").strip()
    
    if not keyword or len(keyword) < 1:
        return JsonResponse({"error": "Keyword required (city name or airport code)"}, status=400)

    try:
        response = amadeus.reference_data.locations.get(
            keyword=keyword,
            subType="AIRPORT,CITY"
        )
        
        locations = response.data if response.data else []
        
        formatted_locations = []
        for location in locations:
            formatted_locations.append({
                "iataCode": location.get("iataCode"),
                "name": location.get("name"),
                "city": location.get("address", {}).get("cityName"),
                "countryCode": location.get("address", {}).get("countryCode"),
                "type": location.get("subType"),
                "fullName": f"{location.get('name')} ({location.get('iataCode')})" if location.get('iataCode') else location.get('name')
            })
        
        return JsonResponse(formatted_locations, safe=False)

    except ResponseError as error:
        return JsonResponse({"error": f"API Error: {str(error)}"}, status=400)
    except Exception as error:
        return JsonResponse({"error": f"Server Error: {str(error)}"}, status=500)

@csrf_exempt
def flight_search(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    origin = data.get("origin", "").strip().upper()
    destination = data.get("destination", "").strip().upper()
    departure_date = data.get("departure_date", "").strip()
    return_date = data.get("return_date") or ""
    passenger_count = data.get("passenger_count", 1)
    if return_date:
        return_date = return_date.strip()
    trip_type = data.get("trip_type", "oneway")

    # VALIDATION
    if not origin or not destination or not departure_date:
        return JsonResponse({"error": "Missing required fields: origin, destination, departure_date"}, status=400)

    if len(origin) != 3 or len(destination) != 3:
        return JsonResponse({"error": "Airport codes must be 3 letters"}, status=400)

    if trip_type == "twoway" and not return_date:
        return JsonResponse({"error": "Return date required for round trip"}, status=400)

    try:
        if trip_type == "oneway":
            # One-way flight search
            response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=destination,
                departureDate=departure_date,
                adults=passenger_count,
                currencyCode="IDR"
            )
            flights = response.data
            if not flights:
                return JsonResponse([], safe=False)
            return JsonResponse(flights, safe=False)
        else:
            outbound_response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=destination,
                departureDate=departure_date,
                adults=passenger_count,
                currencyCode="IDR"
            )
            
            return_response = amadeus.shopping.flight_offers_search.get(
                originLocationCode=destination,
                destinationLocationCode=origin,
                departureDate=return_date,
                adults=passenger_count,
                currencyCode="IDR"
            )
            
            outbound_flights = outbound_response.data if outbound_response.data else []
            return_flights = return_response.data if return_response.data else []
            
            # Mark flights to identify which leg they are
            for flight in outbound_flights:
                flight['_leg'] = 'outbound'
            for flight in return_flights:
                flight['_leg'] = 'return'
            
            all_flights = outbound_flights + return_flights
            
            if not all_flights:
                return JsonResponse([], safe=False)
            
            return JsonResponse(all_flights, safe=False)

    except ResponseError as error:
        return JsonResponse({"error": f"API Error: {str(error)}"}, status=400)
    except Exception as error:
        return JsonResponse({"error": f"Server Error: {str(error)}"}, status=500)


def flight_searchresults(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
        flight_offer = data.get("flight")

        if not flight_offer:
            return JsonResponse({"error": "Flight data required"}, status=400)

        priced_response = amadeus.shopping.flight_offers.pricing.post(
            body={
                "data": {
                    "type": "flight-offers-pricing",
                    "flightOffers": [flight_offer],
                    "currencyCode": "IDR",
                }
            }
        )

        priced_data = priced_response.data
        return JsonResponse(priced_data, safe=False)

    except ResponseError as error:
        return JsonResponse({"error": f"Pricing Error: {str(error)}"}, status=400)
    except Exception as error:
        return JsonResponse({"error": f"Server Error: {str(error)}"}, status=500)


@csrf_exempt
def book_flight(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
        passenger = data.get("passenger")

        if not passenger:
            return JsonResponse({"error": "Passenger data required"}, status=400)

        outbound_flight = data.get("outbound_flight")
        return_flight = data.get("return_flight")
        flight = data.get("flight")

        if not outbound_flight and not flight:
            return JsonResponse({"error": "Flight data required"}, status=400)

        # Validate passenger data
        required_fields = ["firstName", "lastName", "passportNumber", "email", "phone"]
        if not all(passenger.get(field) for field in required_fields):
            return JsonResponse({"error": "Missing passenger information"}, status=400)

        # Generate booking reference
        booking_id = f"FK{uuid.uuid4().hex[:8].upper()}"

        # For round-trip bookings
        if outbound_flight and return_flight:
            booking_response = {
                "booking_id": booking_id,
                "status": "confirmed",
                "tripType": "round-trip",
                "passenger": passenger,
                "outboundFlight": {
                    "price": outbound_flight.get("price"),
                    "itineraries": outbound_flight.get("itineraries"),
                },
                "returnFlight": {
                    "price": return_flight.get("price"),
                    "itineraries": return_flight.get("itineraries"),
                },
                "message": f"Round-trip booking confirmation sent to {passenger.get('email')}"
            }
        # For one-way bookings
        else:
            booking_response = {
                "booking_id": booking_id,
                "status": "confirmed",
                "tripType": "one-way",
                "passenger": passenger,
                "flight": {
                    "price": flight.get("price"),
                    "itineraries": flight.get("itineraries"),
                },
                "message": f"Booking confirmation sent to {passenger.get('email')}"
            }

        return JsonResponse(booking_response, safe=False)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    except Exception as error:
        return JsonResponse({"error": f"Booking Error: {str(error)}"}, status=500)