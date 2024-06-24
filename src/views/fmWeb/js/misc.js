import { mxGraphModel as mxGraphModel } from 'mxgraph/javascript/mxClient';

export const getDescendants = (cell, descendantsArray, that) => {
  let outgoing = mxGraphModel.prototype.getOutgoingEdges(cell);
  for (let index = 0; index < outgoing.length; index++) {
    const element = outgoing[index];
    if (element.value && typeof element.value.getAttribute === 'function') {
      if (
        !(element.value.getAttribute("type", "").localeCompare("Optional") == 0) &&
        !(element.value.getAttribute("type", "").localeCompare("Mandatory") == 0)
      ) {
        outgoing.splice(index, 1);
      }
    } else {
      outgoing.splice(index, 1);
    }
  }
  let descendants = getTargets(outgoing, that);

  for (let index = 0; index < descendants.length; index++) {
    const element = descendants[index];
    if (findInArray(descendantsArray, element)) {
      descendants.splice(index, 1);
    }
  }

  if (descendants.length > 0) {
    descendantsArray = fuseArrays(descendantsArray, descendants);
    for (let i = 0; i < descendants.length; i++) {
      descendantsArray = getDescendants(descendants[i], descendantsArray, that);
    }
  }
  return descendantsArray;
}

export const getAncestors = (cell, ancestorsArray, that) => {
  let incoming = mxGraphModel.prototype.getIncomingEdges(cell);
  for (let index = 0; index < incoming.length; index++) {
    const element = incoming[index];
    if (element.value && typeof element.value.getAttribute === 'function') {
      if (
        !(element.value.getAttribute("type", "").localeCompare("Optional") == 0) &&
        !(element.value.getAttribute("type", "").localeCompare("Mandatory") == 0)
      ) {
        incoming.splice(index, 1);
      }
    } else {
      incoming.splice(index, 1);
    }
  }

  let ancestors = getSources(incoming, that);
  for (let index = 0; index < ancestors.length; index++) {
    const element = ancestors[index];
    if (findInArray(ancestorsArray, element)) {
      ancestors.splice(index, 1);
    }
  }

  if (ancestors.length > 0) {
    ancestorsArray = fuseArrays(ancestorsArray, ancestors);
    for (let i = 0; i < ancestors.length; i++) {
      ancestorsArray = getAncestors(ancestors[i], ancestorsArray, that);
    }
  }

  return ancestorsArray;
}

export const getRelationships = (relationshipType, allCells) => {
  let edges = new Array();
  for (let i = 0; i < allCells.length; i++) {
    if (!allCells[i].isVertex()) {
      if (allCells[i].value && typeof allCells[i].value.getAttribute === 'function' &&
          allCells[i].value.getAttribute("type", "") == relationshipType) {
        edges.push(allCells[i]);
      }
    }
  }
  return edges;
}

export const filterSource = (sourceVertex, arrayEdges, that) => {
  let finalArray = new Array();
  for (let i = 0; i < arrayEdges.length; i++) {
    if (that.graph.getModel().getTerminal(arrayEdges[i], true) == sourceVertex) {
      finalArray.push(arrayEdges[i]);
    }
  }
  return finalArray;
}

export const filterTarget = (targetVertex, arrayEdges, that) => {
  let finalArray = new Array();
  for (let i = 0; i < arrayEdges.length; i++) {
    if (that.graph.getModel().getTerminal(arrayEdges[i], false) == targetVertex) {
      finalArray.push(arrayEdges[i]);
    }
  }
  return finalArray;
}

export const getSources = (arrayEdges, that) => {
  let arraySources = new Array();
  for (let i = 0; i < arrayEdges.length; i++) {
    arraySources.push(that.graph.getModel().getTerminal(arrayEdges[i], true));
  }
  return arraySources;
}

export const getTargets = (arrayEdges, that) => {
  let arrayTargets = new Array();
  for (let i = 0; i < arrayEdges.length; i++) {
    arrayTargets.push(that.graph.getModel().getTerminal(arrayEdges[i], false));
  }
  return arrayTargets;
}

export const compareVertex = (arrayVertexA, arrayVertexB) => {
  for (let i = 0; i < arrayVertexA.length; i++) {
    for (let j = 0; j < arrayVertexB.length; j++) {
      if (arrayVertexA[i] == arrayVertexB[j]) {
        return true;
      }
    }
  }
  return false;
}

export const findInArray = (arrayVertex, vertex) => {
  for (let i = 0; i < arrayVertex.length; i++) {
    if (arrayVertex[i] == vertex) {
      return true;
    }
  }
  return false;
}

export const fuseArrays = (arrayA, arrayB) => {
  let finalArray = new Array();
  for (let i = 0; i < arrayA.length; i++) {
    if (!finalArray.includes(arrayA[i])) {
      finalArray.push(arrayA[i]);
    }
  }
  for (let i = 0; i < arrayB.length; i++) {
    if (!finalArray.includes(arrayB[i])) {
      finalArray.push(arrayB[i]);
    }
  }
  return finalArray;
}

export const convertXMLToJSON = (xmlObject) => {
  var obj = {};

  if (xmlObject.nodeType == 1) {
    if (xmlObject.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xmlObject.attributes.length; j++) {
        var attribute = xmlObject.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xmlObject.nodeType == 3) {
    obj = xmlObject.nodeValue;
  }

  if (xmlObject.hasChildNodes()) {
    for (var i = 0; i < xmlObject.childNodes.length; i++) {
      var item = xmlObject.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof (obj[nodeName]) == "undefined") {
        obj[nodeName] = convertXMLToJSON(item);
      } else {
        if (typeof (obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(convertXMLToJSON(item));
      }
    }
  }
  return obj;
}
