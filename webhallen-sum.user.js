/* eslint-disable strict */
/* eslint-disable max-len */
/* eslint-disable func-names */
/* eslint-disable no-console */
// ==UserScript==
// @name         Webhallen user stats
// @namespace    Webhallen
// @version      0.10
// @description  Generate a statistics button and present a wide variety of stats from the users account. Note: This is a proof of concept and could be highly unstable, use at your own risk!
// @author       Schanii, tsjost, and Furiiku
// @match        https://www.webhallen.com/se/member/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle('@import url("https://unpkg.com/charts.css/dist/charts.min.css");');

(function () {
    'use strict';

    let ME = null;
    const MONTH_NAMES = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Maj',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Okt',
        'Nov',
        'Dec',
    ];

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

    async function fetchAchievements(whId) {
        const data = await fetchAPI(`https://www.webhallen.com/api/user/${encodeURIComponent(whId)}/achievements`);
        return data;
    }

    async function fetchSupplyDrops() {
        const data = await fetchAPI('https://www.webhallen.com/api/supply-drop/');
        return data;
    }

    function getOrderDatesPerMonthWithSumKillstreak(orders) {
        const groupedData = Object.entries(orders.reduce((acc, { orderDate, sentDate, totalSum }) => {
            const dateOrdered = new Date(orderDate * 1000);
            const orderedYear = dateOrdered.getUTCFullYear();
            const orderedMonth = dateOrdered.getUTCMonth();

            const dateSent = new Date(sentDate * 1000);
            const sentYear = dateSent.getUTCFullYear();
            const sentMonth = dateSent.getUTCMonth();

            const sentKey = new Date(Date.UTC(sentYear, sentMonth)).getTime() / 1000;
            if (!acc[sentKey]) {
                acc[sentKey] = { totalSum };
            } else {
                acc[sentKey].totalSum += totalSum;
            }

            if (sentYear !== orderedYear || sentMonth !== orderedMonth) {
                const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000;
                if (!acc[orderKey]) {
                    acc[orderKey] = { totalSum };
                } else {
                    acc[orderKey].totalSum += totalSum;
                }
            }

            return acc;
        }, {})).map(([key, { totalSum }]) => ({
            sentDate: parseInt(key, 10),
            totalSum,
        }));

        const sortedGroupedData = groupedData.sort((a, b) => a.sentDate - b.sentDate);
        return sortedGroupedData;
    }

    function getOrderDatesPerMonthWithSum(orders) {
        const groupedData = Object.entries(orders.reduce((acc, { orderDate, totalSum }) => {
            const dateOrdered = new Date(orderDate * 1000);
            const orderedYear = dateOrdered.getUTCFullYear();
            const orderedMonth = dateOrdered.getUTCMonth();

            const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000;
            if (!acc[orderKey]) {
                acc[orderKey] = { totalOrders: 1, totalSum };
            } else {
                acc[orderKey].totalOrders += 1;
                acc[orderKey].totalSum += totalSum;
            }

            return acc;
        }, {})).map(([key, { totalOrders, totalSum }]) => ({
            orderDate: parseInt(key, 10),
            totalOrders,
            totalSum,
        }));

        const sortedGroupedData = groupedData.sort((a, b) => a.orderDate - b.orderDate);
        return sortedGroupedData;
    }

    function findCategoriesByPeriod(orders, beginDate = '1999-01-01', endDate = new Date()) {
        const catStartDate = Date.parse(beginDate);
        const catEndDate = Date.parse(endDate);

        const filteredOrders = orders.filter((order) => {
            const orderDate = new Date(order.orderDate * 1000);
            return orderDate >= catStartDate && orderDate <= catEndDate;
        });

        const unsortedCategories = {};
        filteredOrders.forEach((order) => {
            order.rows.forEach((item) => {
                const categories = item.product.categoryTree.split('/');
                const topLevel = categories[0];
                const subcategory = categories.length > 1 ? categories[1] : null;
                const categoryString = topLevel + (subcategory !== null ? `/${subcategory}` : '');

                unsortedCategories[categoryString] = (unsortedCategories[categoryString] || 0) + 1;
            });
        });

        const sortedKeys = Object.keys(unsortedCategories).sort();
        const sortedCategories = {};
        sortedKeys.forEach((key) => { sortedCategories[key] = unsortedCategories[key]; });

        return sortedCategories;
    }

    function findOrdersPerMonth(orders) {
        const monthCounts = {};
        (getOrderDatesPerMonthWithSum(orders)).forEach((period) => {
            const currentDate = new Date(period.orderDate * 1000);
            const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`;
            monthCounts[yearMonth] = { totalOrders: period.totalOrders, totalSum: period.totalSum };
        });

        return monthCounts;
    }

    function findStreaks(orders, minimumSum = 500) {
        const cheevoStartDate = Date.parse('2015-09-01');
        const sentDates = getOrderDatesPerMonthWithSumKillstreak(orders);

        const output = { streaks: [], longestStreak: 0, currentStreak: 0 };
        let previousDate = null;
        let lastYearMonth = null;
        let currentStreakStart = null;
        for (let i = 0; i < sentDates.length; i += 1) {
            const currentDate = new Date(sentDates[i].sentDate * 1000);
            const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`;

            // Only count streaks after Killstreak cheevo creation date
            // eslint-disable-next-line no-continue
            if (currentDate < cheevoStartDate) continue;

            if (previousDate === null) {
                previousDate = currentDate;
                lastYearMonth = yearMonth;
                currentStreakStart = yearMonth;
            } else {
                const m1 = previousDate.getUTCMonth();
                const m2 = currentDate.getUTCMonth();
                const isConsecutive = m2 - m1 === 1 || m2 - m1 === -11;

                if (sentDates[i].totalSum >= minimumSum) {
                    if (isConsecutive) {
                        output.currentStreak += 1;
                    } else {
                        if (output.currentStreak > 0) {
                            output.streaks.push({
                                start: currentStreakStart,
                                end: lastYearMonth,
                                months: output.currentStreak,
                            });
                        }
                        output.currentStreak = 0;
                        currentStreakStart = yearMonth;
                    }
                    lastYearMonth = yearMonth;
                    previousDate = currentDate;
                } else {
                    if (output.currentStreak > 0) {
                        output.streaks.push({
                            start: currentStreakStart,
                            end: lastYearMonth,
                            months: output.currentStreak,
                        });
                    }
                    output.currentStreak = 0;
                    currentStreakStart = yearMonth;
                }

                output.longestStreak = Math.max(output.longestStreak, output.currentStreak);
                lastYearMonth = yearMonth;
                previousDate = currentDate;
            }
        }
        if (output.currentStreak > 0) {
            output.streaks.push({
                start: currentStreakStart,
                end: lastYearMonth,
                months: output.currentStreak,
            });
        }

        return output;
    }

    function getExperienceStats(me, orders, achievements, supplyDrops) {
        const output = {
            purchases: 0, bonusXP: 0, achievements: 0, supplyDrops: 0, other: 0, total: 0,
        };

        orders.forEach((order) => {
            output.purchases += order.totalSum;

            if (order.userExperiencePointBoosts) {
                order.userExperiencePointBoosts.forEach((boost) => {
                    output.bonusXP += boost.experiencePoints;
                });
            }
        });

        const earnedAchievements = achievements.achievements.filter(
            (item) => item.achievedPercentage >= 1,
        );
        earnedAchievements.forEach((achievement) => {
            output.achievements += achievement.experiencePoints;
        });

        supplyDrops.drops.forEach((drop) => {
            const xpValue = parseInt(drop.item.description.replace('XP', '').trim(), 10);
            if (Number.isNaN(xpValue)) return;

            output.supplyDrops += xpValue * drop.count;
        });

        output.total = output.purchases + output.bonusXP + output.achievements + output.supplyDrops;
        if (output.total < me.experiencePoints) {
            output.other = me.experiencePoints - output.total;
            output.total += output.other;
        }

        output.purchases = parseInt(output.purchases, 10).toLocaleString('sv');
        output.bonusXP = parseInt(output.bonusXP, 10).toLocaleString('sv');
        output.achievements = parseInt(output.achievements, 10).toLocaleString('sv');
        output.supplyDrops = parseInt(output.supplyDrops, 10).toLocaleString('sv');
        output.other = output.other.toLocaleString('sv');
        output.total = output.total.toLocaleString('sv');

        return output;
    }

    function getStoreStats(orders) {
        const storePurchases = orders.reduce((stores, order) => {
            let storeName = order.store?.name;
            if (storeName === undefined) {
                storeName = order.shippingMethod.name;
            }
            stores[storeName] = (stores[storeName] || 0) + 1;
            return stores;
        }, {});

        const stores = new Map();
        Object
            .entries(storePurchases)
            .sort((a, b) => b[1] - a[1])
            .forEach(([store, purchases]) => { stores.set(store, purchases); });

        const values = Array.from(stores.values());
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);

        for (const [store, purchases] of stores) {
            const normalizedValue = 0.1 + 0.9 * ((purchases - minValue) / (maxValue - minValue));
            stores.set(store, { purchases, normalizedValue });
        }

        return new Map([...stores.entries()].sort((a, b) => a[1].normalizedValue - b[1].normalizedValue));
    }

    function findTopHoarderCheevoStats(orders, count = 10) {
        const itemCount = {};
        orders.forEach((order) => {
            order.rows.forEach((item) => {
                const { id } = item.product;

                if (!itemCount[id]) {
                    itemCount[id] = { id, name: item.product.name, bought: 1 };
                } else {
                    itemCount[id].bought += item.quantity;
                }
            });
        });

        const dataArray = Object.values(itemCount);
        const filteredArray = dataArray.filter((product) => product.bought > 1);
        filteredArray.sort((a, b) => b.bought - a.bought);

        return filteredArray.slice(0, count);
    }

    function sortTable(table, columnIndex, headers, headerRow) {
        let rows;
        let switching;
        let i;
        let x;
        let y;
        let shouldSwitch;
        let dir;
        let switchcount = 0;
        switching = true;
        dir = 'asc'; // Default sorting direction

        while (switching) {
            switching = false;
            rows = table.querySelector('tbody').rows;

            for (i = 0; i < rows.length - 1; i += 1) {
                shouldSwitch = false;
                x = rows[i].getElementsByTagName('td')[columnIndex];
                y = rows[i + 1].getElementsByTagName('td')[columnIndex];

                const xContent = x.textContent.toLowerCase();
                const yContent = y.textContent.toLowerCase();

                // Check if sorting is for string or number
                if (columnIndex === 0) {
                    shouldSwitch = dir === 'asc' ? xContent > yContent : xContent < yContent;
                } else if (columnIndex === 1) {
                    shouldSwitch = dir === 'asc'
                        ? parseInt(xContent, 10) > parseInt(yContent, 10)
                        : parseInt(xContent, 10) < parseInt(yContent, 10);
                } else if (columnIndex === 2) {
                    shouldSwitch = dir === 'asc'
                        ? parseInt(xContent, 10) > parseInt(yContent, 10)
                        : parseInt(xContent, 10) < parseInt(yContent, 10);
                }

                if (shouldSwitch) {
                    rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                    switching = true;
                    switchcount += 1;
                }
            }

            // Toggle the sorting direction if a switch occurred
            if (switchcount === 0 && dir === 'asc') {
                dir = 'desc';
                switching = true;
            }
        }

        // Update header text with arrow indicator
        const arrow = dir === 'asc' ? '▲' : '▼';
        headerRow.childNodes.forEach((header, index) => {
            const arrowIndicator = index === columnIndex ? arrow : '';
            // eslint-disable-next-line no-param-reassign
            header.textContent = headers[index] + arrowIndicator;
        });
    }

    function addSortingFunctionality(table, headers) {
        const thead = table.querySelector('thead');
        const headerRow = thead.querySelector('tr');

        headerRow.childNodes.forEach((header, index) => {
            header.addEventListener('click', () => {
                sortTable(table, index, headers, headerRow);
            });
        });
    }

    function generateMonthsTable(jsonData) {
        const table = document.createElement('table');
        table.className = 'table table-condensed table-striped tech-specs-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['År Månad', 'Totalt antal ordrar', 'Total summa'];
        let finalSum = 0;
        let finalOrders = 0;

        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        Object.entries(jsonData).forEach(([month, data]) => {
            const row = document.createElement('tr');

            const cell1 = document.createElement('td');
            const cell2 = document.createElement('td');
            const cell3 = document.createElement('td');

            cell1.textContent = month;
            cell2.textContent = data.totalOrders;
            cell3.textContent = data.totalSum;

            finalOrders += data.totalOrders;
            finalSum += data.totalSum;

            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);

            tbody.appendChild(row);
        });

        const footer = document.createElement('tfoot');
        const finalRow = document.createElement('tr');
        const cell1 = document.createElement('td');
        const cell2 = document.createElement('td');
        const cell3 = document.createElement('td');

        cell1.innerHTML = '<strong>Totalt</strong>';
        cell2.innerHTML = `<strong>${finalOrders}</strong>`;
        cell3.innerHTML = `<strong>${finalSum}</strong>`;

        finalRow.appendChild(cell1);
        finalRow.appendChild(cell2);
        finalRow.appendChild(cell3);
        footer.appendChild(finalRow);

        table.appendChild(tbody);
        table.appendChild(footer);

        addSortingFunctionality(table, headers);

        return table;
    }

    function generateStreaksTable(jsonData) {
        const div = document.createElement('div');

        const table1 = document.createElement('table');
        table1.className = 'table table-condensed table-striped tech-specs-table';

        const thead1 = document.createElement('thead');
        const headerRow1 = document.createElement('tr');
        const headers1 = ['Längsta streak', 'Nuvarande streak'];

        headers1.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow1.appendChild(th);
        });

        thead1.appendChild(headerRow1);
        table1.appendChild(thead1);

        const tbody1 = document.createElement('tbody');
        const row1 = document.createElement('tr');
        const table1Cell1 = document.createElement('td');
        const table1Cell2 = document.createElement('td');

        table1Cell1.textContent = jsonData.longestStreak;
        table1Cell2.textContent = jsonData.currentStreak;

        row1.appendChild(table1Cell1);
        row1.appendChild(table1Cell2);

        tbody1.appendChild(row1);
        table1.appendChild(tbody1);

        /* --- */

        const table2 = document.createElement('table');
        table2.className = 'table table-condensed table-striped tech-specs-table';

        const thead2 = document.createElement('thead');
        const headerRow2 = document.createElement('tr');
        const headers2 = ['Streak började', 'Streak slutade', 'Antal månader'];

        headers2.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow2.appendChild(th);
        });

        thead2.appendChild(headerRow2);
        table2.appendChild(thead2);

        const tbody2 = document.createElement('tbody');

        jsonData.streaks.forEach((streak) => {
            const row2 = document.createElement('tr');
            const table2Cell1 = document.createElement('td');
            const table2Cell2 = document.createElement('td');
            const table2Cell3 = document.createElement('td');

            table2Cell1.textContent = streak.start;
            table2Cell2.textContent = streak.end;
            table2Cell3.textContent = streak.months;

            row2.appendChild(table2Cell1);
            row2.appendChild(table2Cell2);
            row2.appendChild(table2Cell3);

            tbody2.appendChild(row2);
        });

        table2.appendChild(tbody2);

        div.appendChild(table1);
        div.appendChild(table2);

        return div;
    }

    function generateCategoriesTable(jsonData) {
        const table = document.createElement('table');
        table.className = 'table table-condensed table-striped tech-specs-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Kategori', 'Antal produkter'];

        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        Object.entries(jsonData).forEach(([category, data]) => {
            const row = document.createElement('tr');

            const cell1 = document.createElement('td');
            const cell2 = document.createElement('td');

            cell1.textContent = category;
            cell2.textContent = data;

            row.appendChild(cell1);
            row.appendChild(cell2);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        addSortingFunctionality(table, headers);

        return table;
    }

    function generateHoarderTable(jsonData) {
        const table = document.createElement('table');
        table.className = 'table table-condensed table-striped tech-specs-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Produkt', 'Antal köpta'];

        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        jsonData.forEach((product) => {
            const row = document.createElement('tr');
            const cell1 = document.createElement('td');
            const cell2 = document.createElement('td');

            const link = document.createElement('a');
            link.href = `https://www.webhallen.com/${product.id}`;
            link.appendChild(document.createTextNode(`[${product.id}] ${product.name}`));

            cell1.appendChild(link);
            cell2.textContent = product.bought;

            row.appendChild(cell1);
            row.appendChild(cell2);

            tbody.appendChild(row);
        });

        table.appendChild(tbody);

        return table;
    }

    function generateExperienceTable(jsonData) {
        const table = document.createElement('table');
        table.className = 'table table-condensed table-striped tech-specs-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const headers = ['Köp XP', 'Bonus XP', 'Cheevo XP', 'Supply drop XP', 'Övriga XP', 'Totalt'];

        headers.forEach((header) => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        const row = document.createElement('tr');
        const cell1 = document.createElement('td');
        const cell2 = document.createElement('td');
        const cell3 = document.createElement('td');
        const cell4 = document.createElement('td');
        const cell5 = document.createElement('td');
        const cell6 = document.createElement('td');

        cell1.textContent = jsonData.purchases;
        cell2.textContent = jsonData.bonusXP;
        cell3.textContent = jsonData.achievements;
        cell4.textContent = jsonData.supplyDrops;
        cell5.textContent = jsonData.other;
        cell6.textContent = jsonData.total;

        row.appendChild(cell1);
        row.appendChild(cell2);
        row.appendChild(cell3);
        row.appendChild(cell4);
        row.appendChild(cell5);
        row.appendChild(cell6);

        tbody.appendChild(row);

        table.appendChild(tbody);

        return table;
    }

    function generateStoresChart(orders) {
        const div = document.createElement('div');
        div.setAttribute('id', 'stores-chart');
        div.style.width = '100%';
        div.style.maxWidth = '900px';
        div.style.margin = '0 auto';
        div.style.display = 'flex';
        div.style.flexDirection = 'row';
        div.style.gap = '40px';

        const table = document.createElement('table');
        table.className = 'table table-condensed charts-css pie hide-data show-primary-axis';

        const thead = document.createElement('thead');
        const theadtr = document.createElement('tr');
        const thStore = document.createElement('th');
        thStore.scope = 'col';
        const thCount = document.createElement('th');
        thCount.scope = 'col';

        theadtr.appendChild(thStore);
        theadtr.appendChild(thCount);
        thead.appendChild(theadtr);

        const tbody = document.createElement('tbody');
        const ul = document.createElement('ul');
        ul.className = 'charts-css legend legend-square';

        let prev = 0;
        const legendArr = [];
        orders.forEach((value, store) => {
            console.log(`${store}: Purchases = ${value.purchases}, Normalized Value = ${value.normalizedValue}`);
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.scope = 'col';
            th.textContent = store;

            const td = document.createElement('td');
            td.style = `--start: ${prev}; --end: ${value.normalizedValue};`;
            prev = value.normalizedValue;

            const span = document.createElement('span');
            span.className = 'data';
            span.textContent = value.purchases;

            td.appendChild(span);

            tr.appendChild(th);
            tr.appendChild(td);
            tbody.appendChild(tr);

            legendArr.push(`${store}: ${value.purchases}`);
        });

        legendArr.reverse().forEach((element) => {
            const li = document.createElement('li');
            li.textContent = element;
            ul.appendChild(li);
        });

        table.appendChild(thead);
        table.appendChild(tbody);

        div.appendChild(table);
        div.appendChild(ul);

        return div;
    }

    function addDataToDiv(headerText, domObject) {
        const div = document.createElement('div');
        div.className = 'order my-4';

        const table = document.createElement('table');
        table.className = 'table table-condensed';

        const tbody = document.createElement('tbody');

        const tr = document.createElement('tr');
        tr.className = 'order-id-wrap';

        const td = document.createElement('td');
        td.textContent = headerText;

        tr.appendChild(td);
        tbody.appendChild(tr);
        table.appendChild(tbody);
        div.appendChild(table);

        const div1 = document.createElement('div');
        const div2 = document.createElement('div');
        const orderProgression = document.createElement('div');
        const innerContainer = document.createElement('div');
        const orderStatusEvent = document.createElement('div');
        const icon = document.createElement('div');
        const header = document.createElement('h3');
        const secondary = document.createElement('div');

        div1.appendChild(div2);
        div2.appendChild(orderProgression);
        orderProgression.appendChild(innerContainer);
        innerContainer.appendChild(orderStatusEvent);
        orderStatusEvent.appendChild(icon);
        orderStatusEvent.appendChild(header);
        orderStatusEvent.appendChild(secondary);
        secondary.appendChild(domObject);

        header.className = 'level-two-heading';
        icon.className = 'icon';

        header.textContent = '';

        div.appendChild(div1);

        return div;
    }

    function findInjectPath(paths) {
        let dom = null;
        paths.forEach((path) => {
            const d = document.querySelector(path);
            if (d) {
                dom = d;
            }
        });

        return dom;
    }

    async function clearAndAddStatistics(event) {
        event.preventDefault();
        const clickedLink = event.target;

        const allLinks = document.querySelectorAll('.router-link-exact-active.router-link-active');
        allLinks.forEach((link) => {
            link.classList.remove('router-link-exact-active', 'router-link-active');
        });

        clickedLink.classList.add('router-link-exact-active', 'router-link-active');

        const content = `
      <h2 class="level-one-heading mb-5">Min statistik</h2><hr>
      <div class="mb-5">Här hittar du statistik om din aktivitet på webhallen.</div>
      `;

        const paths = ['section',
            'div.member-subpage',
            'div.container'];
        const injectPath = findInjectPath(paths);
        injectPath.innerHTML = content;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', 'https://cdn.webhallen.com/img/loading_light.svg');
        svg.appendChild(image);

        injectPath.appendChild(svg);

        const orders = await fetchOrders(ME.id);
        const supplyDrops = await fetchSupplyDrops(ME.id);
        const achievements = await fetchAchievements(ME.id);

        injectPath.innerHTML = content;

        if (orders) {
            const experience = getExperienceStats(ME, orders, achievements, supplyDrops);
            if (experience) {
                injectPath.appendChild(addDataToDiv('Experience', generateExperienceTable(experience)));
            }

            const stores = getStoreStats(orders);
            if (stores) {
                injectPath.appendChild(addDataToDiv('Stores', generateStoresChart(stores)));
            }

            const streaks = findStreaks(orders);
            if (streaks) {
                injectPath.appendChild(addDataToDiv('Streaks', generateStreaksTable(streaks)));
            }

            const hoarder = findTopHoarderCheevoStats(orders, 10);
            if (hoarder) {
                injectPath.appendChild(addDataToDiv('Hoarder Top 10', generateHoarderTable(hoarder)));
            }

            const categories = findCategoriesByPeriod(orders);
            if (categories) {
                injectPath.appendChild(addDataToDiv('Kategorier', generateCategoriesTable(categories)));
            }

            const orderMonths = findOrdersPerMonth(orders);
            if (orderMonths) {
                injectPath.appendChild(addDataToDiv('Ordrar per månad', generateMonthsTable(orderMonths)));
            }
        }
    }

    function addLink() {
        clearInterval(timerId);
        const ul = document.querySelector('.member-nav .desktop-wrap .nav');

        if (ul) {
            const li = document.createElement('li');
            li.className = 'tile';
            const link = document.createElement('a');
            link.href = '#';

            const image = document.createElement('img');
            image.src = '//cdn.webhallen.com/img/icons/member/topplistor.svg';
            image.className = 'member-icon';
            image.alt = 'Statistik';

            link.appendChild(image);
            link.appendChild(document.createTextNode('Statistik'));
            link.addEventListener('click', clearAndAddStatistics);
            li.appendChild(link);
            ul.appendChild(li);
        } else {
            console.error('UL element not found using XPath.');
        }
    }

    async function main() {
        ME = await fetchMe();
        if (!ME) return;

        addLink();
    }

    let timerId = setInterval(main, 1000);
}());
