write-vrml
==========
A limited VRML serialization module.  This should be sufficient to export static 3D models to VRML format.  Works both in node.js and in browserify.

## Install

    npm install write-vrml

## Example

```javascript
var writeVRML = require("write-vrml")

writeVRML({
  cells: [ [0, 1, 2] ],
  positions: [ [0, 0, 0], [1, 0, 0], [0, 1, 0] ]
}).pipe(process.stdout)
```

## API

### `require("write-vrml")(model)`
Writes a 3D model to a VRML file.  `model` is an object with the following properties:

* `cells` a list of indexed cells representing the facets of the model
* `positions` is a list of vertex positions for the model
* `vertexUVs` is an optional list of per-vertex texture coordinates
* `faceUVs` is an optional list of per-face texture coordinates
* `vertexColors` is an optional list of per-vertex color values
* `faceColors` is an optional list of per-face color values
* `textureURL` is an optional URL for texture data associated to the model

**Returns** A readable stream encoding the mesh data as a VRML (.WRL) type file

## Credits
(c) 2013 Mikola Lysenko. MIT License