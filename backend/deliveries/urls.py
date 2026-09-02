from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, me_view,
    available_riders_view, DeliveryViewSet
)

router = DefaultRouter()
router.register(r'deliveries', DeliveryViewSet, basename='delivery')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/me/', me_view, name='auth_me'),
    path('riders/available/', available_riders_view, name='available_riders'),
    path('', include(router.urls)),
]
