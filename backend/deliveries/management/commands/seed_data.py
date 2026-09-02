from django.core.management.base import BaseCommand
from deliveries.models import User, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus


class Command(BaseCommand):
    help = 'Seeds initial users and realistic delivery data for PharmaDrop MVP demo'

    def handle(self, *args, **options):
        self.stdout.write('Seeding PharmaDrop database...')

        # 1. Clear existing data
        DeliveryStatusEvent.objects.all().delete()
        Delivery.objects.all().delete()
        RiderProfile.objects.all().delete()
        User.objects.all().delete()

        # 2. Create Users
        # Customers
        c1 = User.objects.create_user(
            username='customer1', email='esther@example.com', password='password123',
            first_name='Esther', last_name='Wanjiku', role=UserRole.CUSTOMER, phone_number='+254712345678'
        )
        c2 = User.objects.create_user(
            username='customer2', email='david.o@example.com', password='password123',
            first_name='David', last_name='Ochieng', role=UserRole.CUSTOMER, phone_number='+254723456789'
        )
        c3 = User.objects.create_user(
            username='customer3', email='sarah.m@example.com', password='password123',
            first_name='Sarah', last_name='Mutuku', role=UserRole.CUSTOMER, phone_number='+254734567890'
        )

        # Pharmacy Staff
        staff = User.objects.create_user(
            username='staff1', email='staff@pharmadrop.co.ke', password='password123',
            first_name='Dispatcher', last_name='Hub', role=UserRole.PHARMACY_STAFF, phone_number='+254700000001'
        )

        # Dispatcher
        dispatcher = User.objects.create_user(
            username='dispatcher1', email='dispatcher@pharmadrop.co.ke', password='password123',
            first_name='Nairobi', last_name='Central Dispatch', role=UserRole.DISPATCHER, phone_number='+254700000002'
        )

        # Riders
        r1 = User.objects.create_user(
            username='rider1', email='david.k@pharmadrop.co.ke', password='password123',
            first_name='David', last_name='Kamau', role=UserRole.RIDER, phone_number='+254799111222'
        )
        RiderProfile.objects.create(user=r1, is_available=True, vehicle_type='Bike', distance_km=0.5, active_tasks_count=2, rating=4.9)

        r2 = User.objects.create_user(
            username='rider2', email='john.n@pharmadrop.co.ke', password='password123',
            first_name='John', last_name='N.', role=UserRole.RIDER, phone_number='+254799222333'
        )
        RiderProfile.objects.create(user=r2, is_available=True, vehicle_type='Bike', distance_km=1.2, active_tasks_count=0, rating=4.8)

        r3 = User.objects.create_user(
            username='rider3', email='esther.k@pharmadrop.co.ke', password='password123',
            first_name='Esther', last_name='K.', role=UserRole.RIDER, phone_number='+254799333444'
        )
        RiderProfile.objects.create(user=r3, is_available=True, vehicle_type='Motorcycle', distance_km=3.5, active_tasks_count=3, rating=4.7)

        r4 = User.objects.create_user(
            username='rider4', email='peter.o@pharmadrop.co.ke', password='password123',
            first_name='Peter', last_name='O.', role=UserRole.RIDER, phone_number='+254799444555'
        )
        RiderProfile.objects.create(user=r4, is_available=True, vehicle_type='Bike', distance_km=0.8, active_tasks_count=1, rating=4.9)

        self.stdout.write('Created demo users: customer1, staff1, dispatcher1, rider1 (password: password123)')

        # 3. Create Sample Deliveries
        # Delivery 1: Order #PD-8892 (Assigned to David Kamau, PIN 5821)
        d1 = Delivery.objects.create(
            order_number='#PD-8892',
            customer=c1,
            created_by=staff,
            item_description='Amoxicillin 500mg, Paracetamol',
            delivery_address='Westlands CBD, Block B Waiyaki Way, Nairobi',
            pickup_address='Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
            customer_phone='+254712345678',
            priority='Standard (4 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.ASSIGNED,
            confirmation_code='5821',
            assigned_rider=r1
        )
        DeliveryStatusEvent.objects.create(delivery=d1, status=DeliveryStatus.PENDING, changed_by=staff, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d1, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher, note='Assigned to David Kamau')

        # Delivery 2: Order #PD-4928 (Rider active task 1)
        d2 = Delivery.objects.create(
            order_number='#PD-4928',
            customer=c1,
            created_by=staff,
            item_description='Antibiotics & Vitamin C Refill',
            delivery_address='Kileleshwa, Mandera Rd, Apt 4B, Othaya Court',
            pickup_address='Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
            customer_phone='+254712345678',
            priority='Express (2 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.ASSIGNED,
            confirmation_code='4928',
            assigned_rider=r1
        )
        DeliveryStatusEvent.objects.create(delivery=d2, status=DeliveryStatus.PENDING, changed_by=staff, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d2, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher, note='Assigned to rider David Kamau')

        # Delivery 3: Order #PD-8112 (Rider active task 2 - Out for Delivery)
        d3 = Delivery.objects.create(
            order_number='#PD-8112',
            customer=c2,
            created_by=staff,
            item_description='Lisinopril 10mg, Atorvastatin',
            delivery_address='Westlands, Mpaka Rd, The Alchemist (Main Entrance)',
            pickup_address='Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
            customer_phone='+254723456789',
            customer_note='Customer note: "Please call when you reach the gate, do not ring the bell."',
            priority='Standard (4 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.OUT_FOR_DELIVERY,
            confirmation_code='8112',
            assigned_rider=r1
        )
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.PENDING, changed_by=staff, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher, note='Assigned to David Kamau')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.PICKED_UP, changed_by=r1, note='Picked up from hospital pharmacy')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.OUT_FOR_DELIVERY, changed_by=r1, note='En route to delivery destination')

        # Delivery 4: Order #PD-8492 (Unassigned Queue, Cold Chain)
        d4 = Delivery.objects.create(
            order_number='#PD-8492',
            customer=c3,
            created_by=staff,
            item_description='Insulin Glargine, Metformin HCL',
            delivery_address='Kilimani Ring Road, Apt 4B',
            customer_phone='+254734567890',
            is_cold_chain=True,
            status=DeliveryStatus.PENDING,
            confirmation_code='8492'
        )
        DeliveryStatusEvent.objects.create(delivery=d4, status=DeliveryStatus.PENDING, changed_by=staff, note='Created - Cold Chain required')

        # Delivery 5: Order #PD-7103 (Unassigned Queue)
        d5 = Delivery.objects.create(
            order_number='#PD-7103',
            customer=c2,
            created_by=staff,
            item_description='Amoxicillin 500mg, Ibuprofen',
            delivery_address='Westlands, Waiyaki Way',
            customer_phone='+254723456789',
            status=DeliveryStatus.PENDING,
            confirmation_code='7103'
        )
        DeliveryStatusEvent.objects.create(delivery=d5, status=DeliveryStatus.PENDING, changed_by=staff, note='Created - awaiting dispatch')

        # Delivery 6: Order #PD-8832 (Delivered)
        d6 = Delivery.objects.create(
            order_number='#PD-8832',
            customer=c1,
            created_by=staff,
            item_description='Amoxicillin 500mg, Paracetamol (2 Items)',
            delivery_address='Kileleshwa, Nairobi',
            customer_phone='+254712345678',
            status=DeliveryStatus.DELIVERED,
            confirmation_code='8832',
            assigned_rider=r4
        )
        DeliveryStatusEvent.objects.create(delivery=d6, status=DeliveryStatus.PENDING, changed_by=staff, note='Created')
        DeliveryStatusEvent.objects.create(delivery=d6, status=DeliveryStatus.DELIVERED, changed_by=r4, note='Delivery confirmed with 4-digit code')

        # Delivery 7: Order #PD-8820 (Cancelled)
        d7 = Delivery.objects.create(
            order_number='#PD-8820',
            customer=c2,
            created_by=staff,
            item_description='Ibuprofen 400mg',
            delivery_address='Upper Hill, Nairobi',
            customer_phone='+254723456789',
            status=DeliveryStatus.CANCELLED,
            confirmation_code='8820'
        )
        DeliveryStatusEvent.objects.create(delivery=d7, status=DeliveryStatus.CANCELLED, changed_by=dispatcher, note='Cancelled by dispatcher: Patient requested change of items')

        self.stdout.write(self.style.SUCCESS('Successfully seeded demo database for PharmaDrop!'))
