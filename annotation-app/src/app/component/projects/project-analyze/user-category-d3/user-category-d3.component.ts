/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Component, OnInit, ViewChild, ElementRef, enableProdMode, Input } from '@angular/core';
import { tip as d3tip } from 'd3-v6-tip';
import { ApiService } from 'src/app/services/api.service';

enableProdMode();

declare function userChart(options: any): any;
declare function categoryChart(options: any): any;
declare function hierarchicalChart(options: any): any;

@Component({
  selector: 'app-user-category-d3',
  templateUrl: './user-category-d3.component.html',
  styleUrls: ['./user-category-d3.component.scss'],
})
export class UserCategoryD3Component implements OnInit {
  @ViewChild('userChart') userChart: ElementRef;
  @ViewChild('categoryChart') categoryChart: ElementRef;
  @ViewChild('hierarchicalChart') hierarchicalChart: ElementRef;
  @Input() msg: any;

  loadingD3: boolean;
  noAnnotation: boolean;
  userChartDatas: any;
  categoryChartDatas: any;
  isUserD3: boolean = true;
  categoryList;
  notLabeledYet;
  labelledCase;
  chartWidth;

  constructor(private apiService: ApiService, private el: ElementRef) {}

  ngOnInit(): void {
    if (this.msg.labelType === 'HTL') {
      this.categoryList = JSON.parse(this.msg.categoryList);
    } else {
      this.categoryList = this.msg?.categoryList?.split(',');
    }
    this.getChartData();
  }

  ngAfterViewInit() {
    this.resizeD3();
  }

  resizeD3() {
    this.chartWidth = this.el.nativeElement.querySelector(
      this.isUserD3 ? '.userChartBar' : '.categoryChartBar',
    ).offsetWidth;

    const onresize = (dom_elem, callback) => {
      const resizeObserver = new ResizeObserver(() => callback());
      resizeObserver.observe(dom_elem);
    };
    const chartEL = document.getElementById(this.isUserD3 ? 'userChart' : 'categoryChart');
    let that = this;
    onresize(chartEL, function () {
      if (that.labelledCase > 0) {
        that.chartWidth = that.el.nativeElement.querySelector(
          that.isUserD3 ? '.userChartBar' : '.categoryChartBar',
        ).offsetWidth;
        if (that.isUserD3) {
          that.showUserChart(that.userChart.nativeElement, that.userChartDatas, that.chartWidth);
        } else {
          that.showCategoryChart(that.categoryChart.nativeElement, that.categoryChartDatas, that.chartWidth);
        }
      }
    });
  }

  shiftBtnRadio(val) {
    if (val === 'user') {
      this.isUserD3 = true;
    } else {
      this.isUserD3 = false;
    }
    this.getChartData();
  }

  showUserChart(conf, data, width) {
    const items = [];
    for (const f in data) {
      items.push(data[f].name);
    }
    userChart({
      container: conf,
      data,
      labels: items,
      width,
      tip: d3tip(),
    });
  }

  showCategoryChart(conf, data, width) {
    const items = [];
    for (const f in data) {
      items.push(data[f].name);
    }
    if (this.msg.labelType !== 'HTL') {
      categoryChart({
        container: conf,
        data,
        labels: items,
        width,
        tip: d3tip(),
      });
    } else {
      const hitBarData = {
        name: 'flare',
        children: data,
      };
      hierarchicalChart({
        container: conf,
        data: hitBarData,
        width,
        tip: d3tip(),
      });
    }
  }

  getChartData() {
    this.loadingD3 = true;
    this.apiService.getChart(this.msg._id).subscribe(
      (response) => {
        if (response) {
          this.notLabeledYet = response.notLabeledYet;
          this.userChartDatas = response.userCase;
          this.categoryChartDatas = response.labels;
          this.labelledCase = response.labelledCase;
          if (this.msg.totalCase != this.notLabeledYet) {
            this.noAnnotation = false;
            if (this.isUserD3) {
              try {
                this.showUserChart(this.userChart.nativeElement, this.userChartDatas, this.chartWidth);
                this.loadingD3 = false;
              } catch (err) {
                this.loadingD3 = false;
              }
            }
            if (!this.isUserD3) {
              try {
                this.showCategoryChart(this.categoryChart.nativeElement, this.categoryChartDatas, this.chartWidth);
                this.loadingD3 = false;
              } catch (err) {
                this.loadingD3 = false;
              }
            }
            this.resizeD3();
          } else {
            this.loadingD3 = false;
            this.noAnnotation = true;
          }
        }
      },
      (error) => {
        this.loadingD3 = false;
        this.noAnnotation = false;
      },
    );
  }
}
