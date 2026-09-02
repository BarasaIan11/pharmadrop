from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from deliveries.models import User, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus, RiderProfile


class PharmaDropAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Users for each role
        self.customer = User.objects.create_user(
            username='cust1', password='password123', role=UserRole.CUSTOMER, phone_number='+254711'
        )
        self.staff = User.objects.create_user(
            username='staff1', password='password123', role=UserRole.PHARMACY_STAFF, phone_number='+254722'
        )
        self.dispatcher = User.objects.create_user(
            username='dispatch1', password='password123', role=UserRole.DISPATCHER, phone_number='+254733'
        )
        self.rider = User.objects.create_user(
            username='rider1', password='password123', role=UserRole.RIDER, phone_number='+254744'
        )
        RiderProfile.objects.create(user=self.rider, is_available=True)

    def test_auth_login_returns_jwt_and_role(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'staff1',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['role'], UserRole.PHARMACY_STAFF)

    def test_pharmacy_staff_creates_delivery(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post('/api/deliveries/', {
            'customer_id': str(self.customer.id),
            'item_description': 'Amoxicillin 500mg',
            'delivery_address': '45 Moi Avenue, Nairobi',
            'pickup_address': 'Central Pharmacy'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], DeliveryStatus.PENDING)
        self.assertIsNotNone(response.data['confirmation_code'])
        self.assertEqual(len(response.data['confirmation_code']), 4)

    def test_dispatcher_assigns_rider(self):
        # Create pending delivery
        delivery = Delivery.objects.create(
            customer=self.customer, created_by=self.staff,
            item_description='Test Meds', delivery_address='Nairobi',
            customer_phone='+254711', confirmation_code='1234'
        )
        self.client.force_authenticate(user=self.dispatcher)
        response = self.client.post(f'/api/deliveries/{delivery.id}/assign/', {
            'rider_id': str(self.rider.id)
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], DeliveryStatus.ASSIGNED)
        self.assertEqual(response.data['assigned_rider'], self.rider.id)

    def test_rider_pin_verification_and_3_attempt_lockout(self):
        delivery = Delivery.objects.create(
            customer=self.customer, created_by=self.staff,
            item_description='Test Meds', delivery_address='Nairobi',
            customer_phone='+254711', confirmation_code='4321',
            assigned_rider=self.rider, status=DeliveryStatus.OUT_FOR_DELIVERY
        )
        self.client.force_authenticate(user=self.rider)

        # Attempt 1: Mismatch
        res1 = self.client.post(f'/api/deliveries/{delivery.id}/confirm-delivery/', {'code': '0000'})
        self.assertEqual(res1.status_code, status.HTTP_400_BAD_REQUEST)
        delivery.refresh_from_db()
        self.assertEqual(delivery.failed_code_attempts, 1)
        self.assertFalse(delivery.is_locked)

        # Attempt 2: Mismatch
        res2 = self.client.post(f'/api/deliveries/{delivery.id}/confirm-delivery/', {'code': '0000'})
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        delivery.refresh_from_db()
        self.assertEqual(delivery.failed_code_attempts, 2)
        self.assertFalse(delivery.is_locked)

        # Attempt 3: Mismatch -> Locks order!
        res3 = self.client.post(f'/api/deliveries/{delivery.id}/confirm-delivery/', {'code': '0000'})
        self.assertEqual(res3.status_code, status.HTTP_400_BAD_REQUEST)
        delivery.refresh_from_db()
        self.assertEqual(delivery.failed_code_attempts, 3)
        self.assertTrue(delivery.is_locked)

        # Attempt 4: Blocked because locked
        res4 = self.client.post(f'/api/deliveries/{delivery.id}/confirm-delivery/', {'code': '4321'})
        self.assertEqual(res4.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("locked", res4.data['error'].lower())

    def test_rider_successful_pin_confirmation(self):
        delivery = Delivery.objects.create(
            customer=self.customer, created_by=self.staff,
            item_description='Test Meds', delivery_address='Nairobi',
            customer_phone='+254711', confirmation_code='9876',
            assigned_rider=self.rider, status=DeliveryStatus.OUT_FOR_DELIVERY
        )
        self.client.force_authenticate(user=self.rider)
        res = self.client.post(f'/api/deliveries/{delivery.id}/confirm-delivery/', {'code': '9876'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        delivery.refresh_from_db()
        self.assertEqual(delivery.status, DeliveryStatus.DELIVERED)

        # Check audit trail event was created
        events = DeliveryStatusEvent.objects.filter(delivery=delivery, status=DeliveryStatus.DELIVERED)
        self.assertEqual(events.count(), 1)
