<script setup>
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import BaseCard from '@/components/BaseCard.vue';
import StudentSearch from '@/components/StudentSearch.vue';
import StudentForm from '@/components/StudentForm.vue';
import StudentTable from '@/components/StudentTable.vue';
import LoadingState from '@/components/LoadingState.vue';
import EmptyState from '@/components/EmptyState.vue';
import AlertMessage from '@/components/AlertMessage.vue';
import { useStudentStore } from '@/stores/students';
import { useNotificationStore } from '@/stores/notifications';

const studentStore = useStudentStore();
const notifications = useNotificationStore();
const { sortedStudents, searchResults, searchQuery, isSearching, searching, loading, loaded, error, count } =
    storeToRefs(studentStore);

const deletingId = ref(null);
const searchError = ref('');

const displayedStudents = computed(() => (isSearching.value ? searchResults.value : sortedStudents.value));
const resultsTitle = computed(() =>
    isSearching.value ? `Results for “${searchQuery.value}” (${searchResults.value.length})` : `All students (${count.value})`
);

onMounted(() => studentStore.fetchStudents({ force: true }));

async function handleSearch(query) {
    searchError.value = '';
    try {
        await studentStore.searchStudents(query);
    } catch (err) {
        searchError.value = err.message;
    }
}

function handleClearSearch() {
    searchError.value = '';
    studentStore.clearSearch();
}

async function handleDelete(student) {
    const confirmed = window.confirm(
        `Delete ${student.name} (ID ${student.studentId})?\nThis also removes all of their course enrollments.`
    );
    if (!confirmed) return;

    deletingId.value = student._id;
    try {
        const { enrollmentsRemoved } = await studentStore.deleteStudent(student._id);
        const extra = enrollmentsRemoved
            ? ` and ${enrollmentsRemoved} enrollment${enrollmentsRemoved === 1 ? '' : 's'}`
            : '';
        notifications.success(`Deleted ${student.name}${extra}.`);
    } catch (err) {
        notifications.error(err.message);
        if (err.status === 404) studentStore.fetchStudents({ force: true });
    } finally {
        deletingId.value = null;
    }
}
</script>

<template>
    <div class="page">
        <header class="page__header">
            <h1>Students</h1>
            <p class="page__lead">Search, add and remove students.</p>
        </header>

        <div class="grid grid--2">
            <BaseCard title="Search for a student">
                <StudentSearch
                    :loading="searching"
                    :active-query="searchQuery"
                    @search="handleSearch"
                    @clear="handleClearSearch"
                />
            </BaseCard>

            <BaseCard title="Add a student">
                <StudentForm />
            </BaseCard>
        </div>

        <BaseCard :title="resultsTitle">
            <template #actions>
                <button
                    v-if="!isSearching"
                    type="button"
                    class="btn btn--ghost btn--sm"
                    :disabled="loading"
                    @click="studentStore.fetchStudents({ force: true })"
                >
                    Refresh
                </button>
            </template>

            <AlertMessage v-if="searchError" :message="searchError" />
            <LoadingState v-else-if="searching" message="Searching…" />
            <LoadingState v-else-if="loading && !loaded" message="Loading students…" />
            <AlertMessage v-else-if="error && !loaded" :message="error">
                <button type="button" class="btn btn--secondary btn--sm" @click="studentStore.fetchStudents({ force: true })">
                    Try again
                </button>
            </AlertMessage>
            <EmptyState
                v-else-if="isSearching && !displayedStudents.length"
                title="Cannot find the student"
                :message="`No student matches “${searchQuery}”. Check the spelling or search by student ID.`"
            >
                <button type="button" class="btn btn--ghost btn--sm" @click="handleClearSearch">Show all students</button>
            </EmptyState>
            <EmptyState
                v-else-if="!displayedStudents.length"
                title="No students yet"
                message="Add your first student with the form above."
            />
            <StudentTable v-else :students="displayedStudents" :caption="resultsTitle">
                <template #actions="{ student }">
                    <button
                        type="button"
                        class="btn btn--danger btn--sm"
                        :disabled="deletingId === student._id"
                        :aria-label="`Delete ${student.name}`"
                        @click="handleDelete(student)"
                    >
                        {{ deletingId === student._id ? 'Deleting…' : 'Delete' }}
                    </button>
                </template>
            </StudentTable>
        </BaseCard>
    </div>
</template>
