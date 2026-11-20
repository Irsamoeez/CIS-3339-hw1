<script setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import AlertMessage from './AlertMessage.vue';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useNotificationStore } from '@/stores/notifications';

const props = defineProps({
    loading: { type: Boolean, default: false },
});
const emit = defineEmits(['enrolled']);

const studentStore = useStudentStore();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();
const notifications = useNotificationStore();
const { sortedStudents } = storeToRefs(studentStore);
const { sortedCourses } = storeToRefs(courseStore);

const selectedStudent = ref('');
const selectedCourse = ref('');
const submitted = ref(false);
const submitting = ref(false);
const formError = ref('');

const errors = computed(() => ({
    student: submitted.value && !selectedStudent.value ? 'Select a student.' : '',
    course: submitted.value && !selectedCourse.value ? 'Select a course.' : '',
}));

const alreadyEnrolled = computed(
    () =>
        Boolean(selectedStudent.value && selectedCourse.value) &&
        enrollmentStore.isEnrolled(selectedStudent.value, selectedCourse.value)
);

const noData = computed(() => !props.loading && (!sortedStudents.value.length || !sortedCourses.value.length));

watch([selectedStudent, selectedCourse], () => {
    formError.value = '';
});

// Load the selected course's roster in the background so we can warn about duplicates before submitting.
watch(selectedCourse, (courseId) => {
    if (courseId) enrollmentStore.ensureRoster(courseId);
});

async function handleSubmit() {
    submitted.value = true;
    if (!selectedStudent.value || !selectedCourse.value) return;
    if (alreadyEnrolled.value) {
        formError.value = 'This student is already enrolled in this course.';
        return;
    }

    submitting.value = true;
    try {
        const enrollment = await enrollmentStore.enroll({ student: selectedStudent.value, course: selectedCourse.value });
        notifications.success(`Enrolled ${enrollment.student.name} in ${enrollment.course.courseId}.`);
        emit('enrolled', enrollment);
        selectedStudent.value = ''; // keep the course selected to enroll more students quickly
        submitted.value = false;
    } catch (err) {
        formError.value = err.message;
        if (err.status === 404) {
            // A student or course was deleted elsewhere - refresh the dropdowns.
            studentStore.fetchStudents({ force: true });
            courseStore.fetchCourses({ force: true });
        }
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
    <form class="form" novalidate @submit.prevent="handleSubmit">
        <AlertMessage v-if="formError" :message="formError" />
        <AlertMessage v-else-if="alreadyEnrolled" type="warning" message="This student is already enrolled in the selected course." />

        <AlertMessage v-if="noData" type="info" message="You need at least one student and one course to create an enrollment.">
            <p class="alert__links">
                <RouterLink :to="{ name: 'students' }">Add a student</RouterLink>
                ·
                <RouterLink :to="{ name: 'courses' }">Add a course</RouterLink>
            </p>
        </AlertMessage>

        <div class="field" :class="{ 'field--invalid': errors.student }">
            <label for="enroll-student" class="field__label">Student<span class="field__required" aria-hidden="true"> *</span></label>
            <select
                id="enroll-student"
                v-model="selectedStudent"
                class="field__input"
                aria-required="true"
                :aria-invalid="errors.student ? 'true' : 'false'"
                :aria-describedby="errors.student ? 'enroll-student-error' : undefined"
                :disabled="loading || !sortedStudents.length"
            >
                <option value="" disabled>{{ loading ? 'Loading students…' : '-- Select a student --' }}</option>
                <option v-for="student in sortedStudents" :key="student._id" :value="student._id">
                    {{ student.name }} ({{ student.studentId }})
                </option>
            </select>
            <p v-if="errors.student" id="enroll-student-error" class="field__error">{{ errors.student }}</p>
        </div>

        <div class="field" :class="{ 'field--invalid': errors.course }">
            <label for="enroll-course" class="field__label">Course<span class="field__required" aria-hidden="true"> *</span></label>
            <select
                id="enroll-course"
                v-model="selectedCourse"
                class="field__input"
                aria-required="true"
                :aria-invalid="errors.course ? 'true' : 'false'"
                :aria-describedby="errors.course ? 'enroll-course-error' : undefined"
                :disabled="loading || !sortedCourses.length"
            >
                <option value="" disabled>{{ loading ? 'Loading courses…' : '-- Select a course --' }}</option>
                <option v-for="course in sortedCourses" :key="course._id" :value="course._id">
                    {{ course.courseName }} ({{ course.courseId }})
                </option>
            </select>
            <p v-if="errors.course" id="enroll-course-error" class="field__error">{{ errors.course }}</p>
        </div>

        <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="submitting || loading || noData || alreadyEnrolled">
                {{ submitting ? 'Enrolling…' : 'Enroll student' }}
            </button>
        </div>
    </form>
</template>
