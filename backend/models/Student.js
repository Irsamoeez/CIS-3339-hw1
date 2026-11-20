import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required.'],
            trim: true,
            maxlength: [100, 'Name must be 100 characters or fewer.'],
        },
        studentId: {
            type: String,
            required: [true, 'Student ID is required.'],
            trim: true,
            unique: true, // creates a unique index -> duplicate IDs are rejected by MongoDB
            match: [/^\d{1,10}$/, 'Student ID must be 1-10 digits.'],
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required.'],
            trim: true,
            match: [/^[0-9()+\-.\s]{7,20}$/, 'Phone must be 7-20 characters using digits, spaces, ( ) + - or .'],
        },
        zip: {
            type: String,
            required: [true, 'ZIP code is required.'],
            trim: true,
            match: [/^\d{5}(-\d{4})?$/, 'ZIP code must be 5 digits (or ZIP+4, e.g. 77004-1234).'],
        },
    },
    { timestamps: true, versionKey: false }
);

// Speeds up name searches.
studentSchema.index({ name: 1 });

export default mongoose.model('Student', studentSchema);
