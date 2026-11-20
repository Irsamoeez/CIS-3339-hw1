import { Router } from 'express';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import { validateObjectId } from '../middleware/errors.js';

const router = Router();

// GET /api/courses -> all courses, each with an enrollmentCount
router.get('/', async (req, res) => {
    const [courses, counts] = await Promise.all([
        Course.find().collation({ locale: 'en', numericOrdering: true }).sort({ courseId: 1 }).lean(),
        Enrollment.aggregate([{ $group: { _id: '$course', count: { $sum: 1 } } }]),
    ]);

    const countByCourse = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(courses.map((course) => ({ ...course, enrollmentCount: countByCourse.get(String(course._id)) ?? 0 })));
});

// GET /api/courses/:id/students -> course roster
router.get('/:id/students', validateObjectId, async (req, res) => {
    const course = await Course.findById(req.params.id).lean();
    if (!course) {
        return res.status(404).json({ error: 'Course not found.' });
    }

    const enrollments = await Enrollment.find({ course: course._id }).populate('student').sort({ createdAt: 1 }).lean();

    const students = enrollments
        .filter((enrollment) => enrollment.student) // defensive: skip any orphaned enrollment
        .map((enrollment) => ({
            ...enrollment.student,
            enrollmentId: enrollment._id,
            enrolledAt: enrollment.createdAt,
        }));

    res.json({ course, students });
});

// POST /api/courses  { courseId, courseName }
router.post('/', async (req, res) => {
    const { courseId, courseName } = req.body ?? {};
    const course = new Course({ courseId, courseName });

    await course.validate();

    if (await Course.exists({ courseId: course.courseId })) {
        return res.status(409).json({
            error: `A course with ID ${course.courseId} already exists.`,
            details: { courseId: 'This course ID is already in use.' },
        });
    }

    await course.save();
    res.status(201).json({ ...course.toObject(), enrollmentCount: 0 });
});

// DELETE /api/courses/:id -> also removes the course's enrollments
router.delete('/:id', validateObjectId, async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) {
        return res.status(404).json({ error: 'Course not found or already deleted.' });
    }

    const { deletedCount } = await Enrollment.deleteMany({ course: course._id });
    await course.deleteOne();

    res.json({ message: 'Course deleted.', course, enrollmentsRemoved: deletedCount });
});

export default router;
