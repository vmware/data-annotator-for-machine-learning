import {
  Component,
  OnInit,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { ClrWizard } from '@clr/angular';
import * as _ from 'lodash';
import { EnvironmentsService } from 'app/services/environments.service';
import { AvaService } from '../../../services/ava.service';
import { Papa } from 'ngx-papaparse';

@Component({
  selector: 'app-set-data',
  templateUrl: './set-data.component.html',
  styleUrls: ['./set-data.component.scss'],
})
export class SetDataComponent implements OnInit, OnChanges {
  @ViewChild('wizard', { static: true }) wizard: ClrWizard;
  @Input() wizardData: any;
  @Output() wizardOuter = new EventEmitter<any>();
  open = true;
  selectLabels: string;
  selectDescription = [];
  textColumns = [];
  clrSelectData = {};
  categoryList: any;

  constructor(
    private env: EnvironmentsService,
    private avaService: AvaService,
    private papa: Papa,
  ) {}

  ngOnInit() {
    this.textColumns = JSON.parse(JSON.stringify(this.wizardData.chooseLabel));
    this.clrSelectData = {
      required: true,
      options: [...['No Labels'], ...this.wizardData.chooseLabel],
      labelText: 'Selected Label Column',
    };
  }

  ngOnChanges() {
    console.log(48, this.wizardData);

    if (this.wizardData.status) {
      console.log(43);
    }
  }
  onReceiveSelectedItem(e) {
    this.selectLabels = e;
    var that = this;
    this.selectDescription = [];
    this.textColumns = _.remove(
      JSON.parse(JSON.stringify(this.wizardData.chooseLabel)),
      function (n) {
        return n != that.selectLabels;
      },
    );
  }

  goBack(): void {
    this.wizard.previous();
  }

  doCancel(): void {
    this.wizard.close();
    // this.resetWizard();
  }

  onCommit() {
    console.log(this.selectLabels, this.selectDescription);
    this.wizardOuter.emit({
      selectLabels: this.selectLabels,
      selectDescription: this.selectDescription,
    });
    const indexArray = [];
    for (let k = 0; k < this.selectDescription.length; k++) {
      indexArray.push(this.wizardData.chooseLabel.indexOf(this.selectDescription[k]));
    }

    // if (this.env.config.enableAWSS3) {
    //   this.avaService.getCloudUrl(this.wizardData.fileLocation).subscribe(
    //     (res) => {
    //       if (res) {
    //         return res;
    //       }
    //     },
    //     (error) => {
    //       console.log('Error:', error);
    //     },
    //   );
    // } else {
    //   // to read the file stream with set-data api
    //   this.papaParse(
    //     `${this.env.config.annotationService}/api/v1.0/datasets/set-data?file=${
    //       this.wizardData.fileLocation
    //     }&token=${
    //       JSON.parse(localStorage.getItem(this.env.config.serviceTitle)).token.access_token
    //     }`,
    //     indexArray,
    //   );
    // }
  }

  //  papaParse(location, indexArray) {
  //   let flag = [];
  //   let count = 0;
  //   let invalidCount = 0;
  //   let selectedLabelIndex = this.wizardData.chooseLabel.indexOf(this.selectLabels);
  //   if (this.wizardData.projectType === 'ner') {
  //     selectedLabelIndex = -1;
  //   }
  //   this.papa.parse(location, {
  //     header: false,
  //     download: true,
  //     dynamicTyping: true,
  //     skipEmptyLines: true,
  //     worker: true,
  //     error: (error) => {
  //       console.log('parse_error: ', error);
  //       // this.setDataComplete = false;
  //       // this.setDataError = true;
  //     },
  //     chunk: (results, parser) => {
  //       const chunkData = results.data;
  //       count += chunkData.length;
  //       const newArray = [];

  //       for (let a = 0; a < chunkData.length; a++) {
  //         const newArray2 = [];
  //         for (let c = 0; c < indexArray.length; c++) {
  //           newArray2.push(chunkData[a][indexArray[c]]);
  //         }
  //         newArray.push(newArray2);

  //         if (
  //           selectedLabelIndex > -1 &&
  //           chunkData[a][selectedLabelIndex] != null &&
  //           chunkData[a][selectedLabelIndex] != ''
  //         ) {
  //           flag.push(chunkData[a][selectedLabelIndex]);
  //         }
  //       }
  //       invalidCount = this.toCaculateInvalid(newArray);
  //     },
  //     complete: (result) => {
  //       if (this.isHasHeader == 'yes') {
  //         flag = flag.slice(1);
  //         count = count - 1;
  //       }

  //       flag = _.uniq(flag);

  //       // to check this is a totally numeric flag or not
  //       const isNumeric = this.toCheckNumeric(flag) == 'no' ? false : true;
  //       // this.totalCase = count;
  //       // this.nonEnglish = invalidCount;
  //       // this.dsDialogForm.get('totalRow').setValue(this.totalCase - this.nonEnglish);
  //       this.identifyCategory(selectedLabelIndex, isNumeric, flag);
  //       // this.setDataComplete = false;
  //       // this.changeSetData = false;
  //       // this.changePreview = false;
  //       this.toEvenlyDistributeTicket();
  //     },
  //   });
  // }

  // toCaculateInvalid(newArray) {
  //   let invalidCount = 0;
  //   for (let b = 0; b < newArray.length; b++) {
  //     if (_.sortedUniq(newArray[b]).length == 1 && _.sortedUniq(newArray[b])[0] == null) {
  //       invalidCount += 1;
  //     }
  //   }
  //   return invalidCount;
  // }

  // toCheckNumeric(flag) {
  //   let isNumeric;
  //   const typeScope = ['Number', 'Null', 'Undefined'];
  //   for (let i = 0; i < flag.length; i++) {
  //     let call = toString.call(flag[i]);
  //     call = _.trimStart(call, '[');
  //     call = _.trimEnd(call, ']');
  //     call = call.split(' ')[1];
  //     if (typeScope.indexOf(call) == -1) {
  //       isNumeric = 'no';
  //       return isNumeric;
  //     }
  //   }
  // }

  // identifyCategory(selectedLabelIndex, isNumeric, flag) {
  //   if (selectedLabelIndex > -1 && !isNumeric) {
  //     // this.isNumeric = false;
  //     // if (flag.length > 50) {
  //     //   this.setDataDialog = true;
  //     //   this.setDataComplete = false;
  //     //   this.overMaxLabelLimit = true;
  //     //   this.totalCase = 0;
  //     //   this.nonEnglish = 0;
  //     //   this.dsDialogForm.get('totalRow').setValue(0);
  //     //   return;
  //     // }
  //     for (let d = 0; d < flag.length; d++) {
  //       if (flag[d] == null || String(flag[d]).trim() == '') {
  //         flag.splice(d, 1);
  //       }
  //       if (flag[d].length > 50) {
  //         // this.overPerLabelLimit = true;
  //         const sliceStr = flag[d].slice(0, 50);
  //         flag.splice(d, 1, sliceStr);
  //       }
  //     }

  //     // if (this.overMaxLabelLimit == false && this.overPerLabelLimit) {
  //     //   this.setDataDialog = true;
  //     //   this.overPerLabelLimit = true;
  //     // }
  //     this.categoryList = flag;
  //     if (this.wizardData.projectType === 'ner') {
  //       // this.dsDialogForm.get('labels').setValue([...this.categoryList, ...this.selectDescription]);
  //     } else {
  //       // this.dsDialogForm.get('labels').setValue(this.categoryList);
  //     }
  //   } else if (selectedLabelIndex > -1 && isNumeric) {
  //     this.isNumeric = true;
  //     this.minLabel = _.min(flag);
  //     this.maxLabel = _.max(flag);
  //     this.dsDialogForm.get('min').setValue(this.minLabel);
  //     this.dsDialogForm.get('max').setValue(this.maxLabel);
  //     this.isShowNumeric = true;
  //   }
  // }
}
