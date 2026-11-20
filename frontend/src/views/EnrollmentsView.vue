<script setup>
import { computed, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import EnrollmentForm from '@/components/EnrollmentForm.vue';
import CourseRoster from '@/components/CourseRoster.vue';
import AlertMessage from '@/components/AlertMessage.vue';
import { useStudentStore } from '@/stores/students';
import { useCourseStore } from '@/stores/courses';

const studentStore = useStudentStore();
const courseStore = useCourseStore();

const loading = computed(
    () => (studentStore.loading && !studentStore.loaded) || (courseStore.loading && !courseStore.loaded)
);
const loadError = computed(() => studentStore.error || courseStore.error);

function loadOptions() {
    // Dropdowns are populated from the backend, never hard-coded.
    return Promise.all([studentStore.fetchStudents({ force: true }), courseStore.fetchCourses({ force: true })]);
}

onMounted(loadOptions);
</script>

<template>
    <div class="page">
        <header class="page__header">
            <h1>Enrollments</h1>
            <p class="page__lead">Enroll students in courses and view each course's roster.</p>
        </header>

        <AlertMessage v-if="loadError" :message="`Could not load students or courses: ${loadError}`">
            <button type="button" class="btn btn--secondary btn--sm" @click="loadOptions">Try again</button>
        </AlertMessage>

        <div class="grid grid--sidebar">
            <BaseCard title="Enroll a student" description="Pick an existing student and course.">
                <EnrollmentForm :loading="loading" />
            </BaseCard>

            <BaseCard title="Students in course" description="Select a course to list everyone enrolled in it.">
                <CourseRoster :loading="loading" />
            </BaseCard>
        </div>
    </div>
</template>
