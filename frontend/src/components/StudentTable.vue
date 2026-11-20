<script setup>
// Reusable student table. Pass an #actions slot to add a per-row action column (Delete, Unenroll...).
defineProps({
    students: { type: Array, required: true },
    caption: { type: String, default: 'Students' },
});
</script>

<template>
    <div class="table-wrap">
        <table class="table">
            <caption class="sr-only">{{ caption }}</caption>
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Student ID</th>
                    <th scope="col">Phone</th>
                    <th scope="col">ZIP</th>
                    <th v-if="$slots.actions" scope="col" class="table__actions">Action</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="student in students" :key="student.enrollmentId ?? student._id">
                    <td data-label="Name" class="table__primary">{{ student.name }}</td>
                    <td data-label="Student ID">{{ student.studentId }}</td>
                    <td data-label="Phone">{{ student.phone }}</td>
                    <td data-label="ZIP">{{ student.zip }}</td>
                    <td v-if="$slots.actions" data-label="Action" class="table__actions">
                        <slot name="actions" :student="student" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>
