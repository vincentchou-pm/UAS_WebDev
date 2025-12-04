from django.urls import path
from .views import flight_search, flight_searchresults, book_flight

urlpatterns = [
    path("search/", flight_search),
    path("price/", flight_searchresults),
    path("book/", book_flight),
]   
