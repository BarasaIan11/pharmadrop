from rest_framework import generics, viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus
from .permissions import IsPharmacyStaff, IsDispatcher, IsRider, IsCustomer, IsAssignedRider
from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    RiderProfileSerializer, DeliverySerializer, CreateDeliverySerializer,
    DeliveryStatusEventSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsDispatcher])
def available_riders_view(request):
    riders = RiderProfile.objects.filter(user__role=UserRole.RIDER).select_related('user')
    serializer = RiderProfileSerializer(riders, many=True)
    return Response(serializer.data)


class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer

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
        elif user.role == UserRole.PHARMACY_STAFF:
            return queryset.filter(created_by=user)
        elif user.role == UserRole.RIDER:
            return queryset.filter(assigned_rider=user)
        elif user.role == UserRole.DISPATCHER:
            return queryset
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
        return Response(DeliverySerializer(delivery).data, status=status.HTTP_201_CREATED)

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
        return Response(DeliverySerializer(delivery).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsRider], url_path='update-status')
    def update_status(self, request, pk=None):
        delivery = self.get_object()
        new_status = request.data.get('status', '').upper()

        if delivery.assigned_rider != request.user:
            return Response({"error": "You are not the assigned rider for this delivery"}, status=status.HTTP_403_FORBIDDEN)

        allowed_transitions = {
            DeliveryStatus.ASSIGNED: [DeliveryStatus.PICKED_UP],
            DeliveryStatus.PICKED_UP: [DeliveryStatus.OUT_FOR_DELIVERY],
            DeliveryStatus.OUT_FOR_DELIVERY: []  # Must use confirm-delivery
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
        return Response(DeliverySerializer(delivery).data)

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

            return Response(
                {
                    "error": "Invalid confirmation code.",
                    "failed_attempts": delivery.failed_code_attempts,
                    "is_locked": delivery.is_locked
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Code matched!
        delivery.status = DeliveryStatus.DELIVERED
        delivery.save()

        # Update rider profile task count
        profile, _ = RiderProfile.objects.get_or_create(user=request.user)
        profile.active_tasks_count = max(0, profile.active_tasks_count - 1)
        profile.save()

        DeliveryStatusEvent.objects.create(
            delivery=delivery,
            status=DeliveryStatus.DELIVERED,
            changed_by=request.user,
            note="Delivery confirmed with 4-digit verification code handoff"
        )
        return Response(DeliverySerializer(delivery).data)

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
        return Response(DeliverySerializer(delivery).data)
