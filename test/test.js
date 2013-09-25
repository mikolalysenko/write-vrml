"use strict"

var writeVRML = require("../write-vrml.js")

writeVRML({
  cells: [ [0, 1, 2] ],
  positions: [ [0, 0, 0], [1, 0, 0], [0, 1, 0] ],
  textureURL: "http://poop.com/test.png"
}).pipe(process.stdout)