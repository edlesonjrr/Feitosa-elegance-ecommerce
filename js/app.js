/* app.js — Entry point */
import { initCart } from './cart.js';
import { initCheckout } from './checkout.js';
import { initLoja } from './loja.js';
import { initNavbar, initHero3D, initAbout3D, initLazyLoad, initScrollReveal, initFilterBarElevation, initCounters, initDepoimentos } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initCart();
    initCheckout();
    initLoja();
    initLazyLoad();
    initScrollReveal();
    initFilterBarElevation();
    initCounters();
    initDepoimentos();

    // Three.js — apenas seção Sobre
    if (typeof THREE !== 'undefined') {
        initAbout3D();
    } else {
        window.addEventListener('threejs-ready', () => {
            initAbout3D();
        });
    }

    // Hero canvas (2D, sem Three.js)
    initHero3D();
});