import prisma from '../src/config/prisma';

async function main() {
  console.log('Cleaning up existing packages...');
  
  try {
    // Delete bookings first due to foreign key constraints if they exist
    const bookingCount = await prisma.mandapamBooking.count();
    if (bookingCount > 0) {
      console.log(`Found ${bookingCount} bookings. Deleting them to allow package reset...`);
      await prisma.mandapamBooking.deleteMany();
    }
    
    await prisma.mandapamPackage.deleteMany();
    console.log('Existing packages removed.');

    console.log('Seeding new packages...');

    const packages = [
      {
        nameEn: 'Standard',
        nameTa: 'ஸ்டாண்டர்ட் (Standard)',
        price: 50000,
        featuresEn: [
          'Essential Elegance',
          'Hall Usage (6 Hours)',
          'Seating up to 500',
          'Dining Hall Access',
          'Basic Power Backup'
        ],
        featuresTa: [
          'அத்தியாவசிய நேர்த்தி (Essential Elegance)',
          'மண்டப உபயோகம் (6 மணிநேரம்)',
          '500 பேர் வரை அமரும் வசதி',
          'உணவருந்தும் அறை வசதி',
          'அடிப்படை மின்சார காப்பு'
        ],
        isActive: true
      },
      {
        nameEn: 'Royal',
        nameTa: 'ராயல் (Royal)',
        price: 75000,
        featuresEn: [
          '⭐ Most Popular',
          'Premium Celebrations',
          'Full Day Hall Usage',
          'Seating up to 1200',
          'Premium Dining Setup',
          '4 Complimentary AC Rooms'
        ],
        featuresTa: [
          '⭐ மிகவும் பிரபலமானது',
          'பிரீமியம் கொண்டாட்டங்கள் (Premium Celebrations)',
          'முழு நாள் மண்டப உபயோகம்',
          '1200 பேர் வரை அமரும் வசதி',
          'பிரீமியம் உணவருந்தும் அமைப்பு',
          '4 இலவச ஏசி அறைகள்'
        ],
        isActive: true
      },
      {
        nameEn: 'Grand',
        nameTa: 'கிராண்ட் (Grand)',
        price: 100000,
        featuresEn: [
          'Ultimate Luxury',
          'Multi-Day Booking Priority',
          'Seating up to 2000+',
          'Valet Parking Included'
        ],
        featuresTa: [
          'சிறந்த ஆடம்பரம் (Ultimate Luxury)',
          'பல நாட்கள் முன்பதிவு முன்னுரிமை',
          '2000+ பேர் வரை அமரும் வசதி',
          'வேலட் பார்க்கிங் வசதி உண்டு'
        ],
        isActive: true
      }
    ];

    for (const pkg of packages) {
      await prisma.mandapamPackage.create({
        data: pkg
      });
    }

    console.log('New packages seeded successfully!');
  } catch (error) {
    console.error('Error seeding packages:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
