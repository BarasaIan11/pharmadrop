from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, RiderProfile, Delivery, DeliveryStatusEvent


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('PharmaDrop Role', {'fields': ('role', 'phone_number')}),
    )
    list_display = ('username', 'email', 'role', 'phone_number', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')


@admin.register(RiderProfile)
class RiderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_available', 'vehicle_type', 'distance_km', 'active_tasks_count', 'rating')
    list_filter = ('is_available', 'vehicle_type')


class DeliveryStatusEventInline(admin.TabularInline):
    model = DeliveryStatusEvent
    extra = 0
    readonly_fields = ('status', 'changed_by', 'note', 'timestamp')


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'created_by', 'assigned_rider', 'status', 'confirmation_code', 'failed_code_attempts', 'is_locked', 'created_at')
    list_filter = ('status', 'is_locked', 'is_cold_chain')
    search_fields = ('order_number', 'customer__username', 'delivery_address', 'item_description')
    inlines = [DeliveryStatusEventInline]


@admin.register(DeliveryStatusEvent)
class DeliveryStatusEventAdmin(admin.ModelAdmin):
    list_display = ('delivery', 'status', 'changed_by', 'note', 'timestamp')
    list_filter = ('status',)
