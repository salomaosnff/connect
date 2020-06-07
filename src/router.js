import Vue from 'vue'
import Router from 'vue-router'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export const router = new Router({
    mode: 'history',
    routes: [
        { name: 'index', path: '/', redirect: '/connect/1' },
        { name: 'call', path: '/connect/:id', component: () => import('./views/Call.vue') }
    ]
})