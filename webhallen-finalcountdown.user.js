/* eslint-disable strict */
/* eslint-disable max-len */
/* eslint-disable func-names */
/* eslint-disable no-console */
// ==UserScript==
// @name         Webhallen [Final Countdown]
// @namespace    Webhallen
// @version      0.2
// @description  Check what days a user is missing for Final Countdown cheevo
// @author       Furiiku
// @match        https://www.webhallen.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let currentURL = '';

    async function fetchAPI(uri, params = null) {
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

    function filterJson(jsonObject, keysToInclude) {
        const filtered = Object.keys(jsonObject).reduce((acc, key) => {
            if (keysToInclude.includes(key)) {
                acc[key] = jsonObject[key];
            }
            return acc;
        }, {});
        return filtered;
    }

    async function fetchMe() {
        const data = await fetchAPI('https://www.webhallen.com/api/me');
        const filteredData = filterJson(data.user, ['id', 'experiencePoints']);
        return filteredData;
    }

    async function fetchOrders(whId) {
        let page = 1;
        const orders = [];

        for (;;) {
            const params = { page };
            // eslint-disable-next-line no-await-in-loop
            const data = await fetchAPI(`https://www.webhallen.com/api/order/user/${encodeURIComponent(whId)}?filters[history]=true&sort=orderStatus`, params);
            if (data.orders.length === 0) break;
            orders.push(...data.orders.map((order) => order));
            page += 1;
        }

        return orders;
    }

    function dateWithinRange(inputDate) {
        const startDate = new Date('2022-12-24');
        return inputDate >= startDate && inputDate.getMonth() === 11 && inputDate.getDate() >= 25 && inputDate.getDate() <= 31;
    }

    async function checkCheevos() {
        const me = await fetchMe();
        const orders = await fetchOrders(me.id);

        const dateCount = {
            '25/12': 0,
            '26/12': 0,
            '27/12': 0,
            '28/12': 0,
            '29/12': 0,
            '30/12': 0,
            '31/12': 0,
        };
        orders.forEach((order) => {
            const orderDate = new Date(order.orderDate * 1000);

            if (dateWithinRange(orderDate)) {
                console.log(`${order.id} beställdes på datum ${orderDate.toString()}`);
                const month = orderDate.getMonth() + 1;
                const day = orderDate.getDate();
                const dateKey = `${day}/${month < 10 ? '0' : ''}${month}`;
                if (Object.prototype.hasOwnProperty.call(dateCount, dateKey)) {
                    dateCount[dateKey] += 1;
                } else {
                    console.log(`${dateKey} ${order.orderDate}`);
                }
            }
        });
        console.log(dateCount);
    }

    function createButton() {
        const node = document.querySelector('.achievements-sub-header');
        const cheevoNode = document.querySelector('.check-cheevos');
        if (node && !cheevoNode) {
            const div = document.createElement('div');
            div.classList = ('toggle-wrapper', 'check-cheevos');
            div.style = 'padding-left: 5px;';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'achievement-update-modal-button';
            button.addEventListener('click', checkCheevos);

            const icon = document.createElement('img');
            icon.src = '//cdn.webhallen.com/img/icons/check.svg';
            icon.className = 'achievement-update-modal-button-icon';

            button.appendChild(icon);
            div.appendChild(button);
            node.appendChild(div);
        }
    }

    function main() {
        if (!currentURL.match('https://www.webhallen.com/se/member/.*/achievements')) {
            return null;
        }

        createButton();
    }

    function checkURLChange() {
        if (currentURL !== window.location.href) {
            currentURL = window.location.href;
            main();
        }
        setTimeout(checkURLChange, 1000);
    }

    checkURLChange();
}());
