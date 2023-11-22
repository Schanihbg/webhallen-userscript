// ==UserScript==
// @name         Webhallen summa
// @namespace    Webhallen
// @version      0.1
// @description  Summera något något
// @author       Schanii, tsjost, and Furiiku
// @match        https://www.webhallen.com/se/member/*/orders
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let button = document.createElement("button");
  button.innerText = "Läs in orders";
  button.setAttribute("id", "load_data_id");
  //    button.setAttribute("onclick", main);
  //button.insertAdjacentHTML("beforeend", '<button onClick={main()}>Läs in data</button>');
  //button.innerHTML = '<button onclick="main()">Läs in data</button>';
  function timer(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function callURL(url) {
    let resp;

    await fetch(url)
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

  // async function getOrders(user_id) {
  //     let all_orders = [];
  //     let first_pass = await callURL(`https://www.webhallen.com/api/order/user/${user_id}?filters%5Bhistory%5D=true&page=1&searchString=&sort=sentDate`);
  //     let count = first_pass.currentResultPageCount;

  //     all_orders = all_orders.concat(first_pass.orders);

  //     for (let i = 2; i <= count; i++) {
  //         (async function (i) {
  //             setTimeout(async () => {
  //                 let pass = await callURL(`https://www.webhallen.com/api/order/user/${user_id}?filters%5Bhistory%5D=true&page=${i}&searchString=&sort=sentDate`);
  //                 all_orders = all_orders.concat(pass.orders);
  //             }, 1000);
  //         })(i);
  //     }

  //     return all_orders;
  // };

  function findLongestStreak(orderDates) {
    let cheevoStartDate = Date.parse("01-Sep-2015".replace(/-/g, " "));
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Maj",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dec",
    ];
    let output = {
      monthCounts: {},
      streaks: [],
      longestStreak: 0,
      currentStreak: 0,
    };

    let longestStreak = 0;
    let currentStreak = 0;
    let monthCounts = {};
    let previousDate = null;
    let lastYearMonth = null;
    let streaks = [];
    let currentStreakStart = null;
    for (let i = 0; i < orderDates.length; i++) {
      const currentDate = new Date(orderDates[i] * 1000);
      const yearMonth = `${currentDate.getUTCFullYear()} ${
        monthNames[currentDate.getUTCMonth()]
      }`;

      monthCounts[yearMonth] = (monthCounts[yearMonth] || 0) + 1;

      if (cheevoStartDate > currentDate) continue; // Only count streaks after cheevo creation date

      if (previousDate === null) {
        previousDate = currentDate;
        lastYearMonth = yearMonth;
        currentStreak = 0;
        currentStreakStart = yearMonth;
      } else {
        const [lastYear, lastMonth] = lastYearMonth.split(" ");
        const [year, month] = yearMonth.split(" ");

        const m1 = previousDate.getMonth();
        const m2 = currentDate.getMonth();
        const isConsecutive = m2 - m1 === 1 || m2 - m1 === -11;

        if (
          previousDate.getMonth() !== currentDate.getMonth() &&
          !isConsecutive
        ) {
          streaks.push({
            start: currentStreakStart,
            end: lastYearMonth,
            length: currentStreak,
          });
          currentStreak = 0;
          currentStreakStart = yearMonth;
        } else if (previousDate.getMonth() !== currentDate.getMonth()) {
          currentStreak++;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
        lastYearMonth = yearMonth;
        previousDate = currentDate;
      }
    }
    streaks.push({
      start: currentStreakStart,
      end: lastYearMonth,
      length: currentStreak,
    });

    output.monthCounts = monthCounts;
    output.streaks = streaks;
    output.longestStreak = longestStreak;
    output.currentStreak = currentStreak;

    return output;
  }

  async function getOrders(user_id, count) {
    let all_orders = [];

    for (let i = 2; i <= count; i++) {
      let pass = await callURL(
        `https://www.webhallen.com/api/order/user/${user_id}?filters%5Bhistory%5D=true&page=${i}`,
      );
      all_orders = all_orders.concat(pass.orders);
      await timer(1000);
    }

    return all_orders;
  }

  async function main() {
    callURL("https://www.webhallen.com/api/me").then(async (user_data) => {
      console.log("user_data", user_data);
      let first_pass = await callURL(
        `https://www.webhallen.com/api/order/user/${user_data.user.id}?filters%5Bhistory%5D=true&page=1`,
      );
      let all_orders = [];
      all_orders = all_orders.concat(first_pass.orders);

      await getOrders(
        user_data.user.id,
        first_pass.currentResultPageCount,
      ).then((everything) => {
        all_orders = all_orders.concat(everything);
        let orderDates = [];

        console.log("all_orders", all_orders);

        all_orders.map((order) => {
          console.log("order.orderDate", order.orderDate);
          orderDates.push(order.orderDate);
        });

        orderDates.sort((a, b) => a - b);
        let final = findLongestStreak(orderDates);

        console.log("final", final);
      });
    });
  }

  const mutationObserver = new MutationObserver(
    async (mutationList, observer) => {
      mutationList.forEach(async (mutation) => {
        if (
          mutation.type == "childList" &&
          typeof mutation.addedNodes == "object" &&
          mutation.addedNodes.length > 0
        ) {
          mutation.addedNodes.forEach(async (node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            node
              .querySelectorAll(".member-orders.member-subpage")
              .forEach(async (img) => {
                img.querySelector("h2").after(button);
                // document.getElementByID("load_data_id").onclick=async() => {await main();};
                button.addEventListener("click", async () => {
                  main();
                });
              });
          });
        }
      });
    },
  );

  mutationObserver.observe(document, {
    childList: true,
    subtree: true,
  });
})();
