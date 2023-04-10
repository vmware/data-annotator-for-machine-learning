/*
Copyright 2019-2023 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
import insertAfter from './index.es5';

function isTextNode(node: any) {
  const TEXT_NODE = 3;
  return node.nodeType === TEXT_NODE;
}

function getNextNode(node: any) {
  if (node.firstChild) return node.firstChild;
  while (node) {
    if (node.nextSibling) return node.nextSibling;
    node = node.parentNode;
  }
}

function getNodesInRange(range: any) {
  var start = range.startContainer;
  var end = range.endContainer;
  var commonAncestor = range.commonAncestorContainer;
  var nodes = [];
  var node;

  // walk parent nodes from start to common ancestor
  for (node = start.parentNode; node; node = node.parentNode) {
    nodes.push(node);
    if (node === commonAncestor) break;
  }
  nodes.reverse();

  // walk children and siblings from start until end is found
  for (node = start; node; node = getNextNode(node)) {
    nodes.push(node);
    if (node === end) break;
  }

  return nodes;
}

function splitText(node: any, offset: any) {
  let tail = node.cloneNode(false);
  tail.deleteData(0, offset);
  node.deleteData(offset, node.length - offset);
  return insertAfter(tail, node);
}

function highlightRange(normedRange: any, cssClass: any, cssStyle: any) {
  if (typeof cssClass === 'undefined' || cssClass === null) {
    cssClass = 'spanMarked';
  }

  const allNodes = getNodesInRange(normedRange._range);
  const textNodes = allNodes.filter((n) => isTextNode(n));

  var white = /^\s*$/;

  var nodes = textNodes;

  let start = 0;
  if (normedRange._range.startOffset === nodes[start].length) {
    start++;
  }

  let nlen = nodes.length;
  if (nlen > 1 && nodes[nodes.length - 1].length !== normedRange._range.endOffset) {
    nlen = nlen - 1;
  }
  const results = [];
  for (var i = start, len = nlen; i < len; i++) {
    var node = nodes[i];
    if (!white.test(node.nodeValue)) {
      var hl = window.document.createElement('span');
      hl.style.backgroundColor = cssStyle.backgroundColor;
      hl.className = cssClass;
      node.parentNode.replaceChild(hl, node);
      hl.appendChild(node);
      results.push(hl);
    }
  }
  return results;
}

function splitBoundaries(range: any) {
  let { startContainer, startOffset, endContainer, endOffset } = range;

  if (isTextNode(endContainer)) {
    if (endOffset > 0 && endOffset < endContainer.length) {
      endContainer = splitText(endContainer, endOffset);
      range.setEnd(endContainer, 0);
    }
  }

  if (isTextNode(startContainer)) {
    if (startOffset > 0 && startOffset < startContainer.length) {
      if (startContainer === endContainer) {
        startContainer = splitText(startContainer, startOffset);
        range.setEnd(startContainer, endOffset - startOffset);
      } else {
        startContainer = splitText(startContainer, startOffset);
      }
      range.setStart(startContainer, 0);
    }
  }
}

const toGlobalOffset = (container: any, element: any, len: any) => {
  let pos = 0;
  const count = (node: any) => {
    if (node === element) {
      return pos;
    }
    if (node.nodeName === '#text') pos = pos + node.length;
    if (node.nodeName === 'BR') pos = pos + 1;

    for (var i = 0; i <= node.childNodes.length; i++) {
      const n = node.childNodes[i];
      if (n) {
        const res = count(n);
        if (res !== undefined) return res;
      }
    }
  };

  return len + count(container);
};

function removeSpans(spans: any) {
  var norm = [];

  if (spans) {
    spans.forEach((span: any) => {
      while (span.firstChild) span.parentNode.insertBefore(span.firstChild, span);
      norm.push(span.parentNode);
      span.parentNode.removeChild(span);
    });
  }

  norm.forEach((n) => n.normalize());
}

function findClosestTextNode(node: any, lookBack = false) {
  if (!node) return null;
  if (node.nodeName === '#text') return node;
  const child = findClosestTextNode(lookBack ? node.lastChild : node.firstChild, lookBack);
  if (child) return child;
  return findClosestTextNode(lookBack ? node.previousSibling : node.nextSibling, lookBack);
}

export { removeSpans, toGlobalOffset, highlightRange, splitBoundaries, findClosestTextNode };
