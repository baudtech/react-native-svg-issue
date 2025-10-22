export const getMapViewbox = svgString => {
  // Regular expression to match the viewBox attribute
  const viewBoxRegex = /viewBox="([^"]+)"/;

  // Extract the viewBox attribute value using regex
  const viewBoxMatch = svgString.match(viewBoxRegex);

  // Split the viewBox value into an array of numbers
  const viewBoxValues = viewBoxMatch[1].split(/\s+/).map(parseFloat);

  const viewbox = {
    viewboxSizeX: viewBoxValues[2],
    viewboxSizeY: viewBoxValues[3],
  };
  return viewbox;
};
