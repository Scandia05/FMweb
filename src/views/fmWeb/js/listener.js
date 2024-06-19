// listener.js
import {
  mxEvent as MxEvent,
  mxUtils as MxUtils,
  mxRectangle as MxRectangle,
  mxKeyHandler as MxKeyHandler,
} from "mxgraph/javascript/mxClient";

export const initializeKeyHandler = (that, graph) => {
  var keyHandler = new MxKeyHandler(graph);

  // Key handler for 'Delete' key
  keyHandler.bindKey(46, function () {
    if (that.graph.isEnabled()) {
      const selectedCells = that.graph.getSelectionCells();
      const cellIds = selectedCells.map(cell => cell.id);
      that.graph.removeCells();
      that.validateModel();
      // Emit the delete event
      that.socket.emit('deleteNode', { cellIds });
    }
  });

  // Key handler for 'Backspace' key
  keyHandler.bindKey(8, function () {
    if (that.graph.isEnabled()) {
      const selectedCells = that.graph.getSelectionCells();
      const cellIds = selectedCells.map(cell => cell.id);
      that.graph.removeCells();
      that.validateModel();
      // Emit the delete event
      that.socket.emit('deleteNode', { cellIds });
    }
  });
};

export const initializeListeners = (that, other) => {
  other.graph.addListener(MxEvent.DOUBLE_CLICK, (graph, evt) => {
    const cell = other.R.pathOr([], ["properties", "cell"], evt);
    displayCellRenameModal(cell, other);
  });

  var iconTolerance = 20;

  other.graph.addMouseListener({
    currentState: null,

    mouseDown: function () {
      // Handle mouse down event
    },
    mouseMove: function (sender, me) {
      if (
        other.currentState != null &&
        (me.getState() == other.currentState || me.getState() == null)
      ) {
        var tol = iconTolerance;
        var rect = new MxRectangle(
          me.getGraphX() - tol,
          me.getGraphY() - tol,
          2 * tol,
          2 * tol
        );
        if (MxUtils.intersects(rect, other.currentState)) {
          return;
        }
      }

      var state = that.graph.view.getState(me.getCell());

      if (
        that.graph.isMouseDown ||
        (state != null && !that.graph.getModel().isVertex(state.cell))
      ) {
        state = null;
      }
    },
    mouseUp: function () {
      // Handle mouse up event
    },
  });

  that.graph.getModel().addListener(MxEvent.CHANGE, function (sender, evt) {
    console.log('MxEvent.CHANGE detected changes:', evt.getProperty('changes'));
    if (that.isLocalEvent) {
      const changes = evt.getProperty('changes');
      changes.forEach(change => {
        if (change.constructor.name === 'mxGeometryChange' || change.constructor.name === 'mxValueChange') {
          const cell = change.cell;
          const geometry = cell.geometry;
          const data = {
            id: cell.id,
            geometry: geometry ? {
              x: geometry.x,
              y: geometry.y,
              width: geometry.width,
              height: geometry.height,
            } : null,
            value: cell.value ? (cell.value.nodeType === 1 ? cell.value.getAttribute("name") : cell.value) : null,
          };
          console.log('Emitting updateNode with data:', data);
          that.socket.emit('updateNode', data);
        }
        if (change.constructor.name === 'mxChildChange' && change.parent === null) {
          const data = { cellIds: [change.child.id] }; // Emitir un array de cellIds
          console.log('Emitting deleteNode with data:', data);
          that.socket.emit('deleteNode', data);
        }
        if (change.constructor.name === 'mxTerminalChange') {
          const data = {
            sourceId: change.cell.source ? change.cell.source.id : null,
            targetId: change.cell.target ? change.cell.target.id : null,
            edgeId: change.cell.id,
            relationType: change.cell.value ? change.cell.value.getAttribute("type") : null
          };
          console.log('Emitting updateConnection with data:', data);
          that.socket.emit('updateConnection', data);
        }
      });
    }
  });
};

export const displayCellRenameModal = (cell, other) => {
  if (cell.vertex) {
    other.$prompt("", "Rename", {
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      inputPattern: /^[A-Za-z0-9ÁáÉéÍíÓóÚú -]*[A-Za-z0-9ÁáÉéÍíÓóÚú][A-Za-z0-9ÁáÉéÍíÓóÚú -]*$/,
      inputErrorMessage: "Invalid Name",
    }).then(({ value }) => {
      let cell = other.graph.getSelectionCell();
      other.graph.getModel().beginUpdate();
      try {
        initializeCell(cell, value, other);
        // Emitir el evento de actualización de nodo
        const geometry = cell.geometry;
        const data = {
          id: cell.id,
          geometry: geometry ? {
            x: geometry.x,
            y: geometry.y,
            width: geometry.width,
            height: geometry.height,
          } : null,
          value: cell.value ? (cell.value.nodeType === 1 ? cell.value.getAttribute("name") : cell.value) : null,
        };
        console.log('Emitting updateNode with data (rename):', data);
        other.socket.emit('updateNode', data);
      } finally {
        other.graph.getModel().endUpdate();
      }
      other.validateModel();
    }).catch(() => {
      other.$message({
        type: "info",
        message: "Input canceled",
      });
    });
  }
};

export const initializeCell = (cell, value, other) => {
  cell.setAttribute("name", value);
  var preferred = other.graph.getPreferredSizeForCell(cell);
  other.graph.updateCellSize(cell, true);
  var current = cell.getGeometry();
  var width = 150;
  var height = 50;
  current.width = preferred.width > width ? preferred.width : width;
  current.height = preferred.height > height ? preferred.height : height;
};
