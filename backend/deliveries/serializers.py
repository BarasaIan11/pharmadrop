from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'role', 'phone_number')
        read_only_fields = ('id',)

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', UserRole.CUSTOMER),
            phone_number=validated_data.get('phone_number', '')
        )
        if user.role == UserRole.RIDER:
            RiderProfile.objects.get_or_create(user=user)
        return user


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
    status_events = DeliveryStatusEventSerializer(many=True, read_only=True)

    class Meta:
        model = Delivery
        fields = (
            'id', 'order_number', 'customer', 'customer_name', 'customer_phone',
            'created_by', 'created_by_name', 'item_description', 'delivery_address',
            'pickup_address', 'priority', 'payment_collection', 'is_cold_chain',
            'customer_note', 'status', 'confirmation_code', 'assigned_rider',
            'assigned_rider_detail', 'failed_code_attempts', 'is_locked',
            'created_at', 'updated_at', 'status_events'
        )
        read_only_fields = (
            'id', 'order_number', 'created_by', 'confirmation_code',
            'failed_code_attempts', 'is_locked', 'created_at', 'updated_at'
        )

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.username

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username


class CreateDeliverySerializer(serializers.ModelSerializer):
    customer_id = serializers.CharField(required=False, write_only=True, allow_null=True, allow_blank=True)
    new_customer_name = serializers.CharField(required=False, write_only=True, allow_blank=True)
    new_customer_phone = serializers.CharField(required=False, write_only=True, allow_blank=True)

    class Meta:
        model = Delivery
        fields = (
            'customer_id', 'new_customer_name', 'new_customer_phone',
            'item_description', 'delivery_address', 'pickup_address',
            'priority', 'payment_collection', 'is_cold_chain', 'customer_note'
        )

    def create(self, validated_data):
        customer_id = validated_data.pop('customer_id', None)
        new_customer_name = validated_data.pop('new_customer_name', '')
        new_customer_phone = validated_data.pop('new_customer_phone', '')
        user = self.context['request'].user

        if customer_id:
            customer = User.objects.get(id=customer_id, role=UserRole.CUSTOMER)
        elif new_customer_name:
            username = f"customer_{random.randint(1000, 9999)}"
            customer = User.objects.create_user(
                username=username,
                first_name=new_customer_name,
                role=UserRole.CUSTOMER,
                phone_number=new_customer_phone
            )
        else:
            raise serializers.ValidationError({"customer": "Must provide existing customer_id or new customer details."})

        delivery = Delivery.objects.create(
            customer=customer,
            created_by=user,
            customer_phone=new_customer_phone or customer.phone_number or '',
            **validated_data
        )

        # Log creation event
        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.PENDING,
            changed_by=user,
            note="Delivery request created by pharmacy staff"
        )
        return delivery
