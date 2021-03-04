/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

import "rxjs/Rx";

@Injectable()
export class GetElementService {

    private renderer: Renderer2

    constructor(
        private rendererFactory: RendererFactory2

    ) {
        this.renderer = this.rendererFactory.createRenderer(null, null);
    }



    toFindDomAddClass(dom, newClass) {
        this.renderer.addClass(dom, newClass);

    }


    toFindDomAddText(dom, newText, newClass) {
        this.renderer.setProperty(dom, 'innerHTML', newText);
        this.renderer.addClass(dom, newClass)
    }


    toCreateClear(txtRowEntityDom, pDom, newClass, styleClass, spansList, indexDom, badgeDom) {
        let dom = this.renderer.createElement('span');
        this.renderer.appendChild(dom, this.renderer.createText('×'));
        this.renderer.appendChild(txtRowEntityDom, dom);
        this.renderer.addClass(dom, newClass);
        this.renderer.addClass(dom, styleClass);
        this.toListenMouseIn(txtRowEntityDom, dom);
        this.toListenMouseOut(txtRowEntityDom, dom);
        this.renderer.listen(dom, 'mouseup', (e) => {
            event.stopPropagation();
            this.renderer.removeClass(this.renderer.parentNode(dom), 'txtEntityLabel');
            this.renderer.setProperty(this.renderer.parentNode(dom), 'innerHTML', '');
            this.renderer.removeClass(pDom, 'selectedTxtRow');
            pDom.style.backgroundColor = "";
            badgeDom.style.background = "";
            // to update the spansList
            spansList.forEach((e, i) => {
                if (e.line == pDom.className.split(' ')[0].split('-').pop()) {
                    spansList.splice(i, 1);
                    this.renderer.removeClass(indexDom, 'selectedRowIndex');
                    this.renderer.addClass(indexDom, 'rowIndex');

                }
            });
        });
        return spansList;


    }


    toListenMouseIn(domMouseover, domTarget) {
        this.renderer.listen(domMouseover, 'mouseenter', (e) => {
            let classList = e.target.className.split(' ');
            if (classList.indexOf('txtEntityLabel') > -1 || classList.indexOf('selectedTxtRow') > -1) {
                this.toFindDomAddClass(domMouseover, 'selected')
            }
            this.renderer.setStyle(domTarget, 'background-color', 'black');
            this.renderer.setStyle(domTarget, 'color', 'white');
        })

    }



    toListenMouseOut(domMouseover, domTarget) {
        this.renderer.listen(domMouseover, 'mouseleave', () => {
            this.renderer.removeClass(domMouseover, 'selected')
            this.renderer.setStyle(domTarget, 'background-color', 'transparent');
            this.renderer.setStyle(domTarget, 'color', 'transparent');

        })

    }


    toClearSelected(txtRowEntityDom, pDom, clearDom, spansList, indexDom, badgeDom) {
        this.renderer.listen(txtRowEntityDom, 'click', (e) => {
            let classList = e.target.className.split(' ');
            if (classList.indexOf('selected') > -1 && classList.indexOf('txtEntityLabel') > -1) {
                this.renderer.removeClass(txtRowEntityDom, 'txtEntityLabel');
                this.renderer.setProperty(txtRowEntityDom, 'innerHTML', '');
                this.renderer.removeClass(pDom, 'selectedTxtRow');
                pDom.style.backgroundColor = "";
                txtRowEntityDom.style.backgroundColor = "";
                badgeDom.style.background = "";


                // to update the spansList
                spansList.forEach((e, i) => {
                    if (e.line == pDom.className.split(' ')[0].split('-').pop()) {
                        spansList.splice(i, 1);
                        this.renderer.removeClass(indexDom, 'selectedRowIndex');
                        this.renderer.addClass(indexDom, 'rowIndex');

                    }
                });
            }

        });


        this.renderer.listen(pDom, 'click', (e) => {
            let classList = e.target.className.split(' ');
            if (classList.indexOf('selected') > -1 && classList.indexOf('selectedTxtRow') > -1) {

                this.renderer.removeClass(txtRowEntityDom, 'txtEntityLabel');
                this.renderer.setProperty(txtRowEntityDom, 'innerHTML', '');
                this.renderer.removeClass(pDom, 'selectedTxtRow');
                pDom.style.backgroundColor = "";
                txtRowEntityDom.style.backgroundColor = "";
                badgeDom.style.background = "";

                // to update the spansList
                spansList.forEach((e, i) => {
                    if (e.line == classList[0].split('-').pop()) {
                        spansList.splice(i, 1);
                        this.renderer.removeClass(indexDom, 'selectedRowIndex');
                        this.renderer.addClass(indexDom, 'rowIndex');

                    }
                });
            }

        });
        return spansList;
    }





}
