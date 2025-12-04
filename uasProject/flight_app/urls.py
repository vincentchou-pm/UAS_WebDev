from django.urls import path
from .views import search_flights, price_flight, book_flight

urlpatterns = [
    path("search/", search_flights),
    path("price/", price_flight),
    path("book/", book_flight),
]   
