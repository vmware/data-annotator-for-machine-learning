/*
Copyright 2019-2022 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export default function insertAfter(node, _ref) {
  var nextSibling = _ref.nextSibling,
    parentNode = _ref.parentNode;

  return parentNode.insertBefore(node, nextSibling);
}
