<script setup>
const links = [
    { to: { name: 'students' }, label: 'Students' },
    { to: { name: 'courses' }, label: 'Courses' },
    { to: { name: 'enrollments' }, label: 'Enrollments' },
];
</script>

<template>
    <header class="app-header">
        <div class="container app-header__inner">
            <RouterLink :to="{ name: 'students' }" class="brand">
                <span class="brand__mark" aria-hidden="true">SMS</span>
                <span class="brand__text">Student Management</span>
            </RouterLink>
            <nav aria-label="Main navigation">
                <ul class="nav">
                    <li v-for="link in links" :key="link.label">
                        <RouterLink :to="link.to" class="nav__link">{{ link.label }}</RouterLink>
                    </li>
                </ul>
            </nav>
        </div>
    </header>
</template>
