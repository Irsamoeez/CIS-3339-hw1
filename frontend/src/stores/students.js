import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/api/client';
import { useEnrollmentStore } from './enrollments';

/** Shared student list - used by the Students view and the enrollment student dropdown. */
export const useStudentStore = defineStore('students', () => {
    const students = ref([]);
    const loading = ref(false);
    const loaded = ref(false);
    const error = ref('');

    const searchResults = ref([]);
    const searchQuery = ref('');
    const searching = ref(false);

    const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    const sortedStudents = computed(() => [...students.value].sort(byName));
    const count = computed(() => students.value.length);
    const isSearching = computed(() => searchQuery.value !== '');

    function findById(id) {
        return students.value.find((student) => student._id === id);
    }

    async function fetchStudents({ force = false } = {}) {
        if (loaded.value && !force) return;
        loading.value = true;
        error.value = '';
        try {
            students.value = await api.get('/students');
            loaded.value = true;
        } catch (err) {
            error.value = err.message;
        } finally {
            loading.value = false;
        }
    }

    async function searchStudents(query) {
        searching.value = true;
        try {
            searchResults.value = await api.get(`/students?search=${encodeURIComponent(query)}`);
            searchQuery.value = query;
        } finally {
            searching.value = false;
        }
    }

    function clearSearch() {
        searchQuery.value = '';
        searchResults.value = [];
    }

    async function addStudent(payload) {
        const student = await api.post('/students', payload);
        students.value.push(student);
        return student;
    }

    async function deleteStudent(id) {
        const result = await api.delete(`/students/${id}`);
        students.value = students.value.filter((student) => student._id !== id);
        searchResults.value = searchResults.value.filter((student) => student._id !== id);
        useEnrollmentStore().removeStudentFromRosters(id); // keep cached rosters in sync with the cascade
        return result;
    }

    return {
        students,
        sortedStudents,
        count,
        loading,
        loaded,
        error,
        searchResults,
        searchQuery,
        searching,
        isSearching,
        findById,
        fetchStudents,
        searchStudents,
        clearSearch,
        addStudent,
        deleteStudent,
    };
});
