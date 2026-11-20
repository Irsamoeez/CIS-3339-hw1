import { createRouter, createWebHistory } from 'vue-router';
import StudentsView from '@/views/StudentsView.vue';
import NotFoundView from '@/views/NotFoundView.vue';

const routes = [
    { path: '/', redirect: { name: 'students' } },
    { path: '/students', name: 'students', component: StudentsView, meta: { title: 'Students' } },
    { path: '/courses', name: 'courses', component: () => import('@/views/CoursesView.vue'), meta: { title: 'Courses' } },
    {
        path: '/enrollments',
        name: 'enrollments',
        component: () => import('@/views/EnrollmentsView.vue'),
        meta: { title: 'Enrollments' },
    },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Page not found' } },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    linkActiveClass: 'is-active',
    scrollBehavior: () => ({ top: 0 }),
});

router.afterEach((to) => {
    document.title = `${to.meta.title ?? 'Home'} · Student Management System`;
});

export default router;
