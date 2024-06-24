<template>
  <div class="customToolbarContainer">
    <FileMenuComponent 
      :modelGraph="graph" 
      :modelAppViewName="appViewName" 
      :modelValidModel="validModel"
      @validateModelInFMweb="validateModel"
    />
    <CardinalityInputComponent :modelLabelWidth="labelWidth" :modelThat="this"/>
    
    <div>
      <span>Bienvenido, {{ username }}</span> <!-- Muestra el nombre de usuario -->
    </div>

    <div>
      <el-button @click="createWorkspace">Crear Espacio de Trabajo</el-button>
      <el-input v-model="workspaceIdToJoin" placeholder="ID del espacio de trabajo"></el-input>
      <el-button @click="joinWorkspace">Unirse al Espacio de Trabajo</el-button>
    </div>

    <div class="workspace column">
      <div class="toolbarContainer" id="toolbarContainer">
        <ul>
          <li>
            <el-button type="primary" plain style="width: 90%" ref="featureBtn" @click="addCellWrapper(toolbarItems[0], 10, 10, graph)" id="featureBtn" focusable="false">
              <img :src="toolbarItems[0]['icon']"/>
              <span>{{ toolbarItems[0]["title"] }}</span>
            </el-button> 
          </li>
          <li>
            <el-button type="info" plain style="width: 65%" ref="noteBtn" @click="addNoteWrapper(toolbarItems[1], 10, 70, graph)" id="noteBtn" focusable="false">
              <img :src="toolbarItems[1]['icon']"/>
              <span>{{ toolbarItems[1]["title"] }}</span>
            </el-button> 
          </li>
          <br>
          <li>
              <div v-if="!validModel && firstFeatureCreated">
                <span style="font-size:50%">Model problems:</span>
                <ul>
                  <li v-for="problem in modelProblems" :key="problem" style="font-size:50%">
                    * {{problem}}
                  </li>
                </ul>
              </div>
          </li>
          <br>
        </ul>

        <p style="font-size:80%;">Relationship: {{ relationType }}</p>
        
        <ul>
          <li
            v-for="item in relationshipTypes"
            :key="item['title']"
            ref="relItem"
          >
            <el-button
              plain
              type="success"
              style="width: 65%"
              v-on:click="relationType = item['title']"
            >
              <img :src="item['icon']" :alt="item['title']" />
              {{ item["title"] }}
            </el-button>
          </li>
        </ul>
        <br>
      </div>

      <div class="graphContainer" ref="container" id="graphContainer"></div>
    </div>
  </div>
</template>

