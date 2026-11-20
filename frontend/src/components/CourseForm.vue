<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import FormField from './FormField.vue';
import AlertMessage from './AlertMessage.vue';
import { useCourseStore } from '@/stores/courses';
import { useNotificationStore } from '@/stores/notifications';
import { validateCourse } from '@/utils/validation';

const courseStore = useCourseStore();
const notifications = useNotificationStore();

const emptyForm = () => ({ courseId: '', courseName: '' });

const formRef = ref(null);
const form = reactive(emptyForm());
const touched = reactive({});
const submitted = ref(false);
const submitting = ref(false);
const serverErrors = ref({});
const formError = ref('');

const clientErrors = computed(() => validateCourse(form));
const isValid = computed(() => Object.keys(clientErrors.value).length === 0);

const errors = computed(() => {
    const result = {};
    for (const field of Object.keys(form)) {
        const showClient = submitted.value || touched[field];
        result[field] = serverErrors.value[field] || (showClient ? clientErrors.value[field] : '') || '';
    }
    return result;
});

watch(form, () => {
    serverErrors.value = {};
    formError.value = '';
});

function resetForm() {
    Object.assign(form, emptyForm());
    for (const key of Object.keys(touched)) delete touched[key];
    submitted.value = false;
    serverErrors.value = {};
    formError.value = '';
}

async function focusFirstError() {
    await nextTick();
    formRef.value?.querySelector('[aria-invalid="true"]')?.focus();
}

async function handleSubmit() {
    submitted.value = true;
    if (!isValid.value) {
        focusFirstError();
        return;
    }

    submitting.value = true;
    try {
        const course = await courseStore.addCourse({
            courseId: form.courseId.trim(),
            courseName: form.courseName.trim(),
        });
        notifications.success(`Added course ${course.courseId} – ${course.courseName}.`);
        resetForm();
    } catch (err) {
        formError.value = err.message;
        serverErrors.value = err.details ?? {};
        focusFirstError();
    } finally {
        submitting.value = false;
    }
}
</script>

<template>
    <form ref="formRef" class="form" novalidate @submit.prevent="handleSubmit">
        <AlertMessage v-if="formError" :message="formError" />

        <FormField
            id="course-id"
            v-model="form.courseId"
            label="Course ID"
            placeholder="CIS 3339"
            autocomplete="off"
            hint="Saved in uppercase, e.g. cis 3339 → CIS 3339."
            required
            :error="errors.courseId"
            @blur="touched.courseId = true"
        />
        <FormField
            id="course-name"
            v-model="form.courseName"
            label="Course name"
            placeholder="Enterprise Applications Development"
            autocomplete="off"
            required
            :error="errors.courseName"
            @blur="touched.courseName = true"
        />

        <p class="form__note"><span aria-hidden="true">*</span> Required field</p>
        <div class="form__actions">
            <button type="submit" class="btn btn--primary" :disabled="submitting">
                {{ submitting ? 'Adding…' : 'Add course' }}
            </button>
            <button type="button" class="btn btn--ghost" :disabled="submitting" @click="resetForm">Clear</button>
        </div>
    </form>
</template>
