<template>
  <el-dialog
    title="Cardinality Input"
    :visible.sync="modelThat.dialogFormVisible"
    :close="handleClose"
  >
    <el-form>
      <el-form-item label="Minimum Cardinality" :label-width="modelLabelWidth">
        <el-input-number
          v-model="modelThat.inputMinCar"
          controls-position="right"
          :min="0"
        ></el-input-number>
      </el-form-item>
      <el-form-item label="Maximum Cardinality" :label-width="modelLabelWidth">
        <el-input-number
          v-model="modelThat.inputMaxCar"
          controls-position="right"
          :min="0"
        ></el-input-number>
      </el-form-item>
    </el-form>
    <template v-slot:footer>
      <span class="dialog-footer">
        <el-button @click="handleClose(modelThat)">Cancel</el-button>
        <el-button type="primary" @click="carInputSave(modelThat)">Confirm</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script>
import { mxUtils as MxUtils } from "mxgraph/javascript/mxClient";
import { def01, def02, cst01, cst03 } from "./js/ruler.js";

export default {
  name: 'CardinalityInputComponent',
  props: ['modelLabelWidth', 'modelThat'],
  methods: {
    carInputSave(modelThat) {
      modelThat.dialogFormVisible = false;

      let minCardinality = modelThat.inputMinCar;
      let maxCardinality = modelThat.inputMaxCar;
      let edge = modelThat.graph.getSelectionCell();

      if (minCardinality == null || maxCardinality == null) {
        MxUtils.alert(
          "You didn't complete the min or max cardinality input request or canceled it, so the relationship will be removed"
        );
        modelThat.graph.removeCells([edge]);
        return;
      }

      // Apply rules
      if (modelThat.relationType == "Mandatory") {
        def01(minCardinality, modelThat, edge);
      } else if (modelThat.relationType == "Optional") {
        def02(minCardinality, modelThat, edge);
      }

      if (!(minCardinality >= 0 && minCardinality <= maxCardinality)) {
        cst01(modelThat, edge);
      }

      cst03(modelThat, edge);

      // Update the edge attributes
      edge.setAttribute("minCardinality", minCardinality);
      edge.setAttribute("maxCardinality", maxCardinality);
      modelThat.graph.refresh();

      // Emit an update event
      const data = {
        id: edge.id,
        geometry: edge.getGeometry() ? {
          x: edge.getGeometry().x,
          y: edge.getGeometry().y,
          width: edge.getGeometry().width,
          height: edge.getGeometry().height,
        } : null,
        value: edge.value,
        username: modelThat.user.username // Agregar el nombre de usuario
      };
      modelThat.isLocalEvent && modelThat.socket.emit('updateNode', data);

      this.resetCardinalities(modelThat);
      modelThat.validateModel();
    },
    resetCardinalities(modelThat) {
      modelThat.inputMinCar = 0;
      modelThat.inputMaxCar = 0;
    },
    handleClose(modelThat) {
      this.$confirm("Are you sure to close this dialog?")
        .then(() => {
          modelThat.dialogFormVisible = false;
          let edge = modelThat.graph.getSelectionCell();
          modelThat.graph.removeCells([edge]);
          this.$message({
            type: "info",
            message: "Cardinality Input canceled, the relation was removed",
          });
          this.resetCardinalities(modelThat);
        })
        .catch(() => {});
    },
  },
}
</script>
