/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/


var common = {
  lumos: null,
  feedback: (url) => {
    window["_paq"] = window["_paq"] || [];
    (function (a, b, c, d, e, f) {
      window[d] = window[d] || {};
      window[d]._q = window[d]._q || [];
      ['identify', 'page', 'track', 'metadata', 'locale', 'theme'].forEach(function (t) {
        window[d][t] = function () {
          var e = Array.prototype.slice.call(arguments); e.unshift(t); window[d]._q.push(e);
        }
      });
      window[d]._url = c;
      window[d].init = window[d].init || function (p, q, r) {
        window[d]._clientId = p; window[d]._clientName = q; window[d]._configs = r || {};
        let eVar = e;
        eVar = a.createElement(b); eVar.async = 1; eVar.src = c + '?client_id=' + p + '&namespace=' + d;
        let fVar = f;
        fVar = a.getElementsByTagName(b)[0]; fVar.parentNode.insertBefore(eVar, fVar);
      };
    })(document, 'script', url, 'lumos');

    this.common.lumos = lumos;
    return lumos;
  },
};


