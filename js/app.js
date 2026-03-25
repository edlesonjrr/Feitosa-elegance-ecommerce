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

    if (typeof THREE !== 'undefined') {
        initAbout3D();
    } else {
        window.addEventListener('threejs-ready', () => {
            initAbout3D();
        });
    }

    initHero3D();
});