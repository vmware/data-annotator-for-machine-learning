/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export default function insertAfter(node: any, _ref: any) {
  var nextSibling = _ref.nextSibling,
    parentNode = _ref.parentNode;

  return parentNode.insertBefore(node, nextSibling);
}
