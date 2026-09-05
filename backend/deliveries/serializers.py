import secrets
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Pharmacy, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus


class PharmacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ('id', 'name', 'code', 'address', 'phone', 'logo_url', 'created_at')


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    pharmacy_detail = PharmacySerializer(source='pharmacy', read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'phone_number', 'pharmacy', 'pharmacy_detail')
        read_only_fields = ('id',)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone_number', 'pharmacy')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', UserRole.CUSTOMER),
            phone_number=validated_data.get('phone_number', ''),
            pharmacy=validated_data.get('pharmacy', None)
        )
        if user.role == UserRole.RIDER:
            RiderProfile.objects.get_or_create(user=user)
        return user

    def validate_role(self, value):
        if value != UserRole.CUSTOMER:
            raise serializers.ValidationError("Public registration is limited to customer accounts.")
        return value

    def validate_pharmacy(self, value):
        if value is not None:
            raise serializers.ValidationError("Customers cannot select a pharmacy during registration.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data


class RiderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = RiderProfile
        fields = ('id', 'user', 'is_available', 'vehicle_type', 'distance_km', 'active_tasks_count', 'rating')


class DeliveryStatusEventSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryStatusEvent
        fields = ('id', 'status', 'changed_by', 'changed_by_name', 'note', 'timestamp')

    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() or obj.changed_by.username


class DeliverySerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    assigned_rider_detail = UserSerializer(source='assigned_rider', read_only=True)
    pharmacy_detail = PharmacySerializer(source='pharmacy', read_only=True)
    status_events = DeliveryStatusEventSerializer(many=True, read_only=True)
    confirmation_code = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = (
            'id', 'order_number', 'pharmacy', 'pharmacy_detail', 'customer', 'customer_name', 'customer_phone',
            'created_by', 'created_by_name', 'item_description', 'delivery_address',
            'pickup_address', 'priority', 'payment_collection', 'is_cold_chain',
            'customer_note', 'status', 'confirmation_code', 'assigned_rider',
            'assigned_rider_detail', 'failed_code_attempts', 'is_locked',
            'created_at', 'updated_at', 'status_events'
        )
        read_only_fields = (
            'id', 'order_number', 'created_by',
            'failed_code_attempts', 'is_locked', 'created_at', 'updated_at'
        )

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_confirmation_code(self, obj):
        request = self.context.get('request')
        # Customers can view their own code; staff can share it with the customer.
        if request and request.user.is_authenticated:
            if request.user == obj.customer or request.user.role == UserRole.PHARMACY_STAFF:
                return obj.confirmation_code
        return "****"


class CreateDeliverySerializer(serializers.ModelSerializer):
    customer_id = serializers.CharField(required=False, write_only=True, allow_null=True, allow_blank=True)
    new_customer_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    new_customer_phone = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Delivery
        fields = (
            'customer_id', 'new_customer_name', 'new_customer_phone', 'pharmacy',
            'item_description', 'delivery_address', 'pickup_address',
            'priority', 'payment_collection', 'is_cold_chain', 'customer_note'
        )

    def create(self, validated_data):
        customer_id = validated_data.pop('customer_id', None)
        new_customer_name = validated_data.pop('new_customer_name', '')
        new_customer_phone = validated_data.pop('new_customer_phone', '')
        pharmacy_param = validated_data.pop('pharmacy', None)
        user = self.context['request'].user

        pharmacy = user.pharmacy
        if not pharmacy:
            raise serializers.ValidationError({"pharmacy": "Your account is not assigned to a pharmacy."})
        if pharmacy_param and pharmacy_param != pharmacy:
            raise serializers.ValidationError({"pharmacy": "You cannot create deliveries for another pharmacy."})

        if customer_id:
            try:
                customer = User.objects.get(id=customer_id, role=UserRole.CUSTOMER)
            except User.DoesNotExist:
                customer = User.objects.create_user(
                    username=f"customer_{secrets.token_hex(6)}",
                    first_name=new_customer_name or 'Customer',
                    role=UserRole.CUSTOMER,
                    phone_number=new_customer_phone
                )
        elif new_customer_name:
            username = f"customer_{secrets.token_hex(6)}"
            customer = User.objects.create_user(
                username=username,
                first_name=new_customer_name,
                role=UserRole.CUSTOMER,
                phone_number=new_customer_phone
            )
        else:
            customer = User.objects.filter(role=UserRole.CUSTOMER).first()
        if not customer:
            raise serializers.ValidationError({"customer": "Provide an existing customer or new customer details."})

        delivery = Delivery.objects.create(
            customer=customer,
            created_by=user,
            pharmacy=pharmacy,
            customer_phone=new_customer_phone or customer.phone_number or '',
            **validated_data
        )

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.PENDING,
            changed_by=user,
            note=f"Delivery request created at {pharmacy.name if pharmacy else 'Pharmacy'}"
        )
        return delivery
