// ==UserScript==
// @name         Webhallen user stats
// @namespace    Webhallen
// @version      0.1
// @description  Generate a statistics button and present a wide variety of stats from the users account. Note: This is a proof of concept and could be highly unstable, use at your own risk!
// @author       Schanii, tsjost, and Furiiku
// @match        https://www.webhallen.com/se/member/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  var ME = null;
  var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];

  async function fetchAPI(uri, params = null) {
      let resp;
      const url = new URL(uri);
      if (params) {
          Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      }

      await fetch(url.toString())
          .then((response) => {
          // The API call was successful!
          return response.json();
      })
          .then((data) => {
          // This is the JSON from our response
          resp = data;
      })
          .catch((err) => {
          // There was an error
          console.warn("Something went wrong.", err);
      });
      console.log("callURL resp", resp);
      return resp;
  }

  async function fetchMe() {
      const data = await fetchAPI('https://www.webhallen.com/api/me');
      return data;
  }

  async function fetchOrders(whId) {
      let page = 1;
      let orders = [];

      while (true) {
          const params = { page: page };
          const data = await fetchAPI(`https://www.webhallen.com/api/order/user/${encodeURIComponent(whId)}?filters[history]=true&sort=orderStatus`, params);
          if (data.orders.length === 0) break;
          orders.push(...data.orders.map(order => order));
          page++;
      }

      return orders;
  }

  async function fetchAchievements(whId) {
      const data = await fetchAPI(`https://www.webhallen.com/api/user/${encodeURIComponent(whId)}/achievements`);
      return data;
  }

  async function fetchSupplyDrops() {
      const data = await fetchAPI(`https://www.webhallen.com/api/supply-drop/`);
      return data;
  }

  function isLastDayOfMonth(date) {
      const clonedDate = new Date(date);
      clonedDate.setMonth(clonedDate.getMonth() + 1);
      clonedDate.setDate(0);
      return date.getDate() === clonedDate.getDate();
  }

  function isNextCalendarMonth(date1, date2) {
      const year1 = date1.getFullYear();
      const year2 = date2.getFullYear();
      if (year1 !== year2) {
          return false;
      }

      const month1 = date1.getMonth();
      const month2 = date2.getMonth();
      if ((month1 + 1) % 12 === month2) {
          return true;
      }

      return false;
  }

  function getOrderDatesPerMonthWithSumKillstreak(orders) {
      const groupedData = Object.entries(orders.reduce((acc, { orderDate, sentDate, totalSum }) => {
          const dateOrdered = new Date(orderDate * 1000);
          const orderedYear = dateOrdered.getUTCFullYear();
          const orderedMonth = dateOrdered.getUTCMonth();

          const dateSent = new Date(sentDate * 1000);
          const sentYear = dateSent.getUTCFullYear();
          const sentMonth = dateSent.getUTCMonth();


          const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000;
          if (!acc[orderKey]) {
              acc[orderKey] = { totalSum: totalSum };
          } else {
              acc[orderKey].totalSum += totalSum;
          }

          if (isLastDayOfMonth(dateOrdered) && isNextCalendarMonth(dateOrdered, dateSent) ) {
              const sentKey = new Date(Date.UTC(sentYear, sentMonth)).getTime() / 1000;
              if (!acc[sentKey]) {
                  acc[sentKey] = { totalSum: totalSum };
              } else {
                  acc[sentKey].totalSum += totalSum;
              }
          }

          return acc;
      }, {})).map(([key, { totalSum }]) => ({
          orderDate: parseInt(key, 10),
          totalSum,
      }));

      const sortedGroupedData = groupedData.sort((a, b) => a.orderDate - b.orderDate);
      return sortedGroupedData;
  }

  function getOrderDatesPerMonthWithSum(orders) {
      const groupedData = Object.entries(orders.reduce((acc, { orderDate, sentDate, totalSum }) => {
          const dateOrdered = new Date(orderDate * 1000);
          const orderedYear = dateOrdered.getUTCFullYear();
          const orderedMonth = dateOrdered.getUTCMonth();

          const orderKey = new Date(Date.UTC(orderedYear, orderedMonth)).getTime() / 1000;
          if (!acc[orderKey]) {
              acc[orderKey] = { totalOrders: 1, totalSum: totalSum };
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

  function findCategoriesByPeriod(orders, beginDate = "1999-01-01", endDate = new Date()) {
      const catStartDate = Date.parse(beginDate);
      const catEndDate = Date.parse(endDate);

      const filteredOrders = orders.filter(order => {
          const orderDate = new Date(order.orderDate * 1000);
          return orderDate >= catStartDate && orderDate <= catEndDate;
      });

      let unsortedCategories = {};
      filteredOrders.forEach(order => {order.rows.forEach(item => { unsortedCategories[item.product.categoryTree] = (unsortedCategories[item.product.categoryTree] || 0) + 1})});

      const sortedKeys = Object.keys(unsortedCategories).sort();
      const sortedCategories = {};
      sortedKeys.forEach(key => { sortedCategories[key] = unsortedCategories[key]; });

      return sortedCategories;
  }

  function findOrdersPerMonth(orders) {
      let monthCounts = {};
      (getOrderDatesPerMonthWithSum(orders)).forEach(period => {
          const currentDate = new Date(period.orderDate * 1000)
          const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`;
          monthCounts[yearMonth] = {totalOrders: period.totalOrders, totalSum: period.totalSum};
      });

      return monthCounts;
  }

  function findStreaks(orders, minimumSum = 500) {
      const cheevoStartDate = Date.parse("2015-09-01");
      const orderDates = getOrderDatesPerMonthWithSumKillstreak(orders);

      let output = { streaks: [], longestStreak: 0, currentStreak: 1 }
      let previousDate = null;
      let lastYearMonth = null;
      let currentStreakStart = null;
      for (let i = 0; i < orderDates.length; i++) {
          const currentDate = new Date(orderDates[i].orderDate * 1000);
          const yearMonth = `${currentDate.getUTCFullYear()} ${MONTH_NAMES[currentDate.getUTCMonth()]}`;

          // Only count streaks after Killstreak cheevo creation date and minimum total sum
          if (currentDate < cheevoStartDate || orderDates[i].totalSum < minimumSum) continue;

          if (previousDate === null) {
              previousDate = currentDate;
              lastYearMonth = yearMonth;
              currentStreakStart = yearMonth;
              output.currentStreak = 1;
          } else {
              const m1 = previousDate.getMonth();
              const m2 = currentDate.getMonth();
              const isConsecutive = m2 - m1 === 1 || m2 - m1 === -11;

              if (previousDate.getMonth() !== currentDate.getMonth() && !isConsecutive) {
                  output.streaks.push({start: currentStreakStart, end: lastYearMonth, months: output.currentStreak});
                  output.currentStreak = 1;
                  currentStreakStart = yearMonth;
              } else if (previousDate.getMonth() !== currentDate.getMonth()) {
                  output.currentStreak++;
              }
              output.longestStreak = Math.max(output.longestStreak, output.currentStreak);
              lastYearMonth = yearMonth;
              previousDate = currentDate;
          }
      }
      output.streaks.push({start: currentStreakStart, end: lastYearMonth, months: output.currentStreak});

      return output;
  }

  function getExperienceStats(me, orders, achievements, supplyDrops) {
      let output = { 'purchases': 0, 'bonusXP': 0, 'achievements': 0, 'supplyDrops': 0, 'other': 0, 'total': 0 }

      orders.forEach(order => {
          output.purchases += order.totalSum;

          if (order.userExperiencePointBoosts) {
              order.userExperiencePointBoosts.forEach(boost => {
                  output.bonusXP += boost.experiencePoints;
              });
          }
      });

      const earnedAchievements = achievements.achievements.filter(item => item.achievedPercentage >= 1);
      earnedAchievements.forEach(achievement => { output.achievements += achievement.experiencePoints });

      supplyDrops.drops.forEach(drop => {
          const xpValue = parseInt(drop.item.description.replace("XP", "").trim());
          if (isNaN(xpValue)) return;

          output.supplyDrops += xpValue * drop.count;
      });

      output.total = output.purchases + output.bonusXP + output.achievements + output.supplyDrops;
      if (output.total < me.user.experiencePoints) {
          output.other = me.user.experiencePoints - output.total;
          output.total += output.other;
      }

      output.purchases = parseInt(output.purchases).toLocaleString('sv');
      output.bonusXP = parseInt(output.bonusXP).toLocaleString('sv');
      output.achievements = parseInt(output.achievements).toLocaleString('sv');
      output.supplyDrops = parseInt(output.supplyDrops).toLocaleString('sv');
      output.other = output.other.toLocaleString('sv');
      output.total = output.total.toLocaleString('sv');

      return output;
  }

  function findTopHoarderCheevoStats(orders, count = 10) {
      let itemCount = {}
      orders.forEach(order => { order.rows.forEach(item => {
          const id = item.product.id;

          if (!itemCount[id]) {
              itemCount[id] = { name: item.product.name, bought: 1 };
          } else {
              itemCount[id].bought += item.quantity;
          }
      })});

      const dataArray = Object.values(itemCount);
      const filteredArray = dataArray.filter(product => product.bought > 1);
      filteredArray.sort((a, b) => b.bought - a.bought);

      return filteredArray.slice(0, count);
  }

  function generateMonthsTable(jsonData) {
      var table = document.createElement('table');
      table.className = "table table-condensed table-striped tech-specs-table";

      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      var headers = ['År Månad', 'Totalt antal ordrar', 'Total summa'];

      headers.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');

      for (var month in jsonData) {
          var row = document.createElement('tr');
          var data = jsonData[month];

          var cell1 = document.createElement('td');
          var cell2 = document.createElement('td');
          var cell3 = document.createElement('td');

          cell1.textContent = month;
          cell2.textContent = data.totalOrders;
          cell3.textContent = data.totalSum;

          row.appendChild(cell1);
          row.appendChild(cell2);
          row.appendChild(cell3);

          tbody.appendChild(row);
      }

      table.appendChild(tbody);

      return table;
  }

  function generateStreaksTable(jsonData) {
      var div = document.createElement('div');

      var table1 = document.createElement('table');
      table1.className = "table table-condensed table-striped tech-specs-table";

      var thead1 = document.createElement('thead');
      var headerRow1 = document.createElement('tr');
      var headers1 = ['Längsta streak', 'Nuvarande streak'];

      headers1.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow1.appendChild(th);
      });

      thead1.appendChild(headerRow1);
      table1.appendChild(thead1);

      var tbody1 = document.createElement('tbody');
      var row1 = document.createElement('tr');
      var cell1_1 = document.createElement('td');
      var cell1_2 = document.createElement('td');

      cell1_1.textContent = jsonData.longestStreak;
      cell1_2.textContent = jsonData.currentStreak;

      row1.appendChild(cell1_1);
      row1.appendChild(cell1_2);

      tbody1.appendChild(row1);
      table1.appendChild(tbody1);

      /* --- */

      var table2 = document.createElement('table');
      table2.className = "table table-condensed table-striped tech-specs-table";

      var thead2 = document.createElement('thead');
      var headerRow2 = document.createElement('tr');
      var headers2 = ['Streak började', 'Streak slutade', 'Antal månader'];

      headers2.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow2.appendChild(th);
      });

      thead2.appendChild(headerRow2);
      table2.appendChild(thead2);

      var tbody2 = document.createElement('tbody');

      jsonData.streaks.forEach(streak => {
          var row2 = document.createElement('tr');
          var cell2_1 = document.createElement('td');
          var cell2_2 = document.createElement('td');
          var cell2_3 = document.createElement('td');

          cell2_1.textContent = streak.start;
          cell2_2.textContent = streak.end;
          cell2_3.textContent = streak.months;

          row2.appendChild(cell2_1);
          row2.appendChild(cell2_2);
          row2.appendChild(cell2_3);

          tbody2.appendChild(row2);
      });

      table2.appendChild(tbody2);

      div.appendChild(table1);
      div.appendChild(table2);

      return div;
  }

  function generateCategoriesTable(jsonData) {
      var table = document.createElement('table');
      table.className = "table table-condensed table-striped tech-specs-table";

      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      var headers = ['Kategori', 'Antal produkter'];

      headers.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');

      for (var category in jsonData) {
          var row = document.createElement('tr');
          var data = jsonData[category];

          var cell1 = document.createElement('td');
          var cell2 = document.createElement('td');

          cell1.textContent = category;
          cell2.textContent = data;

          row.appendChild(cell1);
          row.appendChild(cell2);

          tbody.appendChild(row);
      }

      table.appendChild(tbody);

      return table;
  }

  function generateHoarderTable(jsonData) {
      var table = document.createElement('table');
      table.className = "table table-condensed table-striped tech-specs-table";

      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      var headers = ['Produkt', 'Antal köpta'];

      headers.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');

      jsonData.forEach(product => {
          var row = document.createElement('tr');
          var cell1 = document.createElement('td');
          var cell2 = document.createElement('td');

          cell1.textContent = product.name;
          cell2.textContent = product.bought;

          row.appendChild(cell1);
          row.appendChild(cell2);

          tbody.appendChild(row);
      });

      table.appendChild(tbody);

      return table;
  }

  function generateExperienceTable(jsonData) {
      var table = document.createElement('table');
      table.className = "table table-condensed table-striped tech-specs-table";

      var thead = document.createElement('thead');
      var headerRow = document.createElement('tr');
      var headers = ['Köp XP', 'Bonus XP', 'Cheevo XP', 'Supply drop XP', 'Övriga XP', 'Totalt'];

      headers.forEach(function(header) {
          var th = document.createElement('th');
          th.textContent = header;
          headerRow.appendChild(th);
      });

      thead.appendChild(headerRow);
      table.appendChild(thead);

      var tbody = document.createElement('tbody');

      var row = document.createElement('tr');
      var cell1 = document.createElement('td');
      var cell2 = document.createElement('td');
      var cell3 = document.createElement('td');
      var cell4 = document.createElement('td');
      var cell5 = document.createElement('td');
      var cell6 = document.createElement('td');

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

  function addDataToDiv(headerText, domObject) {
      var div = document.createElement('div');
      div.className = "order my-4";

      var table = document.createElement('table');
      table.className = 'table table-condensed';

      var tbody = document.createElement('tbody');

      var tr = document.createElement('tr');
      tr.className = 'order-id-wrap';

      var td = document.createElement('td');
      td.textContent = headerText;

      tr.appendChild(td);
      tbody.appendChild(tr);
      table.appendChild(tbody);
      div.appendChild(table);


      var div1 = document.createElement('div');
      var div2 = document.createElement('div');
      var orderProgression = document.createElement('div');
      var innerContainer = document.createElement('div');
      var orderStatusEvent = document.createElement('div');
      var icon = document.createElement('div');
      var header = document.createElement('h3');
      var secondary = document.createElement('div');

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
      paths.forEach(path => {
          const d = document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (d) {
              dom = d;
              return;
          }
      });

      return dom;
  }

  async function _clearAndAddStatistics(event) {
      event.preventDefault();
      var clickedLink = event.target;

      var allLinks = document.querySelectorAll('.router-link-exact-active.router-link-active');
      allLinks.forEach(function(link) {
          link.classList.remove('router-link-exact-active', 'router-link-active');
      });

      clickedLink.classList.add('router-link-exact-active', 'router-link-active');

      var content = `
      <h2 class="level-one-heading mb-5">Min statistik</h2><hr>
      <div class="mb-5">Här hittar du statistik om din aktivitet på webhallen.</div>
      `

      let paths = ['/html/body/div[2]/div[2]/div[1]/div[3]/main/div/div[4]/div[1]/div/article/div[2]/section',
                   '/html/body/div[2]/div[2]/div[1]/div[3]/main/div/div[4]/div[1]/div/article/div[2]/div[2]',
                   '//*[@id="container"]'];
      var injectPath = findInjectPath(paths);
      injectPath.innerHTML = content;

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      var image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      image.setAttribute("href", 'https://cdn.webhallen.com/img/loading_light.svg');
      svg.appendChild(image);

      injectPath.appendChild(svg);

      let orders = await fetchOrders(ME.user.id);
      let supplyDrops = await fetchSupplyDrops(ME.user.id);
      let achievements = await fetchAchievements(ME.user.id);

      injectPath.innerHTML = content;

      if (orders) {
          const experience = getExperienceStats(ME, orders, achievements, supplyDrops);
          if (experience) {
              injectPath.appendChild(addDataToDiv("Experience", generateExperienceTable(experience)));
          }

          const streaks = findStreaks(orders);
          if (streaks) {
              injectPath.appendChild(addDataToDiv("Streaks", generateStreaksTable(streaks)));
          }

          const hoarder = findTopHoarderCheevoStats(orders, 10);
          if (hoarder) {
              injectPath.appendChild(addDataToDiv("Hoarder Top 10", generateHoarderTable(hoarder)));
          }

          const categories = findCategoriesByPeriod(orders);
          if (categories) {
              injectPath.appendChild(addDataToDiv("Kategorier", generateCategoriesTable(categories)));
          }

          const orderMonths = findOrdersPerMonth(orders);
          if (orderMonths) {
              injectPath.appendChild(addDataToDiv("Ordrar per månad", generateMonthsTable(orderMonths)));
          }
      }
  }

  function addLink() {
      clearInterval(timerId);
      var ul = document.evaluate('/html/body/div[2]/div[2]/div[1]/div[3]/main/div/div[4]/div[1]/div/article/div[2]/div/nav/div[1]/div[1]/ul', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

      if (ul) {
          var li = document.createElement('li');
          li.className = 'tile';
          var link = document.createElement('a');
          link.href = '#';

          var image = document.createElement('img');
          image.src = '//cdn.webhallen.com/img/icons/member/topplistor.svg';
          image.className = 'member-icon';
          image.alt = 'Statistik';

          link.appendChild(image);
          link.appendChild(document.createTextNode('Statistik'));
          link.addEventListener('click', _clearAndAddStatistics);
          li.appendChild(link);
          ul.appendChild(li);
      } else {
          console.error("UL element not found using XPath.");
      }
  }

  async function main() {
      ME = await fetchMe();
      if (!ME) return;

      addLink();
  }

  var timerId = setInterval(main, 1000);
})();
