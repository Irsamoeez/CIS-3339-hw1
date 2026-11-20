<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import StudentTable from './StudentTable.vue';
import LoadingState from './LoadingState.vue';
import EmptyState from './EmptyState.vue';
import AlertMessage from './AlertMessage.vue';
import { useCourseStore } from '@/stores/courses';
import { useEnrollmentStore } from '@/stores/enrollments';
import { useNotificationStore } from '@/stores/notifications';

defineProps({
    loading: { type: Boolean, default: false },
});

const route = useRoute();
const router = useRouter();
const courseStore = useCourseStore();
const enrollmentStore = useEnrollmentStore();
const notifications = useNotificationStore();
const { sortedCourses } = storeToRefs(courseStore);

// The selected course lives in the URL (?course=...) so the roster survives refresh and can be linked to.
const selectedCourse = ref(typeof route.query.course === 'string' ? route.query.course : '');
const error = ref('');
const unenrollingId = ref(null);

const course = computed(() => courseStore.findById(selectedCourse.value));
const roster = computed(() => {
    const students = enrollmentStore.rosters[selectedCourse.value];
    return students ? [...students].sort((a, b) => a.name.localeCompare(b.name)) : null;
});
const rosterLoading = computed(() => enrollmentStore.isRosterLoading(selectedCourse.value));

async function loadRoster() {
    if (!selectedCourse.value) {
        error.value = 'Select a course to list its students.';
        return;
    }
    error.value = '';
    try {
        await enrollmentStore.fetchRoster(selectedCourse.value);
    } catch (err) {
        error.value = err.message;
    }
}

watch(
    selectedCourse,
    (courseId) => {
        if (route.query.course !== (courseId || undefined)) {
            router.replace({ query: courseId ? { course: courseId } : {} });
        }
        if (courseId) loadRoster();
    },
    { immediate: true }
);

async function unenroll(student) {
    const label = course.value?.courseId ?? 'this course';
    if (!window.confirm(`Remove ${student.name} from ${label}?`)) return;

    unenrollingId.value = student.enrollmentId;
    try {
        await enrollmentStore.unenroll(student.enrollmentId, selectedCourse.value);
        notifications.success(`Removed ${student.name} from ${label}.`);
    } catch (err) {
        notifications.error(err.message);
        loadRoster();
    } finally {
        unenrollingId.value = null;
    }
}
</script>

<template>
    <form class="form form--inline" novalidate @submit.prevent="loadRoster">
        <div class="field">
            <label for="roster-course" class="field__label">Course</label>
            <select id="roster-course" v-model="selectedCourse" class="field__input" :disabled="loading || !sortedCourses.length">
                <option value="" disabled>{{ loading ? 'Loading courses…' : '-- Select a course --' }}</option>
                <option v-for="c in sortedCourses" :key="c._id" :value="c._id">{{ c.courseName }} ({{ c.courseId }})</option>
            </select>
        </div>
        <button type="submit" class="btn btn--secondary" :disabled="!selectedCourse || rosterLoading">
            {{ rosterLoading ? 'Loading…' : 'List students' }}
        </button>
    </form>

    <div class="roster" aria-live="polite">
        <AlertMessage v-if="error" :message="error" />
        <LoadingState v-else-if="rosterLoading && !roster" message="Loading enrolled students…" />
        <EmptyState
            v-else-if="!selectedCourse"
            title="No course selected"
            message="Choose a course above to see who is enrolled."
        />
        <EmptyState
            v-else-if="roster && !roster.length"
            title="No students enrolled yet"
            :message="`Nobody is enrolled in ${course?.courseId ?? 'this course'}. Use the form to enroll a student.`"
        />
        <template v-else-if="roster">
            <p class="roster__summary">
                <strong>{{ roster.length }}</strong> {{ roster.length === 1 ? 'student' : 'students' }} enrolled in
                <strong>{{ course?.courseId }}</strong> {{ course?.courseName }}
            </p>
            <StudentTable :students="roster" :caption="`Students enrolled in ${course?.courseId ?? 'course'}`">
                <template #actions="{ student }">
                    <button
                        type="button"
                        class="btn btn--ghost btn--sm"
                        :disabled="unenrollingId === student.enrollmentId"
                        :aria-label="`Remove ${student.name} from this course`"
                        @click="unenroll(student)"
                    >
                        {{ unenrollingId === student.enrollmentId ? 'Removing…' : 'Unenroll' }}
                    </button>
                </template>
            </StudentTable>
        </template>
    </div>
</template>
