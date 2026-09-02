from rest_framework import permissions
from .models import UserRole


class IsPharmacyStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.PHARMACY_STAFF
        )


class IsDispatcher(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.DISPATCHER
        )


class IsRider(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.RIDER
        )


class IsCustomer(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.CUSTOMER
        )


class IsAssignedRider(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == UserRole.RIDER and 
            obj.assigned_rider == request.user
        )
