const mongoose = require('mongoose');
const Member = require('../models/Member');
const XLSX = require('xlsx');
const dns = require('dns');
require('dotenv').config();

// Override DNS resolver to use Google's public DNS (8.8.8.8)
// This fixes querySrv ECONNREFUSED errors caused by local DNS blocking SRV lookups
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Helper to convert Excel serial date to JavaScript Date
function excelDateToJSDate(excelDate) {
  if (!excelDate) return null;
  const num = Number(excelDate);
  if (isNaN(num)) {
    // If it's a string, try direct parsing
    const parsed = new Date(excelDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  // Excel leap year bug: Excel thinks 1900 was a leap year, so it is off by 1 day after 1900-02-28.
  const date = new Date((num - (num > 60 ? 25569 : 25568)) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}

// Helper to format Sri Lankan mobile number
function formatPhoneNumber(phone) {
  if (!phone) return '';
  let str = String(phone).replace(/[^0-9]/g, '').trim();
  if (str.length === 9 && str.startsWith('7')) {
    str = '0' + str;
  }
  return str;
}

// Heuristic to assign Zone based on District or City/Area in Sri Lanka
function inferZone(district, city) {
  const d = (district || '').trim().toLowerCase();
  const c = (city || '').trim().toLowerCase();
  
  if (d.includes('colombo') || d.includes('gampaha') || d.includes('kalutara') ||
      c.includes('colombo') || c.includes('moratuwa') || c.includes('malabe') ||
      c.includes('wattala') || c.includes('kelaniya') || c.includes('hanwella') ||
      c.includes('kaduwela') || c.includes('nugegoda') || c.includes('piliyandala') ||
      c.includes('pannipitiya') || c.includes('maharagama') || c.includes('ragama') ||
      c.includes('athurugiriya') || c.includes('mulleriyawa')) {
    return 'Zone 01';
  }
  
  if (d.includes('galle') || d.includes('matara') || d.includes('hambantota') ||
      c.includes('galle') || c.includes('matara') || c.includes('hambantota') ||
      c.includes('galle') || c.includes('kaburupitiya') || c.includes('ambalangoda') ||
      c.includes('dehiwela')) {
    return 'Zone 02';
  }
  
  if (d.includes('kandy') || d.includes('matale') || d.includes('nuwara eliya') ||
      d.includes('kurunegala') || d.includes('ratnapura') || d.includes('kegalle') ||
      d.includes('badulla') || d.includes('monaragala') ||
      c.includes('kandy') || c.includes('kurunegala') || c.includes('ratnapura') ||
      c.includes('welimada') || c.includes('monaragala') || c.includes('bandarawela') ||
      c.includes('balangoda') || c.includes('naula') || c.includes('dankotuwa') ||
      c.includes('pannala') || c.includes('kegalle') || c.includes('kuliyapitiya') ||
      c.includes('ruwanwella')) {
    return 'Zone 03';
  }
  
  if (d.includes('ampara') || d.includes('batticaloa') || d.includes('trincomalee') ||
      c.includes('ampara') || c.includes('batticaloa') || c.includes('trincomalee')) {
    return 'Zone 04';
  }
  
  if (d.includes('jaffna') || d.includes('kilinochchi') || d.includes('vavuniya') ||
      d.includes('mannar') || d.includes('mullaitivu') ||
      c.includes('jaffna') || c.includes('kilinochchi') || c.includes('vavuniya')) {
    return 'Zone 05';
  }
  
  return 'Zone 01'; // Default fallback
}

const seedApplicators = async () => {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📡 Connected to MongoDB');

    const filePath = 'C:\\Users\\Chamara\\Downloads\\Waterproofing Technicians Club.xlsx';
    console.log(`📖 Loading Excel file from: ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${rawRows.length} rows to process.`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Fetch existing member IDs and info to prevent duplicates
    const allMembers = await Member.find({});
    const existingIds = new Set(allMembers.map(m => m.memberId.toUpperCase()));
    
    for (const r of rawRows) {
      const name = r['Full Name'] ? String(r['Full Name']).trim() : '';
      if (!name) {
        skippedCount++;
        continue;
      }

      const phone = formatPhoneNumber(r['Contact Number']);
      const whatsapp = formatPhoneNumber(r['WhatsApp Number']) || phone;
      const nic = r['NIC'] ? String(r['NIC']).trim().toUpperCase() : '';
      const birthday = excelDateToJSDate(r['Date of Birth']);
      
      const district = r['District'] ? String(r['District']).trim() : '';
      const city = r['City/Area'] ? String(r['City/Area']).trim() : '';
      const location = city || district;
      
      const zone = inferZone(district, city);
      const notes = r['Feedback '] ? String(r['Feedback ']).trim() : '';

      // Check if this applicator already exists in the database
      // Match by name or phone or NIC (if present)
      let member = null;
      
      if (nic) {
        member = allMembers.find(m => m.nic && m.nic.toUpperCase() === nic);
      }
      if (!member && phone) {
        member = allMembers.find(m => m.phone === phone);
      }
      if (!member) {
        member = allMembers.find(m => m.memberName.toLowerCase() === name.toLowerCase());
      }

      if (member) {
        // Update details
        member.phone = phone || member.phone;
        member.whatsappNumber = whatsapp || member.whatsappNumber;
        member.nic = nic || member.nic;
        if (birthday) member.birthday = birthday;
        member.location = location || member.location;
        member.zone = zone || member.zone;
        member.notes = notes || member.notes;
        member.role = 'applicator';
        member.equipment = 'Applicator'; // set equipment to Applicator to distinguish from Hardware store
        
        await member.save();
        updatedCount++;
        console.log(`   [*] Updated existing applicator ${member.memberId}: ${name}`);
      } else {
        // Generate unique memberId starting with MAxxxx (random 4-digit ID)
        let memberId = '';
        let isDuplicate = true;
        
        while (isDuplicate) {
          const randNum = Math.floor(1000 + Math.random() * 9000).toString();
          memberId = `MA${randNum}`;
          if (!existingIds.has(memberId)) {
            isDuplicate = false;
            existingIds.add(memberId);
          }
        }

        const newApplicator = new Member({
          memberId,
          memberName: name,
          phone,
          whatsappNumber: whatsapp,
          nic,
          birthday,
          role: 'applicator',
          location,
          zone,
          equipment: 'Applicator',
          points: 0,
          tier: 'bronze',
          condition: 'good',
          notes: notes || 'Imported from Waterproofing Technicians Club data sheet'
        });

        await newApplicator.save();
        createdCount++;
        console.log(`   [+] Created new applicator ${memberId}: ${name} (Location: ${location}, Zone: ${zone})`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${createdCount}`);
    console.log(`   Updated: ${updatedCount}`);
    console.log(`   Skipped empty: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedApplicators();
