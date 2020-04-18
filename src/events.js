export function hideOnClickOutside(element, callback) {
  const outsideClickListener = event => {
    if (!element.contains(event.target) && isVisible(element)) {
      callback(event);
    }
  };

  const removeClickListener = () => {
    document.removeEventListener("click", outsideClickListener);
  };

  document.addEventListener("click", outsideClickListener);

  return removeClickListener;
}

const isVisible = elem =>
  !!elem &&
  !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
