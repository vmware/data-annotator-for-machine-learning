/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export function filterTreeLabel(treeArr: any) {
  const findItem = (arr: any) => {
    let res = [];
    if (arr && arr.length > 0) {
      res = arr.filter((item: any) => {
        if (item.children && item.children.length > 0) {
          item.children = childFilter(item.children);
        }
        return item && item.children && item.children.length ? (item.enable = 1) : item.enable;
      });
    }
    return res;
  };
  const childFilter = (childArr: any) => {
    return childArr.filter((item: any) => {
      if (item.children && item.children.length > 0) {
        item.children = childFilter(item.children);
      }
      return item && item.children && item.children.length ? (item.enable = 1) : item.enable;
    });
  };
  return findItem(treeArr);
}
