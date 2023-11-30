// ==UserScript==
// @name         Webhallen compare products
// @namespace    Webhallen
// @version      0.1
// @description  Generates a checkbox on all products and when the user clicks two it will present an overlay with a table comparing the products.
// @author       Furiiku
// @match        https://www.webhallen.com/se/category/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=webhallen.com
// @grant        none
// ==/UserScript==

// NOTE: Can be very unstable and has not been tested on anything but latest firefox.

(function() {
    'use strict';

    const URI = 'https://www.webhallen.com';
    const URI_CDN = 'https://cdn.webhallen.com';
    const API = '/api';

    async function fetchProductData(articleId) {
        try {
            const response = await fetch(`${URI}${API}/product/${articleId}`);
            const data = await response.json();
            const product = data.product;

            if (!product || !product.data) {
                console.error(`Article ${articleId} does not contain any data to compare against.`);
                return null;
            }

            const filteredProduct = {
                id: product.id,
                name: product.name.split('/')[0].trim(),
                thumbnail: product.thumbnail,
                data: {},
            };

            for (const header in product.data) {
                if (!filteredProduct.data[header]) {
                    filteredProduct.data[header] = {};
                }

                for (const attribute in product.data[header]) {
                    filteredProduct.data[header][attribute] = product.data[header][attribute].value;
                }
            }

            return filteredProduct;
        } catch (error) {
            console.error(`Error occurred: ${error}`);
            return null;
        }
    }

    function generateComparisonTable(products) {
        const headers = Array.from(
            new Set(products.flatMap((product) => Object.keys(product.data)))
        );

        let outputHtml = `
            <tr>
                <th class="attribute"></th>
                <th>
                    <img src='${URI_CDN}${products[0].thumbnail}' alt='${products[0].name}'>
                    <p>${products[0].name} (${products[0].id})</p>
                </th>
                <th>
                    <img src='${URI_CDN}${products[1].thumbnail}' alt='${products[1].name}'>
                    <p>${products[1].name} (${products[1].id})</p>
                </th>
            </tr>
        `;

        for (const header of headers) {
            const attributes = Array.from(
                new Set(products.flatMap((product) => Object.keys(product.data[header] || {})))
            );
            outputHtml += generateTableRowHeader(header);

            for (const attribute of attributes) {
                outputHtml += generateTableRow(
                    attribute,
                    products[0].data[header]?.[attribute] || '',
                    products[1].data[header]?.[attribute] || ''
                );
            }
        }

        return outputHtml;
    }

    function generateTableRow(attribute, value1, value2) {
        let value1Class = '';
        let value2Class = '';

        if (value1 === value2) {
            value1Class += 'same-attribute ';
            value2Class += 'same-attribute ';
        }

        if (value1 === '') {
            value1Class += 'missing-attribute ';
        }

        if (value2 === '') {
            value2Class += 'missing-attribute ';
        }

        return `
            <tr>
                <td class="attribute"><strong>${attribute}</strong></td>
                <td class="${value1Class}">${value1}</td>
                <td class="${value2Class}">${value2}</td>
            </tr>
        `;
    }

    function generateTableRowHeader(header) {
        return `
            <tr>
                <td class="pt-5 attribute-header" colspan="3"><strong>${header}</strong></td>
            </tr>
        `;
    }

    async function generateTable(articles) {
        if (typeof articles[0] === 'undefined' || typeof articles[1] === 'undefined') return;

        const products = await Promise.all(articles.map(fetchProductData));

        if (products.some((product) => product === null)) {
            console.error('Error: Could not fetch product data for one or more articles.');
            return;
        }

        // Create elements
        const htmlOutputContainer = document.createElement('div');
        htmlOutputContainer.classList.add('panel', 'panel-thick-gray', 'centered');

        const panelHeading = document.createElement('div');
        panelHeading.classList.add('panel-heading');
        panelHeading.textContent = 'Jämför artiklar';

        const table = document.createElement('table');
        table.classList.add('table', 'table-condensed', 'table-striped', 'tech-specs-table');

        const tbody = document.createElement('tbody');
        tbody.innerHTML = generateComparisonTable(products);

        // Append elements to the document
        table.appendChild(tbody);
        htmlOutputContainer.appendChild(panelHeading);
        htmlOutputContainer.appendChild(table);
        
        return htmlOutputContainer;
    }

    async function sendSelectedProducts(ids) {
        const div = await generateTable(ids);
        const overlay = createOverlay(div);
        document.body.appendChild(overlay);
    }

    function createOverlay(content) {
        console.log(content);
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        overlay.style.position = 'fixed';
        overlay.style.top = '10%';
        overlay.style.left = '10%';
        overlay.style.width = '80%';
        overlay.style.height = '85vh';
        overlay.style.overflow = 'auto';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        overlay.style.border = '2px solid #000';
        overlay.style.borderRadius = '10px';
        overlay.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';
        overlay.style.zIndex = '9999';

        const closeImage = document.createElement('img');
        closeImage.className = "icon";
        closeImage.src = "//cdn.webhallen.com/api/dynimg/icon/esc/FFFFFF";
        closeImage.alt = "Stäng ner";

        const closeButton = document.createElement('button');
        closeButton.className = "btn-close";
        closeButton.addEventListener('click', () => {
            overlay.remove();
        });
        closeButton.appendChild(closeImage);

        content.querySelector('th:nth-of-type(3)').appendChild(closeButton);
        overlay.appendChild(content);
        return overlay;
    }

    function handleProductSelection() {
        const selectedProducts = document.querySelectorAll('.product-checkbox:checked');

        if (selectedProducts.length === 2) {
            const productIds = Array.from(selectedProducts).map(product => product.dataset.productId);
            sendSelectedProducts(productIds);

            selectedProducts.forEach(product => {
                product.checked = false;
            });
        }
    }

    function createCheckbox(product) {
        const link = product.querySelector('a');
        const id = link.href.split('/').slice(-1).toString().slice(0, 6);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'product-checkbox';
        checkbox.dataset.productId = id;
        checkbox.addEventListener('change', handleProductSelection);

        return checkbox;
    }

    function injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            th {
                position: sticky;
                top: 0;
                text-align: center;
                background-color: #eceff0;
            }
            .attribute {
                width: 20%;
                text-align: left;
            }
            .attribute-header {
                color: #ffffff;
                background-color: #3338ff;
                text-align: center;
            }
            .same-attribute {
                background-color: #c8e6c9;
            }
            .missing-attribute {
                background-color: #eceff0;
            }
        `;

        // Append the style element to the head
        document.head.appendChild(style);
    }

    function observeDOM() {
        const targetNode = document.body;

        const config = { childList: true, subtree: true };

        const callback = function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(addedNode => {
                        if (addedNode.className && addedNode.className === 'panel-thin product-grid-item col-md-4 col-sm-6 col-xs-6 panel') {
                        const product = addedNode.querySelector('.panel-top');
                            if (product) {
                                console.log(`Found product ${product}`);
                                const checkbox = createCheckbox(product);
                                product.insertBefore(checkbox, product.firstChild);
                            }
                        }
                    });
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    }

    injectCSS();
    observeDOM();
})();