export function getElementByXpath(xPath) {
  return document.evaluate(xPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

export function getMovablePathParser(xPath) {
  const parentElement = getElementByXpath(xPath);

  if (!parentElement) {
    console.error("XPath로 찾은 요소가 없습니다.");
    return [];
  }

  const hrefs = Array.from(parentElement.querySelectorAll("[href]"))
    .map((el) => el.getAttribute("href"))
    .filter((href) => href !== null);

  return [...new Set(hrefs)];
}
