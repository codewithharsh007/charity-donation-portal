// ...existing code...
import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({

        // The donor who created this donation
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

    ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ngo', // ensure this matches your NGO model name

    },
  
    ngoType: {
        type: String,
        enum: ['items', 'money'],
        required: true
    },
    amount: {
        type: Number,
        min: 1,
        required: function () { return this.ngoType === 'money'; }
    },
    items: {
        type: [String], // descriptions of donated items when ngoType === 'items'
        default: []
    },
    note: {
        type: String,
        trim: true
    },
    donateDate: {
        type: Date,
        default: Date.now
    },
    images: {
        type: [String],
        default: []
    },
    videos: {
        type: [String],
        default: []
    }

}, { timestamps: true });

const Donation = mongoose.models.Donation || mongoose.model('Donation', donationSchema);

export default Donation;
