import { Router } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import { validateObjectId } from '../middleware/errors.js';

const router = Router();

// GET /api/enrollments?course=<id>&student=<id>  (both filters optional)
router.get('/', async (req, res) => {
    const filter = {};
    for (const key of ['course', 'student']) {
        const value = req.query[key];
        if (value !== undefined) {
            if (!mongoose.isValidObjectId(value)) {
                return res.status(400).json({ error: `Invalid ${key} id.` });
            }
            filter[key] = value;
        }
    }

    const enrollments = await Enrollment.find(filter).populate('student').populate('course').sort({ createdAt: 1 }).lean();
    res.json(enrollments);
});

// POST /api/enrollments  { student: <student _id>, course: <course _id> }
router.post('/', async (req, res) => {
    const { student: studentRef, course: courseRef } = req.body ?? {};

    const details = {};
    if (!studentRef) details.student = 'Select a student.';
    else if (!mongoose.isValidObjectId(studentRef)) details.student = 'Invalid student.';
    if (!courseRef) details.course = 'Select a course.';
    else if (!mongoose.isValidObjectId(courseRef)) details.course = 'Invalid course.';
    if (Object.keys(details).length) {
        return res.status(400).json({ error: Object.values(details).join(' '), details });
    }

    // Referential integrity: both sides must exist.
    const [student, course] = await Promise.all([Student.findById(studentRef), Course.findById(courseRef)]);
    if (!student || !course) {
        const missing = [!student && 'student', !course && 'course'].filter(Boolean).join(' and ');
        return res.status(404).json({ error: `The selected ${missing} no longer exists. Refresh and try again.` });
    }

    if (await Enrollment.exists({ student: student._id, course: course._id })) {
        return res.status(409).json({ error: `${student.name} is already enrolled in ${course.courseId}.` });
    }

    const enrollment = await Enrollment.create({ student: student._id, course: course._id });
    res.status(201).json({ ...enrollment.toObject(), student, course });
});

// DELETE /api/enrollments/:id  -> unenroll
router.delete('/:id', validateObjectId, async (req, res) => {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found or already removed.' });
    }
    res.json({ message: 'Enrollment removed.', enrollment });
});

export default router;
