from django.urls import path
from .views import search_destinations, flight_search, flight_searchresults, book_flight

urlpatterns = [
    path("search-destinations/", search_destinations),
    path("search/", flight_search),
    path("price/", flight_searchresults),
    path("book/", book_flight),
]
