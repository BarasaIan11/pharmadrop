import base64
import hashlib
import secrets
import uuid
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from cryptography.fernet import Fernet


# Symmetric Encryption Helper derived from Django SECRET_KEY
def get_fernet_cipher():
    key_bytes = hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest()
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


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


class Pharmacy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True) # e.g. MED-NRB-01
    address = models.TextField()
    phone = models.CharField(max_length=20)
    logo_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Pharmacies'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CUSTOMER
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )

    def __str__(self):
        pharmacy_str = f" @ {self.pharmacy.name}" if self.pharmacy else ""
        return f"{self.username} ({self.get_role_display()}){pharmacy_str}"


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
    pharmacy = models.ForeignKey(
        Pharmacy,
        on_delete=models.CASCADE,
        related_name='deliveries',
        null=True,
        blank=True
    )
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
    
    # Store AES Encrypted Code at rest in Database
    encrypted_code = models.CharField(max_length=255, blank=True, default='')

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

    @property
    def confirmation_code(self):
        if not self.encrypted_code:
            return ""
        try:
            cipher = get_fernet_cipher()
            decrypted = cipher.decrypt(self.encrypted_code.encode('utf-8')).decode('utf-8')
            return decrypted
        except Exception:
            return ""

    @confirmation_code.setter
    def confirmation_code(self, raw_code):
        if raw_code:
            cipher = get_fernet_cipher()
            encrypted_bytes = cipher.encrypt(str(raw_code).encode('utf-8'))
            self.encrypted_code = encrypted_bytes.decode('utf-8')

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"PD-{uuid.uuid4().hex[:12].upper()}"
        if not self.encrypted_code:
            raw_code = f"{secrets.randbelow(9000) + 1000}"
            self.confirmation_code = raw_code
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
