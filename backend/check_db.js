const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://megakemit_db_user:Megakemloyalty2026@megakemloyalty.gf75mvv.mongodb.net/megakem-loyalty?retryWrites=true&w=majority';

const memberSchema = new mongoose.Schema({
  memberId: String,
  memberName: String,
  phone: String,
  whatsappNumber: String,
  nic: String,
  role: String
}, { strict: false });

const Member = mongoose.model('Member', memberSchema);

async function checkDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');
    const members = await Member.find({ role: 'applicator' }).limit(5);
    members.forEach(m => {
      console.log(`ID: ${m.memberId}, Name: ${m.memberName}, WhatsApp: ${m.whatsappNumber}, NIC: ${m.nic}`);
    });
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkDB();
