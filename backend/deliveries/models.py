import random
import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class UserRole(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    PHARMACY_STAFF = 'PHARMACY_STAFF', 'Pharmacy Staff'
    DISPATCHER = 'DISPATCHER', 'Dispatcher'
    RIDER = 'RIDER', 'Rider'


class DeliveryStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Out for Delivery'
    DELIVERED = 'DELIVERED', 'Delivered'
    CANCELLED = 'CANCELLED', 'Cancelled'


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class RiderProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='rider_profile',
        limit_choices_to={'role': UserRole.RIDER}
    )
    is_available = models.BooleanField(default=True)
    vehicle_type = models.CharField(max_length=50, default='Bike')
    distance_km = models.FloatField(default=1.2)
    active_tasks_count = models.IntegerField(default=0)
    rating = models.FloatField(default=4.9)

    def __str__(self):
        return f"Rider Profile: {self.user.get_full_name() or self.user.username}"


class Delivery(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='customer_deliveries',
        limit_choices_to={'role': UserRole.CUSTOMER}
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_deliveries',
        limit_choices_to={'role': UserRole.PHARMACY_STAFF}
    )
    item_description = models.TextField()
    delivery_address = models.TextField()
    pickup_address = models.TextField(default='Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands')
    customer_phone = models.CharField(max_length=20)
    priority = models.CharField(max_length=50, default='Standard (4 Hours)')
    payment_collection = models.CharField(max_length=50, default='Pre-paid')
    is_cold_chain = models.BooleanField(default=False)
    customer_note = models.TextField(blank=True, null=True)
    
    status = models.CharField(
        max_length=30,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING
    )
    confirmation_code = models.CharField(max_length=4)
    assigned_rider = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_deliveries',
        limit_choices_to={'role': UserRole.RIDER}
    )
    failed_code_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.order_number:
            random_digits = random.randint(1000, 9999)
            self.order_number = f"#PD-{random_digits}"
        if not self.confirmation_code:
            self.confirmation_code = f"{random.randint(1000, 9999)}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} - {self.status}"


class DeliveryStatusEvent(models.Model):
    delivery = models.ForeignKey(
        Delivery,
        on_delete=models.CASCADE,
        related_name='status_events'
    )
    status = models.CharField(max_length=30, choices=DeliveryStatus.choices)
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.delivery.order_number} -> {self.status} by {self.changed_by.username}"
