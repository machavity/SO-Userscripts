// ==UserScript==
// @name         New Mod Users Page
// @version      0.0.2
// @description  Splits the clunky /admin/users page into different components for easier work
// @author       Machavity
//
// @updateURL    https://github.com/machavity/SO-Userscripts/raw/master/new-mod-users.user.js
// @downloadURL  https://github.com/machavity/SO-Userscripts/raw/master/new-mod-users.user.js
// @match        https://*stackoverflow.com/admin/*
// @match        https://*serverfault.com/admin/*
// @match        https://*superuser.com/admin/*
// @match        https://*askubuntu.com/admin/*
// @match        https://*mathoverflow.net/admin/*
// @match        https://*.stackexchange.com/admin/*
// @exclude      https://meta.stackoverflow.com/*
// @exclude      https://meta.superuser.com/*
// @exclude      https://meta.askubuntu.com/*
// @exclude      https://meta.mathoverflow.net/*
// @exclude      https://meta.*.stackexchange.com/*
// ==/UserScript==


(function() {
    'use strict';
    const new_page_url = 'links';
    const new_page_hash = 'users';
    const mod_page_list = {
        'modmessage' : { 'url': 'messages', 'label': 'Moderator Messages', 'flagcell': false, 'usersearch': true },
        'annotation' : { 'url': 'annotated', 'label': 'Annotations', 'flagcell': true, 'usersearch': true },
        'escalation' : { 'url': 'cm-contacted', 'label': 'CM Escalations', 'flagcell': true, 'usersearch': true },
        'suspension' : { 'url': 'suspended', 'label': 'Suspensions', 'flagcell': true, 'usersearch': false },
        'recent_flags' : { 'url': 'flagged-posts?recent=1', 'label': 'Recently Flagged', 'flagcell': false, 'usersearch': false },
        'all_flags' : { 'url': 'flagged-posts', 'label': 'All-time Flagged', 'flagcell': false, 'usersearch': false }
    };

    class NewModUsers {
        constructor() {
            this.page = 'modmessage';
            let url = location.href;
            if(url.indexOf('show-user-votes') !== -1) return;
            if(url.indexOf(new_page_url) !== -1) {
                if(window.location.hash !== new_page_hash) {
                    this.drawUserLink();
                    document.getElementById('newUserLink').addEventListener('click', () => this.drawModUserPage());
                }
                else this.drawModUserPage();
            }
            else this.drawUserLink();
            this.user = document.querySelector('a[href^="/users"]').firstElementChild.title;
        }

        drawUserLink() {
            let rows = document.querySelectorAll('.ff-row-nowrap');
            if(!rows.length) {
                console.log('No Admin links found');
                return;
            }
            let link = rows[0].querySelector('a[href="/admin/users"]');
            link.insertAdjacentHTML('afterend', '<a id="newUserLink" class="s-btn s-btn__muted s-btn__outlined s-btn__sm d-flex" href="/admin/' + new_page_url + '#users" title="New Mod User Page"><div class="flex--item">Users(NEW)</div></a>');
        }

        drawModUserPage() {
            document.title = 'New Mod Users Page';
            let container = document.querySelector('div.content-page');
            container.innerHTML = '<style>#newModUserNav button { margin: 0 5px; } .myUserActions { background-color: rgb(225, 236, 244); }</style>';
            this.nav_div = document.createElement('div');
            this.nav_div.id = 'newModUserNav';
            this.nav_div.style.margin = '25px 24px 20px';
            Object.keys(mod_page_list).forEach(key => {
                let button = document.createElement('button');
                button.innerText = mod_page_list[key].label;
                button.classList.add('s-btn', 's-btn__xs', 's-btn__filled');
                button.addEventListener('click', (evt) => this.loadModUserContent(evt, mod_page_list[key]));
                this.nav_div.append(button);
            });

            this.content_div = document.createElement('div');

            container.append(this.nav_div, this.content_div);
        }

        loadModUserContent(evt, page) {
            this.page = page;
            let button = evt.target;
            this.nav_div.querySelectorAll('button').forEach(elm => {
                elm.classList.add('s-btn__filled');
                elm.classList.remove('s-btn__primary');
            });
            button.classList.add('s-btn__primary');
            button.classList.remove('s-btn__filled');
            this.content_div.innerHTML = '<h1>' + page.label + '</h1>';
            this.page_div = document.createElement('div');
            this.content_div.append(this.page_div);
            fetch('/admin/users/' + page.url).then(response => response.text())
            .then(html => this.processHTML(html) )
                .catch(error => { alert('Error occurred fetching page ' + page.url + '\nError Message: ' + error); });
        }

        loadPage(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            let url = evt.target.href;
            fetch(url).then(response => response.text())
            .then(html => this.processHTML(html) )
                .catch(error => { alert('Error occurred fetching page ' + url + '\nError Message: ' + error); });
        }

        processHTML(html) {
            this.page_div.innerHTML = html;
            let table = this.page_div.querySelector('table');
            table.classList.add('s-table');
            let row = '<thead><tr><th>User</th><th>Text</th></tr></thead>';
            if(this.page.flagcell) row = '<thead><tr><th>Flags</th><th>User</th><th>Text</th></tr></thead>';
            table.insertAdjacentHTML('afterbegin', row);
            // Add listeners so the pagination links load with this script
            let div = this.page_div.querySelectorAll('a.s-pagination--item');
            div.forEach(elm => { elm.addEventListener('click', evt => this.loadPage(evt)) });
            if(this.page.usersearch) {
                let rows = table.querySelectorAll('span.annotime');
                rows.forEach(elm => {
                    if(elm.innerText.indexOf(this.user) !== -1) elm.closest('tr').classList.add('myUserActions');
                });
            }
        }

    }

    let new_mod_users = new NewModUsers();
})();
