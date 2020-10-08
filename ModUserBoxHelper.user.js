// ==UserScript==
// @name         Mod User Box helper
// @version      0.3.1
// @description  Add some clarity to the mod boxes for ban statuses. Adds a clear button for edit ban
// @author       Machavity
//
// @updateURL    https://github.com/machavity/SO-Userscripts/raw/master/ModUserBoxHelper.user.js
// @downloadURL  https://github.com/machavity/SO-Userscripts/raw/master/ModUserBoxHelper.user.js
// @include      https://*stackoverflow.com/users*
// @include      https://*serverfault.com/users*
// @include      https://*superuser.com/users*
// @include      https://*askubuntu.com/users*
// @include      https://*mathoverflow.net/users*
// @include      https://*.stackexchange.com/users*
// @exclude      https://meta.stackoverflow.com/*
// @exclude      https://meta.superuser.com/*
// @exclude      https://meta.askubuntu.com/*
// @exclude      https://meta.mathoverflow.net/*
// @exclude      https://meta.*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    // SO classes for green and red. Pulled from the expanded up/down vote in Q&A CSS
    const green = 'fc-green-600';
    const red = 'fc-red-600';
    let reputation = '1';

    let url = window.location.href;
    if(url.search(/\/account-info/) !== -1) loadUserModPage();
    // Exclude Developer Story and profile edit
    else if(url.search(/\/(story|edit)/) !== -1) return;
    else loadUserProfilePage();

    function loadUserProfilePage() {
        let modCard = document.querySelector('div[class~="js-profile-mod-info"]');
        if(!modCard) return; // No mod block so we're done
        let reputation = loadUserProfileReputation();
        let tds = document.querySelectorAll('td[class^="mod-label"]');
        tds.forEach(function(elm) {
            // Question and Answer Ban
            if(elm.innerText.search(/blocked\sfrom\s(asking|answering)/i) !== -1) simpleBanNotice(elm.nextElementSibling);
            else if(elm.innerText.includes('suspended from reviews')) simpleBanNotice(elm.nextElementSibling);
            // Edit ban
            else if(elm.innerText.includes('blocked from suggested edits') === true) {
                if(reputation >= 2000) simpleBanNotice(elm.nextElementSibling, '>= 2k rep');
                else editBanNotice(elm.nextElementSibling);
            }
        });
    }
    function loadUserProfileReputation() {
        // Profile Page
        let div = document.querySelector('div[title="reputation"]');
        if(div) return parseReputation(div.firstElementChild.firstElementChild.innerText);
        // Activity Page
        div = document.querySelector('div[class~="fs-headline1"]');
        if(div) return parseReputation(div.firstElementChild.innerText);
        return 1;
    }

    function loadUserModPage() {
        const annotate = 'supernovabg';
        const flags = 'hotbg';
        let mod = document.getElementById('mod-content');
        let divs = mod.querySelectorAll('div[class="col-2"]');
        let nextDiv;
        divs.forEach(function(elm) {
            // Find user reputation. Neded for the edit ban section
            if(elm.innerText.includes('Reputation') === true) reputation = parseReputation(elm.nextElementSibling.innerText);
            // Question, Answer and Review Ban
            if(elm.innerText.search(/(Question\sban|Answer\sban|Review\ssuspension)/i) !== -1) simpleBanNotice(elm.nextElementSibling);
            // Edit ban
            if(elm.innerText.includes('Suggested edit ban') === true) {
                if(reputation >= 2000) simpleBanNotice(elm.nextElementSibling, '>= 2k rep');
                else editBanNotice(elm.nextElementSibling);
            }
        });
        // style messages on the left side
        let list = mod.querySelectorAll('span.bounty-indicator-tab');
        if(list.length > 0) {
            list[0].classList.add((list[0].nextElementSibling.innerText === 'flags for user' ? flags : annotate));
            if(list.length > 1) list[1].classList.add(flags);
        }

        let cmElm = document.querySelector('a.coolbg');
        if(!cmElm) return; // no CM messages so we don't need to add a link
        let ul = document.querySelectorAll('ul.mod-quick-links li');
        let flagLi = ul[4]; // grab the flag element
        let newLi = document.createElement('li');
        let span = document.createElement('span');
        span.classList.add('bounty-indicator-tab', 'coolbg');
        span.innerText = cmElm.innerText;
        newLi.insertAdjacentElement('afterbegin', span);
        let anchor = document.createElement('a');
        anchor.href = cmElm.href;
        anchor.innerText = ' Community Team message(s)';
        newLi.insertAdjacentElement('beforeend', anchor);
        flagLi.insertAdjacentElement('afterend', newLi);
    }

    function simpleBanNotice(elm, useText = null) {
        let banned = elm.innerText.includes('yes');
        let span = elm.querySelector('span[class^=blocked]');
        if(!span) { // Review suspension omits the span if they are banned so we'll create it
            span = document.createElement('span');
            elm.insertAdjacentElement('afterbegin', span);
            banned = true;
        }
        span.classList.add(((banned) ? red : green));
        if(!useText) span.innerText = (banned ? 'Banned' : 'Not Banned');
        else span.innerText = useText;
    }
    function editBanNotice(div) {
        let banned = div.innerText.includes('yes');
        let span = document.createElement('span');
        span.classList.add(((banned) ? red : green));
        span.innerText = (banned ? 'Banned' : 'Not Banned');
        let eventSpan = div.querySelector('span[class="suggested-edit-ban"]');
        if(eventSpan) {
            div.appendChild(eventSpan);
            div.querySelector('a').remove();
        } else { // Banned users will not have the ban link. Unban is in a different element
            eventSpan = div.querySelector('a[class="suggested-edit-unban"]');
            eventSpan.nextSibling.remove();
            eventSpan.previousSibling.remove();
        }
        let button = document.createElement('button');
        button.classList.add('s-btn', 's-btn__primary', 's-btn__xs');
        button.innerText = banned ? 'Remove Ban' : 'Add Ban';
        eventSpan.innerHTML = '';
        eventSpan.insertAdjacentElement('afterbegin', button);
        div.insertAdjacentElement('afterbegin', span);
    }
    function parseReputation(reputation) {
        reputation = reputation.replace(/\,/g,'');
        return parseInt(reputation,10);
    }
})();
