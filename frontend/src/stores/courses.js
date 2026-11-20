import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/api/client';
import { useEnrollmentStore } from './enrollments';

/** Shared course list - used by the Courses view and both enrollment course dropdowns. */
export const useCourseStore = defineStore('courses', () => {
    const courses = ref([]);
    const loading = ref(false);
    const loaded = ref(false);
    const error = ref('');

    const sortedCourses = computed(() =>
        [...courses.value].sort((a, b) => a.courseId.localeCompare(b.courseId, undefined, { numeric: true }))
    );
    const count = computed(() => courses.value.length);

    function findById(id) {
        return courses.value.find((course) => course._id === id);
    }

    async function fetchCourses({ force = false } = {}) {
        if (loaded.value && !force) return;
        loading.value = true;
        error.value = '';
        try {
            courses.value = await api.get('/courses');
            loaded.value = true;
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    async function addCourse(payload) {
        const course = await api.post('/courses', payload);
        courses.value.push(course);
        return course;
    }

    async function deleteCourse(id) {
        const result = await api.delete(`/courses/${id}`);
        courses.value = courses.value.filter((course) => course._id !== id);
        useEnrollmentStore().removeCourseRoster(id);
        return result;
    }

    function adjustEnrollmentCount(courseId, delta) {
        const course = findById(courseId);
        if (course) course.enrollmentCount = Math.max(0, (course.enrollmentCount ?? 0) + delta);
    }

    return {
        courses,
        sortedCourses,
        count,
        loading,
        loaded,
        error,
        findById,
        fetchCourses,
        addCourse,
        deleteCourse,
        adjustEnrollmentCount,
    };
});
