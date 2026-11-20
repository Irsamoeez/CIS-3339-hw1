<script setup>
import { onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import CourseForm from '@/components/CourseForm.vue';
import CourseTable from '@/components/CourseTable.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import AlertMessage from '@/components/AlertMessage.vue';
import { useCourseStore } from '@/stores/courses';
import { useNotificationStore } from '@/stores/notifications';

const courseStore = useCourseStore();
const notifications = useNotificationStore();
const { sortedCourses, loading, loaded, error, count } = storeToRefs(courseStore);

const deletingId = ref(null);

// Always refresh so enrollment counts are current.
onMounted(() => courseStore.fetchCourses({ force: true }));

async function handleDelete(course) {
    const enrolled = course.enrollmentCount ?? 0;
    const warning = enrolled
        ? `\n${enrolled} enrollment${enrolled === 1 ? '' : 's'} in this course will also be removed.`
        : '';
    if (!window.confirm(`Delete ${course.courseId} – ${course.courseName}?${warning}`)) return;

    deletingId.value = course._id;
    try {
        const { enrollmentsRemoved } = await courseStore.deleteCourse(course._id);
        const extra = enrollmentsRemoved
            ? ` and ${enrollmentsRemoved} enrollment${enrollmentsRemoved === 1 ? '' : 's'}`
            : '';
        notifications.success(`Deleted ${course.courseId}${extra}.`);
    } catch (err) {
        notifications.error(err.message);
        if (err.status === 404) courseStore.fetchCourses({ force: true });
    } finally {
        deletingId.value = null;
    }
}
</script>

<template>
    <div class="page">
        <header class="page__header">
            <h1>Courses</h1>
            <p class="page__lead">Add courses, review enrollment counts and remove courses.</p>
        </header>

        <div class="grid grid--sidebar">
            <BaseCard title="Add a course">
                <CourseForm />
            </BaseCard>

            <BaseCard :title="`Course list (${count})`">
                <template #actions>
                    <button
                        type="button"
                        class="btn btn--ghost btn--sm"
                        :disabled="loading"
                        @click="courseStore.fetchCourses({ force: true })"
                    >
                        {{ loading && loaded ? 'Refreshing…' : 'Refresh' }}
                    </button>
                </template>

                <LoadingState v-if="loading && !loaded" message="Loading courses…" />
                <AlertMessage v-else-if="error && !loaded" :message="error">
                    <button type="button" class="btn btn--secondary btn--sm" @click="courseStore.fetchCourses({ force: true })">
                        Try again
                    </button>
                </AlertMessage>
                <EmptyState v-else-if="!sortedCourses.length" title="No courses yet" message="Add a course using the form." />
                <CourseTable v-else :courses="sortedCourses" :deleting-id="deletingId" @delete="handleDelete" />
            </BaseCard>
        </div>
    </div>
</template>
