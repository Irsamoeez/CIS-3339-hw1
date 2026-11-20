import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/api/client';
import { useCourseStore } from './courses';

/** Course rosters, cached by course _id. Kept in sync when students/courses are deleted. */
export const useEnrollmentStore = defineStore('enrollments', () => {
    const rosters = ref({}); // { [courseId]: [student + enrollmentId] }
    const loadingRosters = ref({}); // { [courseId]: true }

    const isRosterLoading = (courseId) => Boolean(loadingRosters.value[courseId]);
    const hasRoster = (courseId) => Array.isArray(rosters.value[courseId]);

    async function fetchRoster(courseId) {
        loadingRosters.value[courseId] = true;
        try {
            const data = await api.get(`/courses/${courseId}/students`);
            rosters.value[courseId] = data.students;
            return data;
        } finally {
            delete loadingRosters.value[courseId];
        }
    }

    /** Loads a roster only if it isn't cached; failures are ignored (the server still blocks duplicates). */
    async function ensureRoster(courseId) {
        if (hasRoster(courseId) || isRosterLoading(courseId)) return;
        try {
            await fetchRoster(courseId);
        } catch {
            /* non-critical */
        }
    }

    function isEnrolled(studentId, courseId) {
        return rosters.value[courseId]?.some((student) => student._id === studentId) ?? false;
    }

    async function enroll({ student, course }) {
        const enrollment = await api.post('/enrollments', { student, course });
        if (hasRoster(course)) {
            rosters.value[course] = [
                ...rosters.value[course],
                { ...enrollment.student, enrollmentId: enrollment._id, enrolledAt: enrollment.createdAt },
            ];
        }
        useCourseStore().adjustEnrollmentCount(course, 1);
        return enrollment;
    }

    async function unenroll(enrollmentId, courseId) {
        await api.delete(`/enrollments/${enrollmentId}`);
        if (hasRoster(courseId)) {
            rosters.value[courseId] = rosters.value[courseId].filter((s) => s.enrollmentId !== enrollmentId);
        }
        useCourseStore().adjustEnrollmentCount(courseId, -1);
    }

    function removeStudentFromRosters(studentId) {
        for (const [courseId, roster] of Object.entries(rosters.value)) {
            const remaining = roster.filter((student) => student._id !== studentId);
            if (remaining.length !== roster.length) {
                rosters.value[courseId] = remaining;
                useCourseStore().adjustEnrollmentCount(courseId, -1);
            }
        }
    }

    function removeCourseRoster(courseId) {
        delete rosters.value[courseId];
    }

    return {
        rosters,
        isRosterLoading,
        hasRoster,
        fetchRoster,
        ensureRoster,
        isEnrolled,
        enroll,
        unenroll,
        removeStudentFromRosters,
        removeCourseRoster,
    };
});
