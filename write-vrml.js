"use strict"

var stream = require("stream")
var util = require("util")

module.exports = writeVRML

var STATE = {
  HEADER:             0,
  POSITIONS:          1,
  CELLS:              2,
  V_TEX_COORDS:       3,
  V_TEX_COORD_INDEX:  5,
  F_TEX_COORDS:       6,
  F_TEX_COORD_INDEX:  7,
  V_COLORS:           8,
  F_COLORS:           9,
  F_COLOR_INDEX:      10,
  FOOTER:             11,
  DONE:               12
}

var VRML_HEADER = "#VRML V2.0 utf8\n\nShape { geometry IndexedFaceSet { coord Coordinate { point [ "

var JOIN = Array.prototype.join

function VRMLStream(cells, positions, vUVs, fUVs, vColors, fColors, textureURL) {
  stream.Readable.call(this, {encoding: "utf-8"})
  this.state = STATE.HEADER
  this.counter = 0
  this.secondaryCounter = 0
  this.cells = cells
  this.positions = positions
  this.vUVs = vUVs
  this.fUVs = fUVs
  this.vColors = vColors
  this.fColors = fColors
  this.textureURL = textureURL
}

util.inherits(stream.Readable)

VRMLStream.prototype._read = function(sz) {
  switch(this.state) {
    case STATE.HEADER:
      this.push(VRML_HEADER)
      this.state = STATE.POSITIONS
    break

    case STATE.POSITIONS:
      if(this.counter < this.positions.length) {
        this.push(JOIN.call(this.positions[this.counter++], " "))
        this.push(",")
      } else {
        this.push(" ] } coordIndex [ ")
        this.counter = 0
        this.state = STATE.CELLS
      }
    break
    
    case STATE.CELLS:
      if(this.counter < this.cells.length) {
        this.push(JOIN.call(this.cells[this.counter++]))
        this.push(",-1,")
      } else {
        this.push(" ]")
        this.counter = 0
        if(this.vUVs) {
          this.state = STATE.V_TEX_COORDS
        } else if(this.fUVs) {
          this.state = STATE.F_TEX_COORDS
        } else if(this.vColors) {
          this.state = STATE.V_COLORS
        } else if(this.fColors) {
          this.state = STATE.F_COLORS
        } else {
          this.state = STATE.FOOTER
        }
      }
    break
    
    case STATE.V_TEX_COORDS:
      if(this.counter === 0) {
        this.push(" texCoord TextureCoordinate { point [ ")
      }
      if(this.counter < this.vUVs.length) {
        this.push(JOIN.call(this.vUVs[counter++], " "))
        this.push(", ")
      } else {
        this.push("] } texCoordIndex [ ")
        this.counter = 0
        this.state = STATE.V_TEX_COORD_INDEX
      }
    break
    
    case STATE.V_TEX_COORD_INDEX:
      if(this.counter < this.faces.length) {
        this.push(JOIN.call(this.cells[this.counter++]))
        this.push(",-1,")
      } else {
        this.counter = 0
        this.push(" ]")
        if(this.vColors) {
          this.state = STATE.V_COLORS
        } else if(this.fColors) {
          this.state = STATE.F_COLORS
        } else {
          this.state = STATE.FOOTER
        }
      }
    break
    
    case STATE.F_TEX_COORDS:
      if(this.counter === 0) {
        this.push(" texCoord TextureCoordinate { point [ ")
      }
      if(this.counter < this.fUVs.length) {
        var fuv = this.fUVs[this.counter++]
        for(var j=0, n=fuv.length; j<n; ++j) {
          this.push(JOIN(fuv[j], " "))
          this.push(", ")
        }
      } else {
        this.push("] } texCoordIndex [ ")
        this.counter = 0
        this.secondaryCounter = 0
        this.state = STATE.F_TEX_COORD_INDEX
      }
    break
    
    case STATE.F_TEX_COORD_INDEX:
      if(this.counter < this.faces.length) {
        var f = this.faces[this.counter++]
        for(var j=0, n=f.length; j<n; ++j) {
          this.push((this.secondaryCounter++) + ",")
        }
        this.push("-1")
      } else {
        this.push(" ]")
        this.counter = 0
        this.secondaryCounter = 0
        if(this.vColors) {
          this.state = STATE.V_COLORS
        } else if(this.fColors) {
          this.state = STATE.F_COLORS
        } else {
          this.state = STATE.FOOTER
        }
      }
    break
    
    case STATE.V_COLORS:
      if(this.counter === 0) {
        this.push(" color Color { color [ ")
      }
      if(this.counter < this.vColors.length) {
        this.push(JOIN.call(this.vColors[this.counter++]))
        this.push(",")
      } else {
        this.push(" ] colorPerVertex TRUE ")
        this.counter = 0
        this.state = STATE.FOOTER
      }
    break
    
    case STATE.F_COLORS:
      if(this.counter === 0) {
        this.push(" color Color { color [ ")
      }
      if(this.counter < this.fColors.length) {
        this.push(JOIN.call(this.fColors[this.counter++]))
        this.push(",")
      } else {
        this.push(" ] } colorPerVertex FALSE colorIndex [ ")
        this.counter = 0
        this.state = STATE.F_COLOR_INDEX
      }
    break
    
    case STATE.F_COLOR_INDEX:
      if(this.counter < this.cells.length) {
        this.push((this.counter++) + " ")
      } else {
        this.push("]")
        this.counter = 0
        this.state = STATE.FOOTER
      }
    break
    
    case FOOTER:
      if(this.textureURL) {
        this.push(" } appearance Appearance { texture ImageTexture { url \"")
        this.push(this.textureURL)
        this.push("\" } } }")
      } else {
        this.push(" } }")
      }
      this.push(null)
      this.state = STATE.DONE
    break
    
    default:
      throw new Error("write-vrml: Read past end of stream")
  }
}

function writeVRML(attributes) {
  var cells = attributes.cells
  var positions = attributes.positions
  var vertexUVs = attributes.vertexUVs
  var faceUVs = attributes.faceUVs
  var vertexColors = attributes.vertexColors
  var faceColors = attributes.faceColors
  var textureURL = attributes.textureURL
  if(!cells) {
    throw new Error("write-vrml: Missing 'cells' field")
  }
  if(!positions) {
    throw new Error("write-vrml: Missing 'positions' field")
  }
  return new VRMLStream(
    cells,
    positions,
    vertexUVs,
    faceUVs,
    vertexColors,
    faceColors,
    textureURL)
}