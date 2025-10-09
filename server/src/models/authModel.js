import mongoose from 'mongoose';

const authSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },

    // roles: single value or multiple roles
    roles: {
        type: [String],
        enum: ['donor', 'ngo', 'admin'],
        default: ['donor']
    },

    // NGO-specific fields — required only if roles includes 'ngo'
    registrationNumber: {
        type: String,
        unique: true,
        required: function () {
            // `this` is the document
            return Array.isArray(this.roles) ? this.roles.includes('ngo') : this.roles === 'ngo';
        }
    },
    website: {
        type: String,
        required: function () {
            return Array.isArray(this.roles) ? this.roles.includes('ngo') : this.roles === 'ngo';
        }
    },


    // verified makes sense for NGO; default false
    verified: {
        type: Boolean,
    }

}, { timestamps: true });

const Auth = mongoose.model('Auth', authSchema);
export default Auth;
