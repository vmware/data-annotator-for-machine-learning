/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

import "rxjs/Rx";
import { typeWithParameters } from '@angular/compiler/src/render3/util';
import { resolveTxt } from 'dns';

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


    toCreateClear(txtRowEntityDom, pDom, newClass, styleClass, spansList) {
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
            // to update the spansList
            spansList.forEach((e, i) => {
                if (e.line == pDom.className.split(' ')[0].split('-').pop()) {
                    console.log('delete-entity:::', e)

                    spansList.splice(i, 1)
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


    toClearSelected(txtRowEntityDom, pDom, clearDom, spansList) {
        this.renderer.listen(txtRowEntityDom, 'click', (e) => {
            console.log(88888, 'ininin', e)
            let classList = e.target.className.split(' ');
            if (classList.indexOf('selected') > -1 && classList.indexOf('txtEntityLabel') > -1) {
                console.log('in-toClearSelected-e')
                this.renderer.removeClass(txtRowEntityDom, 'txtEntityLabel');
                this.renderer.setProperty(txtRowEntityDom, 'innerHTML', '');
                this.renderer.removeClass(pDom, 'selectedTxtRow');
                // to update the spansList
                spansList.forEach((e, i) => {
                    if (e.line == pDom.className.split(' ')[0].split('-').pop()) {
                        spansList.splice(i, 1)
                    }
                });
            }

        });


        this.renderer.listen(pDom, 'click', (e) => {
            console.log(111, e)
            let classList = e.target.className.split(' ');
            if (classList.indexOf('selected') > -1 && classList.indexOf('selectedTxtRow') > -1) {
                console.log('in-toClearSelected-c')

                this.renderer.removeClass(txtRowEntityDom, 'txtEntityLabel');
                this.renderer.setProperty(txtRowEntityDom, 'innerHTML', '');
                this.renderer.removeClass(pDom, 'selectedTxtRow');
                // to update the spansList
                spansList.forEach((e, i) => {
                    if (e.line == classList[0].split('-').pop()) {
                        console.log('delete-pdom:::', e)
                        spansList.splice(i, 1)
                    }
                });
            }

        });
        return spansList;
    }





}
