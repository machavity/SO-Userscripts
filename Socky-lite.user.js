// ==UserScript==
// @name         Socky-lite
// @version      0.0.1
// @description  Shows potential voting fraud accounts' PII side-by-side (simple parser to limp along without Rob's original Socky)
// @author       Machavity
//
// @updateURL    https://github.com/machavity/SO-Userscripts/raw/master/Socky-lite.user.js
// @downloadURL  https://github.com/machavity/SO-Userscripts/raw/master/Socky-lite.user.js
// @match        https://*stackoverflow.com/admin/show-user-votes/*
// @match        https://*serverfault.com/admin/show-user-votes/*
// @match        https://*superuser.com/admin/show-user-votes/*
// @match        https://*askubuntu.com/admin/show-user-votes/*
// @match        https://*mathoverflow.net/admin/show-user-votes/*
// @match        https://*.stackexchange.com/admin/show-user-votes/*
// @exclude      https://meta.stackoverflow.com/*
// @exclude      https://meta.superuser.com/*
// @exclude      https://meta.askubuntu.com/*
// @exclude      https://meta.mathoverflow.net/*
// @exclude      https://meta.*.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';
    const SE_API = 'https://api.stackexchange.com/2.3/';

    class Sockylite {
         constructor() {
             this.fkey = StackExchange.options.user.fkey;
             let split = location.href.split('/');
             this.userList = [split[split.length - 1]]; // Last element of the URL is the user ID
             this.contentWindow = document.getElementById('content');
             let subheader = document.querySelectorAll('.subheader');
             let button = document.createElement('button');
             button.type = 'button';
             button.innerText = 'Use Socky';
             button.classList.add('s-btn', 's-btn__primary', 's-btn__xs');
             button.addEventListener('click', () => this.loadSocky());
             button.style.marginLeft = '4px';
             subheader[0].insertAdjacentElement('beforeend', button);

             this.parseUsers();
         }

        parseUsers() {
            let divs = this.contentWindow.querySelectorAll('.js-vote-row');
            divs.forEach(elm => {
                let userID = elm.getAttribute('data-user-id');
                if(this.userList.indexOf(userID) === -1) {
                    this.userList.push(userID);
                    let lastElm = elm.children[0];
                    let div = document.createElement('div');
                    let checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = userID;
                    checkbox.name = 'socky';
                    div.append('Socky Compare ', checkbox);
                    lastElm.insertAdjacentElement('beforeend', div);
                }
            });
        }

        loadSocky() {
            let checkboxes = this.contentWindow.querySelectorAll('input[name="socky"');
            let checked = [this.userList[0]];
            checkboxes.forEach(elm => { if(elm.checked) checked.push(elm.value) });
             if(checked.length <= 1) {
                 alert('No users selected to compare to');
                 return;
             }
            this.table = document.createElement('table');
            this.table.style.marginTop = '10px';
            this.table.classList.add('s-table');
            this.table.insertAdjacentHTML('afterbegin', '<thead><tr><th>User</th><th>Rep</th><th>Joined</th><th>Real Name/Email</th><th>Last IP</th></tr></thead>');
            this.fetchUsers(checked);


            this.contentWindow.append(this.table);
        }

        fetchUsers(checked_users) {
            let url_list = '';
            checked_users.forEach(user => { url_list = url_list + user + ';'; });
            fetch(SE_API + 'users/' + url_list.slice(0,-1) + '?order=desc&sort=reputation&site=stackoverflow').then(response => response.json())
            .then(users => {
                users.items.forEach(user => {
                    let date = new Date(user.creation_date * 1000);
                    let display_date = date.toString();
                    let html = '<tr id="socky_' + user.user_id + '"><td><a href="' + user.link + '" target="_new">' + user.display_name + '</a></td>' +
                        '<td>' + user.reputation + '</td>' +
                        '<td>' + display_date + '</td>' +
                        '<td></td><td><button type="button" class="s-btn s-btn__primary s-btn__xs" id="sockybtn_' + user.user_id + '">Load PII</button></td></tr>';
                    this.table.insertAdjacentHTML('beforeend', html);
                    document.getElementById('sockybtn_' + user.user_id).addEventListener('click', evt => { this.fetchPII(evt, user.user_id); });
                });
            });

        }

        fetchPII(evt, userID) {
            let button = evt.target;
            let form = new FormData();
            form.append('fkey', this.fkey)
            form.append('id', userID);

            fetch('/admin/all-pii', {method: 'POST', body: form}).then(response => response.text())
            .then(html => this.parsePII(html, button))
                .catch(error => {'An error has occurred in fetching PII: ' + error});
        }

        parsePII(html, button) {
            let parser = new DOMParser();
            let dom = parser.parseFromString(html, 'text/html');
            let rows = dom.querySelectorAll('div.row');
            let pii = rows[0].querySelectorAll('a');
            let td = button.closest('td');
            td.previousElementSibling.innerHTML = '<b>Real Name:</b> ' + pii[0].innerText + '<br><b>Email:</b> ' + pii[1].innerText;
            let ip = rows[1].querySelector('span');
            td.innerHTML = ip.innerText;
        }
    }

    let sockyLite = new Sockylite();
})();