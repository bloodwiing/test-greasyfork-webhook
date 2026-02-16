// ==UserScript==
// @name         Test
// @namespace    dev.wiing.test
// @version      3.0.0
// @description  A helper script to highlight a destination from the travel url
// @author       BLOODWIING[3891894]
// @license      MIT
// @match        https://www.torn.com/page.php?sid=travel*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/566390/Travel%20Destination%20Indicator.user.js
// @updateURL https://update.greasyfork.org/scripts/566390/Travel%20Destination%20Indicator.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const plugin_name = 'TravelDestinationIndicator';

    const Q_MAP = 'fieldset[class^="worldMap_"]';
    const Q_MAPICON = 'label[class^="destinationLabel_"]';
    const Q_MAPPIN = 'div[class^="pin_"]';
    const F_MAPPIN_SELECTED = '[class*="selected_"]';

    const Q_DESTLIST = 'div[class^="destinationList_"]';
    const Q_DEST = 'div[class^="destination_"]';
    const Q_DESTICON = 'div[class^="destinationDetails_"] img[class^="circularFlag_"]';
    const Q_DESTNAME = 'div[class^="destinationDetails_"] span[class^="country_"]';

    const F_PROCESSED = '[dti-processed]';
    const F_HIGHLIGHT = '[dti-highlight]';
    const F_FADE = '[dti-fade]';

    const log = (x) => { console.log(`[${plugin_name}] ${x}`) };
    const error = (x) => { console.error(`[${plugin_name}] ${x}`) };

    const page_args = window.location.search.substr(1).split('&').reduce(
        (dict, x) => {var splits = x.split('='); dict[splits[0]] = splits[1] || null; return dict}
        , {});

    const destination_names = {
        'torn': 'Torn',

        'mexico': 'Mexico',
        'cayman': 'Cayman Islands',
        'canada': 'Canada',

        'hawaii': 'Hawaii',
        'uk': 'United Kingdom',
        'argentina': 'Argentina',
        'switzerland': 'Switzerland',

        'japan': 'Japan',
        'china': 'China',
        'uae': 'UAE',
        'south-africa': 'South Africa',
    }

    const destination_aliases = {
        'cayman-islands': 'cayman',
        'united-arab-emirates': 'uae',
        'united-kingdom': 'uk',

        'mex': 'mexico',
        'cay': 'cayman',
        'can': 'canada',
        'haw': 'hawaii',
        'uni': 'uk',
        'arg': 'argentina',
        'swi': 'switzerland',
        'jap': 'japan',
        'chi': 'china',
        'sou': 'south-africa',
    }

    const loaded_map_icons = {
        /*
        'uk': {
            'node': node,
            'icon': icon,
            'input': input,
        }
        */
    }

    const loaded_list_buttons = {
        /*
        'uk': {
            'node': node,
            'icon': icon,
            'button': button,
            'span': span,
        }
        */
    }

    var country_filter = [];
    var filtered = [];

    function onElement(selector, callback, { once = true, single = true, root = document.body, attributes = false } = {}) {
        const run = () => {
            const els = document.querySelectorAll(selector);
            if (els.length) {
                if (single) {
                    callback(els[0]);
                } else {
                    els.forEach(callback);
                }
                return true;
            }
            return false;
        };

        if (run() && once) return;

        const obs = new MutationObserver(() => {
            if (run() && once) obs.disconnect();
        });

        obs.observe(root, { childList: true, subtree: true, attributes: attributes });
        return obs;
    }

    function createInlineHighlightIcon() {
        return `data:image/svg+xml,
<?xml version="1.0" encoding="UTF-8"?>
<svg width="40" height="22" version="1.1" viewBox="0 0 40 22" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="linearGradient26"><stop stop-color="#4adf80" offset="0"/><stop stop-color="#4adf80" stop-opacity="0" offset="1"/></linearGradient><radialGradient id="radialGradient27" cx="-460" cy="218" r="7" gradientTransform="matrix(-2.29 -2.31e-5 1.17e-5 -1.14 -1511 472)" gradientUnits="userSpaceOnUse" xlink:href="#linearGradient26"/><linearGradient id="linearGradient30" x1="-460" x2="-460" y1="221" y2="233" gradientUnits="userSpaceOnUse"><stop stop-color="#4adf80" offset="0"/><stop stop-color="#4adf80" stop-opacity="0" offset="1"/></linearGradient><radialGradient id="radialGradient30" cx="-460" cy="218" r="7" gradientTransform="matrix(-1.43 3.69e-6 -2.06e-6 -.857 -1117 410)" gradientUnits="userSpaceOnUse" xlink:href="#linearGradient26"/><linearGradient id="linearGradient32" x1="-460" x2="-460" y1="221" y2="240" gradientUnits="userSpaceOnUse"><stop stop-color="#4adf80" offset="0"/><stop stop-color="#4adf80" stop-opacity="0" offset="1"/></linearGradient></defs><g id="i" transform="translate(1,1)"><g transform="translate(2)"><g transform="translate(487,-222)"><path d="m-468 222v13h3.05l4.9 4.9 4.9-4.9h3.15v-13zm1 1h14v11h-14z" fill="#4ade80" stop-color="#000000"/><path d="m-469 221v15h3.64l5.31 5.31 5.31-5.31h3.74v-15zm1 1h16v13h-16zm3.05 13h9.8l-4.9 4.9z" fill="url(#linearGradient32)" stop-color="#000000"/><path d="m-468 222v13h3.05l4.9 4.9 4.9-4.9h3.15v-13zm1 1h14v11h-14z" fill="#fff" stop-color="#000000"/><rect x="-467" y="223" width="14" height="8" ry="0" fill="url(#radialGradient27)" opacity=".55" style="paint-order:stroke markers fill"/></g></g><path d="m36 12h-14v-11h14zm-13-10v9h12v-9z" opacity=".1"/><g transform="translate(-18)"><g transform="translate(487,-222)"><path d="m-468 222v13h3.05l4.9 4.9 4.9-4.9h3.15v-13zm1 1h14v11h-14z" fill="#4ade80" stop-color="#000000"/><path d="m-469 221v15h3.64l5.31 5.31 5.31-5.31h3.74v-15zm1 1h16v13h-16zm3.05 13h9.8l-4.9 4.9z" fill="url(#linearGradient30)" opacity=".5" stop-color="#000000"/><path d="m-468 222v13h3.05l4.9 4.9 4.9-4.9h3.15v-13zm1 1h14v11h-14z" fill="#fff" stop-color="#000000"/><rect x="-467" y="223" width="14" height="6" ry="0" fill="url(#radialGradient30)" opacity=".25" style="paint-order:stroke markers fill"/></g></g><path d="m16 12h-14v-11h14zm-13-10v9h12v-9z" opacity=".1"/></g></svg>
`.replaceAll('\n', '').replaceAll('#', '%23');
    }

    function addCSS() {
        const style_code = `
/* MAP CSS */
${Q_MAPICON}${F_PROCESSED}${F_FADE} > ${Q_MAPPIN} {
    opacity: .65;
}

${Q_MAPICON}${F_PROCESSED}${F_FADE} > ${Q_MAPPIN}${F_MAPPIN_SELECTED} {
    opacity: 1;
}

${Q_MAPICON}${F_HIGHLIGHT} > ${Q_MAPPIN} {
    transform: scale(2.5);
    background-position-x: 18px;
}

${Q_MAPICON}${F_HIGHLIGHT} > ${Q_MAPPIN}${F_MAPPIN_SELECTED} {
    transform: scale(2.75);
}

${Q_MAPICON}${F_HIGHLIGHT} > ${Q_MAPPIN}::before {
    content: "";
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background-image: url('${createInlineHighlightIcon()}');
}

${Q_MAPICON}${F_HIGHLIGHT}:hover > ${Q_MAPPIN}::before,
${Q_MAPICON}${F_HIGHLIGHT} > ${Q_MAPPIN}${F_MAPPIN_SELECTED}::before {
    background-position-x: 20px;
}

/* LIST CSS */
${Q_DEST}${F_FADE} {
    opacity: 0.45;
}

${Q_DEST}${F_FADE}:hover {
    opacity: 0.65;
}

${Q_DEST}${F_FADE}.expanded {
    opacity: 1;
}

${Q_DEST}${F_HIGHLIGHT} {
    background: linear-gradient(to right, #4adf805e, transparent);
}

${Q_DEST}${F_HIGHLIGHT}:hover > button {
    background: linear-gradient(to right, #4adf805e, #3f3f3f);
}
`;
        log("Adding CSS...");

        let style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = style_code;

        document.head.appendChild(style);

        log("CSS added")
    };

    function dealiasName(name) {
        if (destination_aliases[name]) {
            return dealiasName(destination_aliases[name]);
        }
        return name;
    }

    function systemifyName(name) {
        return name.split(" -")[0].replaceAll(" ", "-").toLowerCase()
    }

    function onNewMapDestination(node) {
        const input = node.querySelector('input');
        const icon = node.querySelector(Q_MAPPIN);

        const name = dealiasName(systemifyName(input.ariaLabel));

        loaded_map_icons[name] = {
            'node': node,
            'icon': icon,
            'input': input,
        };

        node.setAttribute("dti-processed", "");

        if (country_filter.includes(name)) {
            node.setAttribute("dti-highlight", "");
            filtered.push(name);
        }

        if (filtered.length) {
            const els = document.body.querySelectorAll(`${Q_MAPICON}${F_PROCESSED}:not(${F_HIGHLIGHT}):not(${F_FADE})`);
            els.forEach((el) => {
                el.setAttribute("dti-fade", "");
            });
        }
    }

    function onNewListDestination(node) {
        console.log(node);
        const button = node.querySelector('button');
        const icon = node.querySelector(Q_DESTICON);
        const span = node.querySelector(Q_DESTNAME);

        const name = dealiasName(systemifyName(span.innerText));

        loaded_list_buttons[name] = {
            'node': node,
            'icon': icon,
            'button': button,
            'name': name,
        };

        node.setAttribute("dti-processed", "");

        if (country_filter.includes(name)) {
            node.setAttribute("dti-highlight", "");
            filtered.push(name);
        }

        if (filtered.length) {
            const els = document.body.querySelectorAll(`${Q_DEST}${F_PROCESSED}:not(${F_HIGHLIGHT}):not(${F_FADE})`);
            els.forEach((el) => {
                console.log(el);
                el.setAttribute("dti-fade", "");
            });
        }
    }

    function runMain() {
        log("Initializing...");

        if (page_args.destination !== undefined) {
            country_filter = page_args.destination.split("+").map(dealiasName);

            log(`Destinations to highlight: ${country_filter.join(", ") }`);
        }

        log(`Initiating Page observers...`);

        onElement(`${Q_MAP} ${Q_MAPICON}:not(${F_PROCESSED})`, onNewMapDestination, {once: false, single: false});
        onElement(`${Q_DESTLIST} ${Q_DEST}:not(${F_PROCESSED})`, onNewListDestination, {once: false, single: false});

        log(`Installed`);

        log(`Done!`);

        addCSS();
    }

    runMain();
})();