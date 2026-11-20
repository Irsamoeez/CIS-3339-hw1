import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: [true, 'Student is required.'],
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: [true, 'Course is required.'],
        },
    },
    { timestamps: true, versionKey: false }
);

// A student can be enrolled in a given course only once.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
// Fast course roster lookups.
enrollmentSchema.index({ course: 1 });

export default mongoose.model('Enrollment', enrollmentSchema);
