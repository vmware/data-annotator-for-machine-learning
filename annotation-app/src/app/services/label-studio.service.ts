/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/

import { Injectable } from '@angular/core';

declare var LabelStudio: any;


@Injectable({
    providedIn: 'root'
})

export class LabelStudioService {
    imageLabelInfo: any;


    constructor() { };


    initLabelStudio(option) {
        // console.log('initLabelStudio:::')
        // console.log("url:::", option.url)
        // console.log(document.getElementById(option.dom));
        // console.log('imagePolyLabelTemplate:::', option.imagePolyLabelTemplate)
        this.imageLabelInfo = new LabelStudio(option.dom, {
            config: `
        <View >
          <Image name="image" value="$image"/>
          ${option.annotationQuestion}
          <RectangleLabels name="rect" toName="image" strokeWidth="5" opacity="0.9" canRotate="false" fillOpacity="0.3">
          ${option.imageRectLabelTemplate}
          </RectangleLabels>
          <PolygonLabels name="poly" toName="image" strokeWidth="5" pointSize="large" opacity="0.9" fillOpacity="0.3">
          ${option.imagePolyLabelTemplate}
          </PolygonLabels>
        </View>
      `,

            interfaces: [

            ],

            task: {
                completions: option.historyCompletions,
                predictions: [],
                id: 1,
                data: {
                    image: option.url
                }
            },


            onSubmitCompletion: function (ls, completion) {
                // console.log("onSubmitCompletion:::ls", ls);
                // console.log("onSubmitCompletion:::completion", completion);
                let bb = ls.completionStore.completions[0].serializeCompletion();
                // console.log(ls.completionStore.completions[0]);
                // console.log('bb:::', bb)

            },


            updateCompletion: function (ls, completion) {
                // console.log("updateCompletion:::ls", ls);
                // console.log("updateCompletion:::completion", completion)

            },


            onDeleteCompletion: function (ls, completion) {
                // console.log("onDeleteCompletion:::ls", ls);
                // console.log("onDeleteCompletion:::completion", completion)

            },


            onEntityCreate: function (region) {
                // console.log("onEntityCreate:::", region)
            },


            onEntityDelete: function (region) {
                // console.log("onEntityDelete:::", region)
            },


            onSkipTask: function (ls) {
                // console.log("onSkipTask:::", ls)
            },


            onLabelStudioLoad: function (LS) {
                var c = LS.completionStore.addCompletion({
                    userGenerate: true,
                });
                this.onLabelStudioLoadInfo = LS.completionStore.selectCompletion(c.id);
                // console.log("onLabelStudioLoadInfo:::", this.onLabelStudioLoadInfo);
            }


        });
        // console.log('imageLabelInfo:::', this.imageLabelInfo);

        if (option.from == 'annotate') {

            // console.log('enableTooltips:::', this.imageLabelInfo.settings.enableTooltips)
            // console.log('enableHotkeys:::', this.imageLabelInfo.settings.enableHotkeys)
            // console.log('showLabels:::', this.imageLabelInfo.settings.showLabels)
            // console.log('continuousLabeling:::', this.imageLabelInfo.settings.continuousLabeling)

            if (!this.imageLabelInfo.settings.enableTooltips) {
                this.imageLabelInfo.settings.toggleLabelTooltips();
            };
            if (this.imageLabelInfo.settings.enableHotkeys) {
                this.imageLabelInfo.settings.toggleHotkeys();
            };
            if (!this.imageLabelInfo.settings.showLabels) {
                this.imageLabelInfo.settings.toggleShowLabels();
            };
            if (!this.imageLabelInfo.settings.continuousLabeling) {
                this.imageLabelInfo.settings.toggleContinuousLabeling();
            };
        } else {
            if (!this.imageLabelInfo.settings.enableTooltips) {
                this.imageLabelInfo.settings.toggleLabelTooltips();
            };
            if (!this.imageLabelInfo.settings.showLabels) {
                this.imageLabelInfo.settings.toggleShowLabels();
            };
            this.imageLabelInfo.completionStore.selectCompletion().setEdit(false);
        };
    };

}
