import { Router } from 'express';
import Student from '../models/Student.js';
import Enrollment from '../models/Enrollment.js';
import { validateObjectId } from '../middleware/errors.js';

const router = Router();

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/students            -> all students
// GET /api/students?search=jo  -> case-insensitive partial name match, or exact student ID match
router.get('/', async (req, res) => {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const filter = search
        ? { $or: [{ name: { $regex: escapeRegex(search), $options: 'i' } }, { studentId: search }] }
        : {};

    const students = await Student.find(filter).collation({ locale: 'en' }).sort({ name: 1 }).lean();
    res.json(students);
});

// GET /api/students/:id
router.get('/:id', validateObjectId, async (req, res) => {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
        return res.status(404).json({ error: 'Student not found.' });
    }
    res.json(student);
});

// POST /api/students  { name, studentId, phone, zip }
router.post('/', async (req, res) => {
    const { name, studentId, phone, zip } = req.body ?? {};
    const student = new Student({ name, studentId, phone, zip });

    await student.validate(); // 400 with field details if anything is missing/invalid

    if (await Student.exists({ studentId: student.studentId })) {
        return res.status(409).json({
            error: `A student with ID ${student.studentId} already exists.`,
            details: { studentId: 'This student ID is already in use.' },
        });
    }

    await student.save();
    res.status(201).json(student);
});

// DELETE /api/students/:id  -> also removes the student's enrollments
router.delete('/:id', validateObjectId, async (req, res) => {
    const student = await Student.findById(req.params.id);
    if (!student) {
        return res.status(404).json({ error: 'Student not found or already deleted.' });
    }

    const { deletedCount } = await Enrollment.deleteMany({ student: student._id });
    await student.deleteOne();

    res.json({ message: 'Student deleted.', student, enrollmentsRemoved: deletedCount });
});

export default router;
