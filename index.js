const express = require("express");
const app = express();

app.use(express.static("static"));
app.use(express.static("node_modules/monaco-editor/min"));
app.use("/min-maps",express.static("node_modules/monaco-editor/min-maps"));

app.listen(80, () => console.log("OK!"));