from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings

from .models import User, Pharmacy, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus
from .permissions import IsPharmacyStaff, IsDispatcher, IsRider, IsCustomer, IsAssignedRider
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, PharmacySerializer,
    RiderProfileSerializer, DeliverySerializer, CreateDeliverySerializer,
    DeliveryStatusEventSerializer
)


def broadcast_realtime_event(delivery_obj, event_name='status_updated'):
    """Pusher real-time status event trigger with safe fallback"""
    if not all([settings.PUSHER_APP_ID, settings.PUSHER_KEY, settings.PUSHER_SECRET]):
        return
    try:
        import pusher
        pusher_client = pusher.Pusher(
            app_id=settings.PUSHER_APP_ID,
            key=settings.PUSHER_KEY,
            secret=settings.PUSHER_SECRET,
            cluster=settings.PUSHER_CLUSTER,
            ssl=settings.PUSHER_SSL,
        )
        data = DeliverySerializer(delivery_obj).data
        pharmacy_id = str(delivery_obj.pharmacy_id) if delivery_obj.pharmacy_id else 'global'
        pusher_client.trigger(f'private-pharmacy-{pharmacy_id}', event_name, data)
    except Exception:
        return


class PharmacyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Pharmacy.objects.all()
    serializer_class = PharmacySerializer
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def pusher_auth_view(request):
    """Authorize a user only for their own pharmacy's private Pusher channel."""
    socket_id = request.data.get('socket_id')
    channel_name = request.data.get('channel_name', '')
    expected_channel = f'private-pharmacy-{request.user.pharmacy_id}'
    if not socket_id or not request.user.pharmacy_id or channel_name != expected_channel:
        return Response({'detail': 'Not authorized for this channel.'}, status=status.HTTP_403_FORBIDDEN)
    if not all([settings.PUSHER_APP_ID, settings.PUSHER_KEY, settings.PUSHER_SECRET]):
        return Response({'detail': 'Realtime delivery updates are not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    import pusher
    client = pusher.Pusher(
        app_id=settings.PUSHER_APP_ID, key=settings.PUSHER_KEY,
        secret=settings.PUSHER_SECRET, cluster=settings.PUSHER_CLUSTER, ssl=settings.PUSHER_SSL,
    )
    return Response(client.authenticate(channel=channel_name, socket_id=socket_id))


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsDispatcher])
def available_riders_view(request):
    user = request.user
    queryset = RiderProfile.objects.filter(user__role=UserRole.RIDER).select_related('user')
    if user.pharmacy:
        queryset = queryset.filter(user__pharmacy=user.pharmacy)
    serializer = RiderProfileSerializer(queryset, many=True)
    return Response(serializer.data)


