/*
  backfillDonations.js

  Usage:
    1) Create a JSON file `backfill.json` in the project root with an array of objects:
       [
         { "donationId": "68fab7059388938c79054918", "userId": "68fa7720f4ac1602c46edda3" },
         ...
       ]

    2) Run with NODE environment MONGO_URI set (or it will use process.env.MONGO_URI):
       node scripts/backfillDonations.js

  What it does: connects to MongoDB, loads the Donation model, and runs updateOne for
  each mapping to set the donor ObjectId for the given donation id. It prints a summary.
*/

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Adjust import path if needed
import Donation from '../models/donorModal.js';

const MONGO_URI = process.env.MONGO_URI || process.env.NEXT_PUBLIC_MONGO_URI || 'mongodb://localhost:27017/charity';

async function run() {
  try {
    const filePath = path.resolve(process.cwd(), 'backfill.json');
    if (!fs.existsSync(filePath)) {
      console.error('backfill.json not found in project root. Create it with the mapping array.');
      process.exit(1);
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const mappings = JSON.parse(raw);
    if (!Array.isArray(mappings)) {
      console.error('backfill.json must contain an array of { donationId, userId }');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI, { autoIndex: false });
    console.log('Connected to MongoDB');

    let success = 0;
    for (const item of mappings) {
      const { donationId, userId } = item;
      if (!donationId || !userId) {
        console.warn('Skipping invalid entry:', item);
        continue;
      }
      try {
        const update = await Donation.updateOne(
          { _id: mongoose.Types.ObjectId(String(donationId)) },
          { $set: { donor: mongoose.Types.ObjectId(String(userId)) } }
        );
        if (update.matchedCount === 0) {
          console.warn('No donation found with id', donationId);
        } else {
          console.log('Updated donation', donationId);
          success++;
        }
      } catch (e) {
        console.error('Failed to update', donationId, e.message || e);
      }
    }

    console.log(`Done. Successful updates: ${success}/${mappings.length}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error', err);
    process.exit(1);
  }
}

run();
