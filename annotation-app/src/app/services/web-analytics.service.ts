import { Injectable } from '@angular/core';
declare var common: any;

@Injectable()
export class WebAnalyticsService {
  toRecordDownloadWebAnalytics(url: string) {
    var _paq = (common.lumos._paq = common.lumos._paq || []);
    _paq.push(['trackLink', url, 'download']);
  }

  toTrackEventWebAnalytics(category: string, action: string, name?: string, value?: number) {
    var _paq = (common.lumos._paq = common.lumos._paq || []);
    _paq.push(['trackEvent', category, action, name]);
  }
}
