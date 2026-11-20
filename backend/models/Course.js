import mongoose from 'mongoose';

// "cis   3339" -> "CIS 3339", so the same course can't be added twice with different spacing/case.
const normalizeCourseId = (value) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toUpperCase() : value;

const courseSchema = new mongoose.Schema(
    {
        courseId: {
            type: String,
            required: [true, 'Course ID is required.'],
            set: normalizeCourseId,
            unique: true, // unique index -> duplicate course IDs are rejected
            match: [/^[A-Z0-9][A-Z0-9 -]{1,19}$/, 'Course ID must be 2-20 letters, numbers, spaces or dashes (e.g. CIS 3339).'],
        },
        courseName: {
            type: String,
            required: [true, 'Course name is required.'],
            trim: true,
            maxlength: [120, 'Course name must be 120 characters or fewer.'],
        },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model('Course', courseSchema);
