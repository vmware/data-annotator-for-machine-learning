export function filterTreeLabel(treeArr: any) {
  const findItem = (arr) => {
    let res = arr.filter(item => {
      if (item.children && item.children.length > 0) {
        item.children = childFilter(item.children);
      }
      return (item && item.children && item.children.length) ? item.enable = true : item.enable;
    });
    return res;
  }
  const childFilter = (childArr) => {
    return childArr.filter(item => {
      if (item.children && item.children.length > 0) {
        item.children = childFilter(item.children);
      }
      return (item && item.children && item.children.length) ? item.enable = true : item.enable;
    });
  }
  return findItem(treeArr);
}