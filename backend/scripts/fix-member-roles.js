/**
 * One-time migration: Fix member and scan roles based on memberId prefix
 *  MA* → role: 'applicator'
 *  MH* → role: 'customer'
 *
 * Run once:  node scripts/fix-member-roles.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Member = require('../models/Member');
const Scan   = require('../models/Scan');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB');

  // ── Fix Members ────────────────────────────────────────────────────────────
  const members = await Member.find({});
  let mFixed = 0;

  for (const m of members) {
    const id = (m.memberId || '').toUpperCase();
    let correctRole = null;

    if (id.startsWith('MA')) {
      correctRole = 'applicator';
    } else if (id.startsWith('MH') || id.startsWith('CUS-')) {
      correctRole = 'customer';
    }

    if (correctRole && m.role !== correctRole) {
      console.log(`  Member ${m.memberId}: ${m.role} → ${correctRole}`);
      m.role = correctRole;
      // Use updateOne to bypass pre-save (role is already correct, just saving)
      await Member.updateOne({ _id: m._id }, { role: correctRole });
      mFixed++;
    }
  }
  console.log(`\n📋  Members fixed: ${mFixed} / ${members.length}`);

  // ── Fix Scans ──────────────────────────────────────────────────────────────
  const scans = await Scan.find({});
  let sFixed = 0;

  for (const s of scans) {
    const id = (s.memberId || '').toUpperCase();
    let correctRole = null;

    if (id.startsWith('MA')) {
      correctRole = 'applicator';
    } else if (id.startsWith('MH') || id.startsWith('CUS-')) {
      correctRole = 'customer';
    }

    if (correctRole && s.role !== correctRole) {
      await Scan.updateOne({ _id: s._id }, { role: correctRole });
      sFixed++;
    }
  }
  console.log(`📋  Scans fixed:   ${sFixed} / ${scans.length}`);

  await mongoose.disconnect();
  console.log('\n✅  Done. Disconnected.');
}

run().catch(err => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
