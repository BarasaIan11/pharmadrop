from django.core.management.base import BaseCommand
from deliveries.models import User, Pharmacy, RiderProfile, Delivery, DeliveryStatusEvent, UserRole, DeliveryStatus


class Command(BaseCommand):
    help = 'Seeds multi-tenant pharmacy data and deliveries for PharmaDrop'

    def handle(self, *args, **options):
        self.stdout.write('Seeding multi-tenant PharmaDrop database...')

        # 1. Clear existing data
        DeliveryStatusEvent.objects.all().delete()
        Delivery.objects.all().delete()
        RiderProfile.objects.all().delete()
        User.objects.all().delete()
        Pharmacy.objects.all().delete()

        # 2. Create Pharmacies
        p1 = Pharmacy.objects.create(
            name='Nairobi Central Pharmacy',
            code='MED-NRB-01',
            address='Aga Khan Univ Hospital, Pharmacy Dept, 3rd Ave Parklands',
            phone='+254700111222',
            logo_url='https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=120&q=80'
        )

        p2 = Pharmacy.objects.create(
            name='Westlands Express Pharmacy',
            code='MED-WST-02',
            address='Waiyaki Way, Westlands, Nairobi',
            phone='+254700333444',
            logo_url='https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=120&q=80'
        )

        self.stdout.write(f'Created Pharmacies: {p1.name}, {p2.name}')

        # 3. Create Users
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

        # Pharmacy Staff (p1)
        staff1 = User.objects.create_user(
            username='staff1', email='staff@pharmadrop.co.ke', password='password123',
            first_name='Dispatcher', last_name='Hub', role=UserRole.PHARMACY_STAFF, phone_number='+254700000001',
            pharmacy=p1
        )

        # Dispatcher (p1)
        dispatcher1 = User.objects.create_user(
            username='dispatcher1', email='dispatcher@pharmadrop.co.ke', password='password123',
            first_name='Nairobi', last_name='Central Dispatch', role=UserRole.DISPATCHER, phone_number='+254700000002',
            pharmacy=p1
        )

        # Riders (p1)
        r1 = User.objects.create_user(
            username='rider1', email='david.k@pharmadrop.co.ke', password='password123',
            first_name='David', last_name='Kamau', role=UserRole.RIDER, phone_number='+254799111222',
            pharmacy=p1
        )
        RiderProfile.objects.create(user=r1, is_available=True, vehicle_type='Bike', distance_km=0.5, active_tasks_count=2, rating=4.9)

        r2 = User.objects.create_user(
            username='rider2', email='john.n@pharmadrop.co.ke', password='password123',
            first_name='John', last_name='N.', role=UserRole.RIDER, phone_number='+254799222333',
            pharmacy=p1
        )
        RiderProfile.objects.create(user=r2, is_available=True, vehicle_type='Bike', distance_km=1.2, active_tasks_count=0, rating=4.8)

        r3 = User.objects.create_user(
            username='rider3', email='esther.k@pharmadrop.co.ke', password='password123',
            first_name='Esther', last_name='K.', role=UserRole.RIDER, phone_number='+254799333444',
            pharmacy=p1
        )
        RiderProfile.objects.create(user=r3, is_available=True, vehicle_type='Motorcycle', distance_km=3.5, active_tasks_count=3, rating=4.7)

        r4 = User.objects.create_user(
            username='rider4', email='peter.o@pharmadrop.co.ke', password='password123',
            first_name='Peter', last_name='O.', role=UserRole.RIDER, phone_number='+254799444555',
            pharmacy=p1
        )
        RiderProfile.objects.create(user=r4, is_available=True, vehicle_type='Bike', distance_km=0.8, active_tasks_count=1, rating=4.9)

        # 4. Create Deliveries for Pharmacy 1
        d1 = Delivery(
            order_number='#PD-8892',
            pharmacy=p1,
            customer=c1,
            created_by=staff1,
            item_description='Amoxicillin 500mg, Paracetamol',
            delivery_address='Westlands CBD, Block B Waiyaki Way, Nairobi',
            pickup_address=p1.address,
            customer_phone='+254712345678',
            priority='Standard (4 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.ASSIGNED,
            assigned_rider=r1
        )
        d1.confirmation_code = '5821'
        d1.save()
        DeliveryStatusEvent.objects.create(delivery=d1, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d1, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher1, note='Assigned to David Kamau')

        d2 = Delivery(
            order_number='#PD-4928',
            pharmacy=p1,
            customer=c1,
            created_by=staff1,
            item_description='Antibiotics & Vitamin C Refill',
            delivery_address='Kileleshwa, Mandera Rd, Apt 4B, Othaya Court',
            pickup_address=p1.address,
            customer_phone='+254712345678',
            priority='Express (2 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.ASSIGNED,
            assigned_rider=r1
        )
        d2.confirmation_code = '4928'
        d2.save()
        DeliveryStatusEvent.objects.create(delivery=d2, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d2, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher1, note='Assigned to rider David Kamau')

        d3 = Delivery(
            order_number='#PD-8112',
            pharmacy=p1,
            customer=c2,
            created_by=staff1,
            item_description='Lisinopril 10mg, Atorvastatin',
            delivery_address='Westlands, Mpaka Rd, The Alchemist (Main Entrance)',
            pickup_address=p1.address,
            customer_phone='+254723456789',
            customer_note='Customer note: "Please call when you reach the gate, do not ring the bell."',
            priority='Standard (4 Hours)',
            payment_collection='Pre-paid',
            status=DeliveryStatus.OUT_FOR_DELIVERY,
            assigned_rider=r1
        )
        d3.confirmation_code = '8112'
        d3.save()
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created by staff')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.ASSIGNED, changed_by=dispatcher1, note='Assigned to David Kamau')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.PICKED_UP, changed_by=r1, note='Picked up from hospital pharmacy')
        DeliveryStatusEvent.objects.create(delivery=d3, status=DeliveryStatus.OUT_FOR_DELIVERY, changed_by=r1, note='En route to delivery destination')

        d4 = Delivery(
            order_number='#PD-8492',
            pharmacy=p1,
            customer=c3,
            created_by=staff1,
            item_description='Insulin Glargine, Metformin HCL',
            delivery_address='Kilimani Ring Road, Apt 4B',
            customer_phone='+254734567890',
            is_cold_chain=True,
            status=DeliveryStatus.PENDING
        )
        d4.confirmation_code = '8492'
        d4.save()
        DeliveryStatusEvent.objects.create(delivery=d4, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created - Cold Chain required')

        d5 = Delivery(
            order_number='#PD-7103',
            pharmacy=p1,
            customer=c2,
            created_by=staff1,
            item_description='Amoxicillin 500mg, Ibuprofen',
            delivery_address='Westlands, Waiyaki Way',
            customer_phone='+254723456789',
            status=DeliveryStatus.PENDING
        )
        d5.confirmation_code = '7103'
        d5.save()
        DeliveryStatusEvent.objects.create(delivery=d5, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created - awaiting dispatch')

        d6 = Delivery(
            order_number='#PD-8832',
            pharmacy=p1,
            customer=c1,
            created_by=staff1,
            item_description='Amoxicillin 500mg, Paracetamol (2 Items)',
            delivery_address='Kileleshwa, Nairobi',
            customer_phone='+254712345678',
            status=DeliveryStatus.DELIVERED,
            assigned_rider=r4
        )
        d6.confirmation_code = '8832'
        d6.save()
        DeliveryStatusEvent.objects.create(delivery=d6, status=DeliveryStatus.PENDING, changed_by=staff1, note='Created')
        DeliveryStatusEvent.objects.create(delivery=d6, status=DeliveryStatus.DELIVERED, changed_by=r4, note='Delivery confirmed with 4-digit code')

        self.stdout.write(self.style.SUCCESS('Successfully seeded multi-tenant database with Fernet encrypted PIN codes!'))
