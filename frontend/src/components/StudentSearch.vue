<script setup>
import { ref, watch } from 'vue';
import FormField from './FormField.vue';

const props = defineProps({
    loading: { type: Boolean, default: false },
    activeQuery: { type: String, default: '' },
});
const emit = defineEmits(['search', 'clear']);

const query = ref(props.activeQuery);
const error = ref('');

watch(query, () => {
    error.value = '';
});

function submit() {
    const value = query.value.trim();
    if (!value) {
        error.value = 'Enter a name or student ID to search.';
        return;
    }
    emit('search', value);
}

function clear() {
    query.value = '';
    emit('clear');
}
</script>

<template>
    <form class="form" role="search" novalidate @submit.prevent="submit">
        <FormField
            id="student-search"
            v-model="query"
            type="search"
            label="Student name or ID"
            placeholder="e.g. John or 1001"
            autocomplete="off"
            hint="Partial names work and case doesn't matter."
            :error="error"
        />
        <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="loading">
                {{ loading ? 'Searching…' : 'Search' }}
            </button>
            <button v-if="activeQuery" type="button" class="btn btn--ghost" @click="clear">Show all students</button>
        </div>
    </form>
</template>
