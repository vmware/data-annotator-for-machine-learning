export default function insertAfter(node, _ref) {
  var nextSibling = _ref.nextSibling,
    parentNode = _ref.parentNode;

  return parentNode.insertBefore(node, nextSibling);
}
