export const addElementToGraph = (toolItem, x, y, elementName, graph) => {
  if (!toolItem) {
      console.error('addElementToGraph: toolItem is undefined');
      return;
  }

  const { width, height } = toolItem;
  const styleObj = toolItem["style"];
  const style = Object.keys(styleObj)
    .map((attr) => `${attr}=${styleObj[attr]}`)
    .join(";");
  const parent = graph.getDefaultParent();

  let newElement = document.createElement("Feature");
  newElement.setAttribute("name", elementName);
  
  graph.getModel().beginUpdate();
  let vertex;
  try {
    vertex = createVertex(graph, elementName, parent, newElement, x, y, width, height, style);
    //TODO add feature to meta model
  } finally {
    graph.getModel().endUpdate();
  }

  isFeature(elementName) ? getBlur('featureBtn') : getBlur('noteBtn');
  
  // Devolver los datos del vértice
  return {
    toolItem,
    x,
    y,
    elementName,
    id: vertex.id,
    value: vertex.value,
    style: vertex.style,
    geometry: {
      x: vertex.geometry.x,
      y: vertex.geometry.y,
      width: vertex.geometry.width,
      height: vertex.geometry.height,
      relative: vertex.geometry.relative
    }
  };
}

export const createVertex = (graph, elementName, parent, newElement, x, y, width, height, style) => {
var vertex = graph.insertVertex(
  isFeature(elementName) ? parent : null,
  null,
  newElement,
  x,
  y,
  width,
  height,
  style
);
vertex.title = elementName;

if(!isFeature(elementName)){
  vertex.connectable = false;
}
return vertex;
}

export const isFeature = (elementName) => {
return elementName == "New Feature";
}

export const addCell = (toolItem, x, y, graph) => {
return addElementToGraph(toolItem, x, y, "New Feature", graph);
}

export const addNote = (toolItem, x, y, graph) => {
return addElementToGraph(toolItem, x, y, "New Note", graph);
}

export const getBlur = (elementId) => {
document.getElementById(elementId).blur();
}
