<script setup>
defineProps({
    courses: { type: Array, required: true },
    deletingId: { type: String, default: null },
});
const emit = defineEmits(['delete']);
</script>

<template>
    <div class="table-wrap">
        <table class="table">
            <caption class="sr-only">All courses</caption>
            <thead>
                <tr>
                    <th scope="col">Course ID</th>
                    <th scope="col">Course name</th>
                    <th scope="col" class="table__num">Enrolled</th>
                    <th scope="col" class="table__actions">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="course in courses" :key="course._id">
                    <td data-label="Course ID" class="table__primary">{{ course.courseId }}</td>
                    <td data-label="Course name">{{ course.courseName }}</td>
                    <td data-label="Enrolled" class="table__num">{{ course.enrollmentCount ?? 0 }}</td>
                    <td data-label="Action" class="table__actions">
                        <div class="btn-group">
                            <RouterLink
                                :to="{ name: 'enrollments', query: { course: course._id } }"
                                class="btn btn--ghost btn--sm"
                                :aria-label="`View students enrolled in ${course.courseId}`"
                            >
                                Roster
                            </RouterLink>
                            <button
                                type="button"
                                class="btn btn--danger btn--sm"
                                :disabled="deletingId === course._id"
                                :aria-label="`Delete course ${course.courseId}`"
                                @click="emit('delete', course)"
                            >
                                {{ deletingId === course._id ? 'Deleting…' : 'Delete' }}
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
