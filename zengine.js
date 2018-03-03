/*
 zengine.js - 3D Rending Software designed to work with the HTML5 Canvas
 Copyright (c) 2018 Joe Iddon. All right reserved.

 This library is free software; you are free to redistribute it and/or
 modify it provided appropriate credit is given to the original author.
 
 GitHub Repository:
 https://github.com/RoadKillCat/3dSimulationVR/
 
 Author's website:
 http://joeiddon.me/
*/

/*
The main function - zengine.render() - renders
a "world" from the perspective of a "cam" to a canvas, with
a wireframe option.

The world is described by an array of faces. Each face is itself
described by an object with attributes: "verts" for verticies and
"col" for colour. The value of "verts" should be an array of
coordinates - each described by an object with "x", "y" and "z"
attributes (the values being floats or integers). The value of "col"
should be a CSS color string.

This can be summarised by the following general-case format.
    world = [{verts: [{x: ,y: ,z: }, {x: ,y: ,z: }, ...], col: }, ...]

The cam is merely an object with the following attributes:
  x, y, z  cooridinate in 3D Cartesian Geometry,
  yaw      rotation left to right,
  pitch    rotation up and down,
  roll     rotation about the "forward" axis,
  fov      the, horizontal, field of view, in degrees.

This can be seen in a general-case format.
    cam = {x: ,y: ,z: ,yaw: ,pitchi: ,roll: ,fov: }

The canvas is simply a HTML Canvas Element Object.
WARNING: calling this function will blank the canvas before drawing
         to it.

The wireframe parameter is simply a boolean.
*/

"use strict";

var zengine = {
    render: function(world, cam, canvas, wireframe){
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        //order the faces in the world **furthest to closest**
        if (!wireframe) world.sort((a, b) => this.distance(this.centroid(b.verts), cam) -
                                             this.distance(this.centroid(a.verts), cam));

        for (var f = 0; f < world.length; f++){
            //align 3d coordinates to camera view angle
            var acs = world[f].verts.map(this.translate(-cam.x, -cam.y, -cam.z))
                                    .map(this.z_axis_rotate(this.to_rad(cam.yaw)))
                                    .map(this.y_axis_rotate(this.to_rad(cam.roll)))
                                    .map(this.x_axis_rotate(this.to_rad(cam.pitch)))
                                    .map(this.translate(cam.x, cam.y, cam.z));

            //convert the 3d coordinates to yaw, pitch angles from cam center line
            var cas = acs.map(c => ({y: this.to_deg(Math.atan2(c.x - cam.x, c.y - cam.y)),
                                     p: this.to_deg(Math.atan2(c.z - cam.z, c.y - cam.y))}));

            //convert angles to 2dcanvas coordinates
            var cos = cas.map(a => ({x: canvas.width/2  + (a.y * (canvas.width/cam.fov)),
                                     y: canvas.height/2 - (a.p * (canvas.width/cam.fov))}));

            //if (!cos.some(c => this.on_screen(c, cnvs.width, cnvs.height))) continue;

            //draw the face on the canvas
            ctx.beginPath(cos[0].x, cos[0].y);
            for (let i = 0; i < cos.length; i++){
                ctx.lineTo(cos[i].x, cos[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = wireframe ? "white" : "black";
            ctx.stroke();
            if (!wireframe){
                ctx.fillStyle = world[f].col;
                ctx.fill();
            }
        }
    },

    centroid: function(verts){
        var l = verts.length;
        var c = {x: 0, y: 0, z: 0};
	    for (var i = 0; i < l; i++)
        for (let k in c) c[k] += verts[i][k];
	    return {x: c.x/l, y: c.y/l, z: c.z/l};
    },

    on_screen: (c, w, h) => c.x > 0 && c.y > 0 && c.x < w && c.y < h,
    dot_prod: (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z,
    translate: (x, y, z) => (v => ({x: v.x + x, y: v.y + y, z: v.z + z})),
    distance: (c1, c2) => Math.sqrt(Math.pow(c2.x - c1.x , 2) + Math.pow(c2.y - c1.y , 2) + Math.pow(c2.z - c1.z , 2)),
    x_axis_rotate: (r) => (v => ({x: v.x,                                    y: v.y * Math.cos(r) + v.z * Math.sin(r),  z: -v.y * Math.sin(r) + v.z * Math.cos(r)})),
    y_axis_rotate: (r) => (v => ({x: v.x * Math.cos(r) + v.z * Math.sin(r),  y: v.y,                                    z: -v.x * Math.sin(r) + v.z * Math.cos(r)})),
    z_axis_rotate: (r) => (v => ({x: v.x * Math.cos(r) - v.y * Math.sin(r),  y: v.x * Math.sin(r) + v.y * Math.cos(r),  z:  v.z})                                  ),
    to_deg: (r) => r * (180 / Math.PI),
    to_rad: (d) => d * (Math.PI / 180)
}
