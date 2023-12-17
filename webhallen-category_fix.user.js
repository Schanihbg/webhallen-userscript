/* eslint-disable strict */
/* eslint-disable max-len */
/* eslint-disable func-names */
/* eslint-disable no-console */
// ==UserScript==
// @name         Webhallen fix category
// @namespace    Webhallen
// @version      0.1
// @description  Displays the correct category tree for a product
// @author       Furiiku
// @match        https://www.webhallen.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentURL = "";

    function checkURLChange() {
        if (currentURL !== window.location.href) {
            console.log('URL has changed:', window.location.href);
            currentURL = window.location.href;
            main();
        }
        setTimeout(checkURLChange, 1000);
    }

    async function fetchAPI(uri, params = null) {
        console.log(`Getting url ${uri}`);
        let resp;
        const url = new URL(uri);
        if (params) {
            Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
        }

        await fetch(url.toString())
            .then((response) => response.json())
            .then((data) => {
                resp = data;
            })
            .catch((err) => {
                console.warn('Something went wrong.', err);
            });
        console.log('callURL resp', resp);
        return resp;
    }

    async function fetchProduct(productId) {
        return await fetchAPI(`https://www.webhallen.com/api/product/${productId}`);
    }

    async function main() {
        const breadcrumb = document.querySelector('.bread-crumbs');
        if (breadcrumb) {
            const old = document.querySelector('.real-category');
            if (old) {
                old.remove();
            }
        }

        if (!(window.location.toString().match('.*/se/product/.*'))) {
            return;
        }
        console.log('Found product page');

        const productId = (currentURL.match('/([0-9]{1,6}).*$'))[1];
        const productCategory = (await fetchProduct(productId)).product.categoryTree;
        const split = productCategory.toString().split('/');

        const div = document.createElement('div');
        div.setAttribute('class', 'real-category');

        const span = document.createElement('span');
        span.textContent = 'RIKTIG KATEGORI';
        span.style.cssText = 'color: #d50855; font-weight: 600; display: inline-block; padding-right: 10px;';

        const ol = document.createElement('ol');
        ol.setAttribute('class', 'breadcrumb');
        ol.style.cssText = 'display:inline-block;';
        split.forEach((i) => {
            const li = document.createElement('li');
            li.textContent = i;
            ol.appendChild(li);
        });

        div.appendChild(span);
        div.appendChild(ol);
        breadcrumb.appendChild(div);
    }

    checkURLChange();
}());
