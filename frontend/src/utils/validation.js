// Client-side rules mirror the Mongoose schemas so users get instant feedback.
// The server re-validates everything, so these are a convenience, not the source of truth.

export const patterns = {
    studentId: /^\d{1,10}$/,
    phone: /^[0-9()+\-.\s]{7,20}$/,
    zip: /^\d{5}(-\d{4})?$/,
    courseId: /^[A-Za-z0-9][A-Za-z0-9 -]{1,19}$/,
};

export function validateStudent(form) {
    const errors = {};
    const name = form.name.trim();
    const studentId = form.studentId.trim();
    const phone = form.phone.trim();
    const zip = form.zip.trim();

    if (!name) errors.name = 'Name is required.';
    else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

    if (!studentId) errors.studentId = 'Student ID is required.';
    else if (!patterns.studentId.test(studentId)) errors.studentId = 'Student ID must be 1-10 digits.';

    if (!phone) errors.phone = 'Phone number is required.';
    else if (!patterns.phone.test(phone)) errors.phone = 'Use 7-20 digits, spaces, ( ) + - or .';

    if (!zip) errors.zip = 'ZIP code is required.';
    else if (!patterns.zip.test(zip)) errors.zip = 'ZIP code must be 5 digits (or ZIP+4).';

    return errors;
}

export function validateCourse(form) {
    const errors = {};
    const courseId = form.courseId.trim().replace(/\s+/g, ' ');
    const courseName = form.courseName.trim();

    if (!courseId) errors.courseId = 'Course ID is required.';
    else if (!patterns.courseId.test(courseId)) errors.courseId = 'Use 2-20 letters, numbers, spaces or dashes (e.g. CIS 3339).';

    if (!courseName) errors.courseName = 'Course name is required.';
    else if (courseName.length > 120) errors.courseName = 'Course name must be 120 characters or fewer.';

    return errors;
}