class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Delivery.objects.none()

        queryset = Delivery.objects.all()
        status_param = self.request.query_params.get('status')

        if status_param and status_param.lower() != 'all':
            queryset = queryset.filter(status__iexact=status_param)

        if user.role == UserRole.CUSTOMER:
            return queryset.filter(customer=user)
        elif user.role in [UserRole.PHARMACY_STAFF, UserRole.DISPATCHER, UserRole.RIDER]:
            return queryset.filter(pharmacy=user.pharmacy) if user.pharmacy else Delivery.objects.none()

        return queryset

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsPharmacyStaff()]
        elif self.action in ['assign', 'cancel']:
            return [permissions.IsAuthenticated(), IsDispatcher()]
        elif self.action in ['update_status', 'confirm_delivery']:
            return [permissions.IsAuthenticated(), IsRider()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = CreateDeliverySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        delivery = serializer.save()
        broadcast_realtime_event(delivery, 'delivery_created')
        return Response(DeliverySerializer(delivery, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDispatcher], url_path='assign')
    def assign(self, request, pk=None):
        delivery = self.get_object()
        rider_id = request.data.get('rider_id')

        if not rider_id:
            return Response({"error": "rider_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rider = User.objects.get(id=rider_id, role=UserRole.RIDER)
        except User.DoesNotExist:
            return Response({"error": "Valid Rider not found"}, status=status.HTTP_404_NOT_FOUND)
        if rider.pharmacy_id != delivery.pharmacy_id:
            return Response({"error": "Rider belongs to another pharmacy"}, status=status.HTTP_400_BAD_REQUEST)

        old_rider = delivery.assigned_rider
        delivery.assigned_rider = rider
        delivery.status = DeliveryStatus.ASSIGNED
        delivery.save()

        # Update rider active task count
        profile, _ = RiderProfile.objects.get_or_create(user=rider)
        profile.active_tasks_count = Delivery.objects.filter(
            assigned_rider=rider,
            status__in=[DeliveryStatus.ASSIGNED, DeliveryStatus.PICKED_UP, DeliveryStatus.OUT_FOR_DELIVERY]
        ).count()
        profile.save()

        note_text = f"Assigned to rider {rider.get_full_name() or rider.username}"
        if old_rider:
            note_text = f"Reassigned from {old_rider.username} to {rider.username}"

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.ASSIGNED,
            changed_by=request.user,
            note=note_text
        )

        broadcast_realtime_event(delivery, 'delivery_assigned')
        return Response(DeliverySerializer(delivery, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsRider], url_path='update-status')
    def update_status(self, request, pk=None):
        delivery = self.get_object()
        new_status = request.data.get('status', '').upper()

        if delivery.assigned_rider != request.user:
            return Response({"error": "You are not the assigned rider for this delivery"}, status=status.HTTP_403_FORBIDDEN)

        allowed_transitions = {
            DeliveryStatus.ASSIGNED: [DeliveryStatus.PICKED_UP],
            DeliveryStatus.PICKED_UP: [DeliveryStatus.OUT_FOR_DELIVERY],
            DeliveryStatus.OUT_FOR_DELIVERY: []
        }

        current_allowed = allowed_transitions.get(delivery.status, [])
        if new_status not in current_allowed:
            return Response(
                {"error": f"Invalid status transition from {delivery.status} to {new_status}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery.status = new_status
        delivery.save()

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=new_status,
            changed_by=request.user,
            note=f"Status updated to {new_status} by rider"
        )

        broadcast_realtime_event(delivery, 'status_updated')
        return Response(DeliverySerializer(delivery, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsRider], url_path='confirm-delivery')
    def confirm_delivery(self, request, pk=None):
        delivery = self.get_object()
        code = str(request.data.get('code', '')).strip()

        if delivery.assigned_rider != request.user:
            return Response({"error": "You are not the assigned rider for this delivery"}, status=status.HTTP_403_FORBIDDEN)

        if delivery.is_locked:
            return Response(
                {"error": "Order is locked due to 3 failed code attempts. Dispatcher review required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if delivery.status == DeliveryStatus.DELIVERED:
            return Response({"message": "Order is already delivered"}, status=status.HTTP_200_OK)

        if code != delivery.confirmation_code:
            delivery.failed_code_attempts += 1
            if delivery.failed_code_attempts >= 3:
                delivery.is_locked = True
                note = f"Failed delivery code attempt ({delivery.failed_code_attempts}/3). Order LOCKED for dispatcher review."
            else:
                note = f"Incorrect confirmation code attempt ({delivery.failed_code_attempts}/3)"
            
            delivery.save()

            DeliveryStatusEvent.objects.create(
                delivery=delivery,
                status=delivery.status,
                changed_by=request.user,
                note=note
            )

            broadcast_realtime_event(delivery, 'code_failed')

            return Response(
                {
                    "error": "Invalid confirmation code.",
                    "failed_attempts": delivery.failed_code_attempts,
                    "is_locked": delivery.is_locked
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Code matched! Decrypted Fernet code verified successfully!
        delivery.status = DeliveryStatus.DELIVERED
        delivery.save()

        profile, _ = RiderProfile.objects.get_or_create(user=request.user)
        profile.active_tasks_count = max(0, profile.active_tasks_count - 1)
        profile.save()

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.DELIVERED,
            changed_by=request.user,
            note="Delivery confirmed with 4-digit verification code handoff"
        )

        broadcast_realtime_event(delivery, 'delivery_completed')
        return Response(DeliverySerializer(delivery, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsDispatcher], url_path='cancel')
    def cancel(self, request, pk=None):
        delivery = self.get_object()
        reason = request.data.get('reason', 'Cancelled by dispatcher')

        if delivery.status == DeliveryStatus.DELIVERED:
            return Response({"error": "Cannot cancel a delivered order"}, status=status.HTTP_400_BAD_REQUEST)

        delivery.status = DeliveryStatus.CANCELLED
        delivery.save()

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.CANCELLED,
            changed_by=request.user,
            note=f"Order cancelled: {reason}"
        )

        broadcast_realtime_event(delivery, 'delivery_cancelled')
        return Response(DeliverySerializer(delivery, context={'request': request}).data)
