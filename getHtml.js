const getHtmlAroundText = (html, searchText, contextSize = 15000) => {
  // Find the position of the search text
  const index = html.toLowerCase().indexOf(searchText.toLowerCase());
  
  // If text not found, return first 15000 chars
  if (index === -1) {
    return html.substring(0, contextSize);
  }
  
  // Calculate start and end positions (centered around the text)
  const halfContext = Math.floor(contextSize / 2);
  const start = Math.max(0, index - halfContext);
  const end = Math.min(html.length, index + searchText.length + halfContext);
  
  // Extract the substring
  let result = html.substring(start, end);
  
  // Try to start at an opening tag to keep structure valid
  const firstOpenTag = result.indexOf('<');
  if (firstOpenTag > 0 && firstOpenTag < 100) {
    result = result.substring(firstOpenTag);
  }
  
  // Try to end at a closing tag to keep structure valid
  const lastCloseTag = result.lastIndexOf('>');
  if (lastCloseTag > result.length - 100 && lastCloseTag !== -1) {
    result = result.substring(0, lastCloseTag + 1);
  }
  
  return result;
};




module.exports = getHtmlAroundText;