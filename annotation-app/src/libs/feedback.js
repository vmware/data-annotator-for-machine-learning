/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

var common = {
    esp: null,
    feedback: (url) => {
        (function (a, b, c, d, e, f) {
            window[d] = window[d] || {};
            window[d]._q = window[d]._q || [];
            ['identify', 'page', 'track', 'metadata'].forEach(function (t) {
                window[d][t] = function () {
                    var e = Array.prototype.slice.call(arguments);
                    e.unshift(t);
                    window[d]._q.push(e);
                };
            });
            window[d].init =
                window[d].init ||
                function (c, n, s) {
                    window[d]._clientId = c;
                    window[d]._clientName = n;
                    window[d]._configs = s || {};
                };

            window[d]._url = c;
            e = a.createElement(b);
            e.src = c;
            e.async = 1;
            f = a.getElementsByTagName(b)[0];
            f.parentNode.insertBefore(e, f);
        })(document, 'script', url, 'esp');
        this.common.esp = esp;
        return esp;
    }

}