<script>
  import io from 'socket.io-client'; // Importa socket.io-client
  import {
    mxCell as MxCell,
    mxConnectionConstraint as MxConnectionConstraint,
    mxEvent as MxEvent,
    mxGeometry as MxGeometry,
    mxGraph as MxGraph,
    mxPoint as MxPoint,
    mxShape as MxShape,
    mxUtils as MxUtils,
    mxCodec as MxCodec,
  } from "mxgraph/javascript/mxClient";
  import { relationshipTypes, toolbarItems } from "./js/toolbar";
  import FileMenuComponent from '../../components/fileMenuComponent.vue';
  import { addCell, addNote } from './js/addElements.js';
  import CardinalityInputComponent from './cardinalityInputComponent.vue';
  import { initializeKeyHandler, initializeListeners } from './js/listener.js';
  import '../../style/gabriel.scss';
  import { applyRules } from './js/ruler.js';
  import { convertXMLToJSON } from './js/misc.js';
  import store from '@/store/module/appStore'; // Importa el store

  export default {
    name: 'FMwebView',
    components: {
      FileMenuComponent,
      CardinalityInputComponent,
    },
    computed: {
      toolbarItems: () => toolbarItems,
      relationshipTypes: () => relationshipTypes,
      addNote: () => addNote,
      username() {
        return store.state.user ? store.state.user.username : '';
      }
    },
    data() {
      return {
        graph: null,
        relationType: "Optional",
        featureSelected: false,
        inputMinCar: 0,
        inputMaxCar: 0,
        dialogFormVisible: false,
        labelWidth: "120 px",
        appViewName: "FMweb",
        validModel: false,
        repeatedFeatureNames: [],
        modelProblems: [],
        firstFeatureCreated: false,
        socket: null,
        isLocalEvent: true, // Flag para evitar bucles de eventos
        workspaceId: '', // ID del espacio de trabajo actual
        workspaceIdToJoin: '' // ID del espacio de trabajo al que se quiere unir
      };
    },
    methods: {
      addCellWrapper(toolItem, x, y, graph) {
        this.isLocalEvent = true;
        const featureData = addCell(toolItem, x, y, graph);
        if (featureData) {
          this.firstFeatureCreated = true;
          this.validateModel();
          featureData.workspaceId = this.workspaceId; // Añadir workspaceId a los datos
          this.socket.emit('addFeature', featureData);
        }
      },
      addNoteWrapper(toolItem, x, y, graph) {
        this.isLocalEvent = true;
        const noteData = addNote(toolItem, x, y, graph);
        if (noteData) {
          noteData.workspaceId = this.workspaceId; // Añadir workspaceId a los datos
          this.socket.emit('addNote', noteData);
        }
      },
      handleAddFeature(data) {
        if (!this.isLocalEvent) {
          if (data && this.graph) {
            addCell(data.toolItem, data.x, data.y, this.graph);
          }
        }
      },
      handleAddNote(data) {
        if (!this.isLocalEvent) {
          if (data && this.graph) {
            addNote(data.toolItem, data.x, data.y, this.graph);
          }
        }
      },
      handleDeleteNode(data) {
        if (!this.isLocalEvent) {
          if (data && data.cellIds && this.graph) {
            const cellsToRemove = data.cellIds.map(id => this.graph.getModel().getCell(id));
            this.graph.removeCells(cellsToRemove);
          }
        }
      },
      handleConnectNodes(data) {
        if (!this.isLocalEvent) {
          if (data && this.graph) {
            const source = this.graph.getModel().getCell(data.sourceId);
            const target = this.graph.getModel().getCell(data.targetId);
            if (source && target) {
              const edge = this.graph.insertEdge(this.graph.getDefaultParent(), data.edgeId, '', source, target);
              edge.setStyle(this.getEdgeStyle(data.relationType)); // Apply edge style based on relation type
            }
          }
        }
      },
      handleUpdateNode(data) {
        if (!this.isLocalEvent) {
          const cell = this.graph.getModel().getCell(data.id);
          if (cell) {
            this.graph.getModel().beginUpdate();
            try {
              if (data.geometry) {
                const geometry = new MxGeometry(data.geometry.x, data.geometry.y, data.geometry.width, data.geometry.height);
                this.graph.getModel().setGeometry(cell, geometry);
              }
              if (data.value) {
                if (cell.value.nodeType === 1) {
                  cell.value.setAttribute("name", data.value);
                } else {
                  this.graph.getModel().setValue(cell, data.value);
                }
              }
            } finally {
              this.graph.getModel().endUpdate();
            }
          }
        }
      },
      resetData() {
        this.validModel = false;
        this.repeatedFeatureNames = [];
      },
      validateModel() {
        this.modelProblems = [];
        var hasRepeatedFeatureNames = false;
        var hasRelationships = false;

        this.getRepeatedFeatureNames();
        if (this.repeatedFeatureNames.length > 0) {
          this.modelProblems.push(`Multiple features with the same name: ${this.repeatedFeatureNames}.`);
          hasRepeatedFeatureNames = true;
        } else {
          hasRepeatedFeatureNames = false;
        }
        if (!this.isGraphIncludesRelationships()) {
          this.modelProblems.push(`This model hasn't relationships.`);
          hasRelationships = false;
        } else {
          hasRelationships = true;
        }

        if (hasRepeatedFeatureNames || !hasRelationships) {
          this.validModel = false;
        } else if (!hasRepeatedFeatureNames && hasRelationships) {
          this.validModel = true;
        }
      },
      getRepeatedFeatureNames() {
        var features = convertXMLToJSON(new MxCodec().encode(this.graph.getModel())).root.feature;
        this.repeatedFeatureNames = [];
        if (features && features.length > 0) {
          for (var i = 0; i < features.length; i++) {
            var fixedFeatureName = features[i]['@attributes'].name;
            for (var j = 0; j < features.length; j++) {
              var featureToCompare = features[j]['@attributes'].name;
              if (i != j && featureToCompare == fixedFeatureName && !this.repeatedFeatureNames.includes(featureToCompare)) {
                this.repeatedFeatureNames.push(featureToCompare);
              }
            }
          }
        }
        console.log(this.repeatedFeatureNames);
      },
      isGraphIncludesRelationships() {
        return convertXMLToJSON(new MxCodec().encode(this.graph.getModel())).root.relationship != undefined;
      },
      getFeatures() {
        return convertXMLToJSON(new MxCodec().encode(this.graph.getModel())).root.feature; 
      },
      createGraph() {
        MxGraph.prototype.getAllConnectionConstraints = (terminal) => this.initAllConnectionConstraints(terminal);        
        MxShape.prototype.constraints = this.initPrototypeConstraints();
        let that = this;
        this.graph = new MxGraph(this.$refs.container);
        this.graph.connectionHandler.factoryMethod = (style) => this.initFactoryMethod(style, that);
        this.graph.connectionHandler.addListener(
          MxEvent.CONNECT,
          (sender, evt) => applyRules(that, evt)
        );
      },
      initAllConnectionConstraints(terminal) {
        if (terminal != null && terminal.shape != null) {
          if (terminal.shape.stencil != null) {
            if (terminal.shape.stencil.constraints != null) {
              return terminal.shape.stencil.constraints;
            }
          } else if (terminal.shape.constraints != null) {
            return terminal.shape.constraints;
          }
        }
        return null;
      },
      initFactoryMethod(style, that) {
        let aux = this.initNewRelationship(that, relationshipTypes);
        let newRelationship = aux.newRelationship;
        let relation = aux.relation;
        style = Object.keys(relation.style)
          .map((attr) => `${attr}=${relation.style[attr]}`)
          .join(";");
        return this.initEdge(newRelationship, style);
      },
      initPrototypeConstraints() {
        var prototypeConstraints = [];
        for (var i = 0.25; i < 1 ; i+=0.25) {
          prototypeConstraints.push(
            new MxConnectionConstraint(new MxPoint(i, 0), true)
          );
          prototypeConstraints.push(
            new MxConnectionConstraint(new MxPoint(0, i), true)
          );
          prototypeConstraints.push(
            new MxConnectionConstraint(new MxPoint(1, i), true)
          );
          prototypeConstraints.push(
            new MxConnectionConstraint(new MxPoint(i, 1), true)
          );
        }
        return prototypeConstraints;
      },
      initNewRelationship(that, relationshipTypes) {
        let newRelationship = document.createElement("Relationship");
        newRelationship.setAttribute("type", that.relationType);
        let relation = relationshipTypes.find((obj) => {
          return obj.title === that.relationType;
        });
        newRelationship.setAttribute("relationship", relation.relationship);
        return {
          'newRelationship': newRelationship,
          'relation': relation
        };
      },
      initEdge(newRelationship, style) {
        let edge = new MxCell(newRelationship, new MxGeometry());
        edge.setEdge(true);
        edge.setStyle(style);
        edge.geometry.relative = true;
        return edge;
      },
      initGraph() {
        if (this.R.isNil(this.graph)) {
          return;
        }

        this.graph.setConnectable(true);
        this.graph.setCellsDisconnectable(false);
        this.graph.setPanning(true);
        this.graph.setAllowDanglingEdges(false);
        this.graph.setCellsEditable(true);
        this.graph.setMultigraph(false);
        this.graph.setAllowLoops(false);
        this.graph.convertValueToString = (cell) => this.R.prop("name", cell);
        this.graph.convertValueToString = (cell) => this.initConvertValueToString(cell);

        var that = this;
        initializeKeyHandler(that, this.graph);
        initializeListeners(that, this);

        // Listener para cambios en la geometría de los nodos
        this.graph.getModel().addListener(MxEvent.CHANGE, (sender, evt) => {
          if (this.isLocalEvent) {
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
                  workspaceId: this.workspaceId // Añadir workspaceId a los datos
                };
                this.socket.emit('updateNode', data);
              }
            });
          }
        });
      },
      initConvertValueToString(cell) {
        if (MxUtils.isNode(cell.value) &&
          (cell.value.nodeName.toLowerCase() == "feature" || cell.value.nodeName.toLowerCase() == "note")) {
          return cell.getAttribute("name", "")
        }
        return "";
      },
      getEdgeStyle(relationType) {
        const relation = relationshipTypes.find((obj) => obj.title === relationType);
        return Object.keys(relation.style)
          .map((attr) => `${attr}=${relation.style[attr]}`)
          .join(";");
      },
      createWorkspace() {
        const token = store.state.user ? store.state.user.token : null;
        if (token) {
          this.$http.post('http://localhost:3000/createWorkspace', { token, data: {} })
            .then(response => {
              this.workspaceId = response.data.workspaceId;
              console.log('Workspace created with ID:', this.workspaceId);
              this.socket.emit('joinWorkspace', this.workspaceId); // Unirse automáticamente al espacio de trabajo creado
            })
            .catch(error => {
              console.error('Error creating workspace:', error);
            });
        }
      },
      joinWorkspace() {
        const token = store.state.user ? store.state.user.token : null;
        if (token && this.workspaceIdToJoin) {
          this.$http.post('http://localhost:3000/joinWorkspace', { token, workspaceId: this.workspaceIdToJoin })
            .then(() => {
              this.workspaceId = this.workspaceIdToJoin;
              console.log('Joined workspace with ID:', this.workspaceId);
              this.socket.emit('joinWorkspace', this.workspaceId); // Unirse al espacio de trabajo especificado
            })
            .catch(error => {
              console.error('Error joining workspace:', error);
            });
        }
      }
    },
    mounted() {
      this.createGraph();
      this.initGraph();
      this.$refs.container.style.background = 'url("./mxgraph/images/grid.gif")';

      const token = store.state.user ? store.state.user.token : null;
      this.socket = io('http://localhost:3000', { query: { token } }); // Asegúrate de importar y usar io aquí

      this.socket.on('addFeature', (data) => {
        this.isLocalEvent = false;
        this.handleAddFeature(data);
        this.isLocalEvent = true;
      });

      this.socket.on('addNote', (data) => {
        this.isLocalEvent = false;
        this.handleAddNote(data);
        this.isLocalEvent = true;
      });

      this.socket.on('updateNode', (data) => {
        this.isLocalEvent = false;
        this.handleUpdateNode(data);
        this.isLocalEvent = true;
      });

      this.socket.on('deleteNode', (data) => {
        this.isLocalEvent = false;
        this.handleDeleteNode(data);
        this.isLocalEvent = true;
      });

      this.socket.on('connectNodes', (data) => {
        this.isLocalEvent = false;
        this.handleConnectNodes(data);
        this.isLocalEvent = true;
      });

      this.socket.on('workspaceData', (data) => {
        // Maneja los datos del espacio de trabajo aquí
        console.log('Workspace data received:', data);
      });

      // eslint-disable-next-line no-unused-vars
      this.socket.onAny((eventName, ...args) => {
        this.isLocalEvent = false;
      });
    },
  };
</script>
