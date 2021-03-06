
//  override library's controls appearance
fabric.Object.prototype.set({
    borderColor: 'green',
    cornerSize: 16,
    cornerColor: 'blue'});

//  override how fabric renders stroke, from https://stackoverflow.com/a/48343346
fabric.Object.prototype._renderStroke = function (ctx) {
    if (!this.stroke || this.strokeWidth === 0) {
        return;
    }
    if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
    }
    ctx.save();
    // if (this.strokeUniform)
    ctx.scale(1 / this.scaleX, 1 / this.scaleY);
    this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke);
    this._applyPatternGradientTransform(ctx, this.stroke);
    ctx.stroke();
    ctx.restore();
};


fabric.Object.prototype._getTransformedDimensions = function (skewX, skewY) {

    if (typeof skewX === 'undefined') {
        skewX = this.skewX;
    }
    if (typeof skewY === 'undefined') {
        skewY = this.skewY;
    }
    const dimX = this.width / 2,
        dimY = this.height / 2;

    let points = [{
        x: -dimX,
        y: -dimY
    }, {
        x: dimX,
        y: -dimY
    }, {
        x: -dimX,
        y: dimY
    }, {
        x: dimX,
        y: dimY
    }];
    const transformMatrix = this._calcDimensionsTransformMatrix(skewX, skewY, false);
    for (var i = 0; i < points.length; i++) {
        points[i] = fabric.util.transformPoint(points[i], transformMatrix);
    }
    const bbox = fabric.util.makeBoundingBoxFromPoints(points);
    return {
        y: bbox.height + this.strokeWidth,
        x: bbox.width + this.strokeWidth,
    };
};

//  modify Textbox slightly to exit editing when the Enter key is pressed
fabric.Textbox.prototype.onKeyDown = (function(onKeyDown) {
    return function(e) {
    if (e.keyCode === 13)
        canvas.getActiveObject().exitEditing();
    onKeyDown.call(this, e);
  }
})(fabric.Textbox.prototype.onKeyDown);



//  initialise canvas and set initial values for variables
var canvas = new fabric.Canvas('c',{ backgroundColor : '#f8f9fa', hoverCursor: 'pointer'});

var drawingRect = false;
var drawingCircle = false;

var drawingLine = false;
var text;
var canvasInteractive = true;
var scalingMode = true;
var rect, circ, dimXLeft, dimX, dimXRight, dimYTop, dimY, dimYBottom, isDown, isDragging, origX, origY;
var grid = 20;
loadJSON();
renderGrid();
setInteractive();
canvas.renderAll();

// use the download library to download a PNG version of the drawing
// Note: download() is not compatible with iOS devices
function exportPNG() {
    download(canvas.toDataURL('png'), 'sketch', 'image/png');
}

// uses Imgur's API to upload a PNG version to their service, then directs them
function exportImgur() {
    try {
        var img = canvas.toDataURL('png').split(',')[1];
    } catch(e) {
        var img = canvas.toDataURL().split(',')[1];
    }

    $.ajax({
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {
            Authorization: 'Client-ID 979a33e5ac6069c'
        },
        data: {
            title: 'Sketch from: ' + new Date().toLocaleString(),
            image: img
        },
        dataType: 'json',
        success: function(response) {
            if(response.success) {
                window.open(response.data.link,'_blank');
            }
        }
    });
}

//  Saves drawing
function saveJSON(){
    //  Need to pass our custom 'id' property to ensure it's loaded
    var drawing_serial = JSON.stringify(canvas.toJSON(['id', 'category', 'arrow', 'hidden', 'positionOffset', 'lineLen', 'LineAng', 'hasControls']));
    document.getElementById('id_scale').value = scale*20;
    document.getElementById('id_json_string').value= drawing_serial;
}

//  Loads drawing
function loadJSON(){

    canvas.loadFromJSON(loadString);
    renderGrid();
    //  iterate through shape objects, performing scaleDimensions() on them to ensure dimensions are to scale
    canvas.forEachObject(function (object) {
        if (object.category === 'shape'){
            object.setControlsVisibility({ mtr: false });
            canvas.setActiveObject(object);
            scaleDimensions();
        }
    });
}
function posUp(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category !== 'shape');

    canvas.getActiveObject().bringForward();
    dims.forEach( o => {
        o.bringToFront();
    });
    document.getElementById('posVal').value = canvas.getObjects().indexOf(canvas.getActiveObject());
}

function posDown(){
    canvas.getActiveObject().sendBackwards();
    document.getElementById('posVal').value = canvas.getObjects().indexOf(canvas.getActiveObject());
}

function fontIncreaseX(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimX' | o.category === 'dimCirc' | o.category === 'dimLine');

    dims.forEach( o => {
       o.set({ fontSize: o.fontSize + 1 });
    });
    scaleDimensions();
}

function fontDecreaseX(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimX' | o.category === 'dimCirc' | o.category === 'dimLine');

    dims.forEach( o => {
       o.set({ fontSize: o.fontSize - 1 });
    });
    scaleDimensions();
}

function fontIncreaseY(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimY');

    dims.forEach( o => {
       o.set({ fontSize: o.fontSize + 1 });
    });
    scaleDimensions();
}

function fontDecreaseY(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimY');

    dims.forEach( o => {
       o.set({ fontSize: o.fontSize - 1 });
    });
    scaleDimensions();
}

function resetFont(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category !== 'shape');
    dims.forEach( o => {
       o.set({ fontSize: 29 });
    });
    scaleDimensions();
}

// copy+paste code from Fabric.js documentation: http://fabricjs.com/copypaste
function duplicate(){
    var hopefullyUniqueId = Math.random().toString(16).slice(2);

    // copy selected object to 'clipboard'
    canvas.getActiveObject().clone(function(cloned) {
        _clipboard = cloned;
    });

    //
    var dimXes = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimX' | o.category === 'dimCirc' | o.category === 'dimLine');
    var dimYes = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimY');


    // clone again, so you can do multiple copies.
    _clipboard.clone(function(clonedObj) {
        canvas.discardActiveObject();
        clonedObj.set({
            left: clonedObj.left + 10,
            top: clonedObj.top + 10,
            evented: true,
            category: 'shape',
            id: hopefullyUniqueId,
        });

        if (dimXes[0] !== undefined && dimXes[0].category !== 'dimLine')
            var dimXLeft = new fabric.Text('⟵', { arrow: 'left', id: clonedObj.id, category: dimXes[0].category, top: dimXes[0].top + 10, hidden: dimXes[0].hidden, fontSize: dimXes[0].fontSize });
        if (dimXes[0] !== undefined)
            var dimX = new fabric.Textbox(' ' + 100 + ' ', { textAlign: 'center', id: clonedObj.id, category: dimXes[0].category, top: dimXes[0].top + 10, hidden: dimXes[0].hidden, fontSize: dimXes[0].fontSize });
        if (dimXes[0] !== undefined && dimXes[0].category !== 'dimLine')
            var dimXRight = new fabric.Text('⟶', { id: clonedObj.id, arrow: 'right', category: dimXes[0].category, left: clonedObj.left+100, top: dimXes[0].top + 10, hidden: dimXes[0].hidden, fontSize: dimXes[0].fontSize });

        if (dimYes[0] !== undefined){
            var dimYTop = new fabric.Text('⟶', { angle: 270, id: clonedObj.id, arrow: 'left', category: 'dimY', left: dimYes[0].left + 10, hidden: dimYes[0].hidden, fontSize: dimYes[0].fontSize });
            var dimY = new fabric.Textbox(' ' + Math.round(clonedObj.getHeight()*scale) + ' ', { angle: 270, textAlign: 'center', id: clonedObj.id, category: 'dimY', left: dimYes[0].left + 10, hidden: dimYes[0].hidden, fontSize: dimYes[0].fontSize });
            var dimYBottom = new fabric.Text('⟵', { angle: 270, id: clonedObj.id, arrow: 'right', category: 'dimY', left: dimYes[0].left + 10, hidden: dimYes[0].hidden, fontSize: dimYes[0].fontSize });
        }

        if (clonedObj.type === 'activeSelection') {
            // active selection needs a reference to the canvas.
            clonedObj.canvas = canvas;
            clonedObj.forEachObject(function(obj) {
                canvas.add(obj);
            });
            // this should solve the non-selectability
            clonedObj.setCoords();
        } else {
            canvas.add(clonedObj);

            if (dimXes[0] !== undefined && dimXes[0].category !== 'dimLine')
                canvas.add(dimXLeft);
            canvas.add(dimX);
            if (dimXes[0] !== undefined && dimXes[0].category !== 'dimLine')
                canvas.add(dimXRight);

            if (dimYes[0] !== undefined){
                canvas.add(dimYTop, dimY, dimYBottom);
            }
        }
        _clipboard.top += 10;
        _clipboard.left += 10;
        canvas.setActiveObject(clonedObj);
        scaleDimensions();
        if (dimXes[0] !== undefined && dimXes[0].hidden){
            hideDimX();
            hideDimX();
        }
        if (dimYes[0] !== undefined && dimYes[0].hidden){
            hideDimY();
            hideDimY();
        }
        canvas.renderAll();
    });
}

function addMeasure(){
    let line =  canvas.getActiveObject();
    let oldDim;
    if(canvas.getActiveObject().isType('line')){
        if ( canvas.getActiveObject().stroke === 'gray'){
            oldDim = canvas.getObjects().filter(o => o.category === 'dimLine' && o.id === line.id);
            canvas.getActiveObject().set({ strokeDashArray: 0, stroke: 'black' });
            canvas.remove(oldDim[0]);
            dimX = new fabric.Textbox(' ' + 100 + ' ', { textAlign: 'center', id: line.id, category: 'dimLine', hidden: false });
            canvas.add(dimX);
            scaleDimensions();

        }
        else{
            canvas.getActiveObject().set({ strokeDashArray: [5, 5], stroke: 'gray' });

            oldDim = canvas.getObjects().filter(o => o.category === 'dimLine' && o.id === line.id);
            canvas.remove(oldDim[0]);

            dimXLeft = new fabric.Text('⟵', { id: line.id, category: 'dimLine', arrow: 'left', hidden: false, hasControls: false, fontSize: 29 });
            dimX = new fabric.Textbox(' ' + Math.round(line.lineLen*scale) + ' ', { textAlign: 'center', id: line.id, category: 'dimLine', hidden: false, top: 10, width: line.lineLen - dimXLeft.width*2, left: dimXLeft.width*1.3, hasControls: false, fontSize: 29 });
            dimXRight = new fabric.Text('⟶', { id: line.id, category: 'dimLine', arrow: 'right', hidden: false, left: line.lineLen - dimXLeft.width*1.3, hasControls: false, fontSize: 29 });

            let dimLine = new fabric.Group([dimXLeft, dimX, dimXRight], { left: line.left, top: line.top + 30, angle: line.lineAng, originX: 'center', id: line.id, category: 'dimLine', height: 10, hasControls: false });



            if (line.lineAng > 90 || line.lineAng < -90){

                dimX.toggle('flipX');
                dimX.toggle('flipY');
            }

            canvas.add(dimLine);
        }
    }
}

//  create grid - must account for zooming out.
function renderGrid(){
    for (let i = 0; i < (1500 / grid); i++) {
        let lineH = new fabric.Line([ i * grid, 0, i * grid, 1500], { stroke: '#ccc', selectable: false, evented: false, excludeFromExport: true, id: 'grid' });
        let lineV = new fabric.Line([ 0, i * grid, 1500, i * grid], { stroke: '#ccc', selectable: false, evented: false, excludeFromExport: true, id: 'grid' });
        canvas.add(lineH);
        canvas.add(lineV);
        canvas.sendToBack(lineH);
        canvas.sendToBack(lineV);
    }
    canvas.renderAll();
}

function setScalingMode(){
    if (scalingMode){
        scalingMode = false;
        document.getElementById("setScaling").className = "btn btn-light";
        document.getElementById("setScaling").textContent = "Scaling Mode OFF";
    }
    else{
        scalingMode = true;
        document.getElementById("setScaling").className += " btn-dark";
        document.getElementById("setScaling").textContent = "Scaling Mode ON";
    }
}

function skewXMore(){
    canvas.getActiveObject().set({ skewX: canvas.getActiveObject().skewX + 5 });
    canvas.renderAll();
}
function skewXLess(){
    canvas.getActiveObject().set({ skewX: canvas.getActiveObject().skewX - 5 });
    canvas.renderAll();
}

// Zoom functions, zoomLevel allows for a limit to be applied to zoom
let zoomLevel = 0;
function zoomIn(){
    zoomLevel -= 1;
    canvas.setZoom(canvas.getZoom() * 1.1);
    canvas.renderAll();
}

function zoomOut(){
    // limit has been set on zoom-out, zooming out past this point has a severe impact on performance
    if(zoomLevel < 4){
        zoomLevel += 1;
        canvas.setZoom(canvas.getZoom() / 1.1);
    }
    canvas.renderAll();
}

function setInteractMode(){
    disableDrawing();
    disableRect();
    disableCircle();
    disableLine();

    setInteractive();
}

function setInteractive(){
    if (canvasInteractive){
        canvas.forEachObject(function(object){
            object.selectable = false
        });
        canvasInteractive = false;
        document.getElementById("canvasInteract").className = "btn btn-light"
    }
    else{
        canvas.forEachObject(function(object){
            if (object.id !== 'grid' && !object.hidden){
                object.selectable = true
            }
        });
        canvasInteractive = true;
        document.getElementById("canvasInteract").className += " btn-dark";
    }
}

function setDrawingMode() {
    canvas.isDrawingMode = true;
    disableInteract();
    disableRect();
    disableCircle();
    disableLine();

    document.getElementById("freeDraw").className += " btn-dark";
}

function deleteSelected(){
    var activeObject = canvas.getActiveObject(),
        activeGroup = canvas.getActiveGroup();

    if (activeObject){
        var dims = canvas.getObjects().filter(o => o.id === activeObject.id);

        dims.forEach(o => {
            canvas.remove(o);
        });

        canvas.remove(activeObject);
    }
    else if (activeGroup){
        var groupObjects = activeGroup.getObjects();
        canvas.discardActiveGroup();
        groupObjects.forEach(function (object) {
            var dims = canvas.getObjects().filter(o => o.id === object.id);
            dims.forEach(o => {
                canvas.remove(o);
            });
            canvas.remove(object);
        });
    }
    canvas.renderAll();
}

function addRectangle(){
    drawingRect = true;
    disableInteract();
    disableDrawing();
    disableCircle();
    disableLine();

    document.getElementById("drawRect").className += " btn-dark";
}

function addCircle(){
    drawingCircle = true;
    disableInteract();
    disableDrawing();
    disableRect();
    disableLine();

    document.getElementById("drawCirc").className += " btn-dark";
}

function addLine(){
    drawingLine = true;
    disableInteract();
    disableDrawing();
    disableRect();
    disableCircle();

    document.getElementById("drawLine").className += " btn-dark";
}

function updateScale(){

    let shapes = canvas.getObjects().filter(o => o.category === 'shape');
    scale = document.getElementById('scaleInput').value/20;

    document.getElementById("scaleInput").value = scale*20;
        shapes.forEach( o => {
            canvas.setActiveObject(o);
            scaleDimensions();
    });
}

function clearCanvas(){
    if (window.confirm("Are you sure you would like to clear the canvas?")){
        canvas.clear();
        canvas.setBackgroundColor('#f8f9fa');
        renderGrid();
    }
}

//  toggle off methods
function disableInteract(){
    canvasInteractive = true;
    setInteractive();
}
function disableDrawing(){
    canvas.isDrawingMode = false;
    document.getElementById("freeDraw").className = "btn btn-light";
}
function disableRect(){
    drawingRect = false;
    document.getElementById("drawRect").className = "btn btn-light";
}
function disableCircle(){
    drawingCircle = false;
    document.getElementById("drawCirc").className = "btn btn-light";
}
function disableLine(){
    drawingLine = false;
    document.getElementById("drawLine").className = "btn btn-light";
}

function hideDimX(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'dimX' | o.category === 'dimCirc' | o.category === 'dimLine');

    dims.forEach(o => {
        if (o.hidden){
            o.set({ opacity: 100, selectable: true, hidden: false });
        }
        else{
            o.set({ opacity: 0, selectable: false, hidden: true });
        }
    });
    //canvas.renderAll();
    scaleDimensions();
}

function hideDimY(){
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category == 'dimY');

    dims.forEach(o => {
        if (o.hidden){
            o.set({ opacity: 100, selectable: true, hidden: false });
        }
        else{
            o.set({ opacity: 0, selectable: false, hidden: true });
        }
    });
    //canvas.renderAll();
    scaleDimensions();
}

function transformDrawing(assocShape, i){

    if (canvas.getActiveObject().category === 'dimX'){
        var widthDif = canvas.getActiveObject().text - assocShape[i].getWidth()*scale;
        assocShape[i].setWidth(assocShape[i].width + ((widthDif/scale) / assocShape[i].scaleX));
    }
    if (canvas.getActiveObject().category === 'dimY'){
        var heightDif = canvas.getActiveObject().text - assocShape[i].getHeight()*scale;
        assocShape[i].setHeight(assocShape[i].height + (heightDif/scale) / assocShape[i].scaleY);
    }
    if (canvas.getActiveObject().category === 'dimCirc'){
        var radDif = canvas.getActiveObject().text/2 - assocShape[i].getRadiusX()*scale;
        assocShape[i].setRadius(assocShape[i].radius + (radDif/scale) / assocShape[i].scaleX);
    }
    if (canvas.getActiveObject().category === 'dimLine'){
        var desiredLen = canvas.getActiveObject().text;

        while(Math.round(assocShape[i].lineLen*scale) !== desiredLen){
            var lenMultiplyer = desiredLen / (assocShape[i].lineLen*scale);
            assocShape[i].setWidth((assocShape[i].width*lenMultiplyer) / assocShape[i].scaleX);
            assocShape[i].setHeight((assocShape[i].height*lenMultiplyer) / assocShape[i].scaleY);

            assocShape[i].set({ lineLen: Math.sqrt(Math.pow(assocShape[i].getHeight(), 2) + Math.pow(assocShape[0].getWidth(), 2)) });
        }
    }
    canvas.setActiveObject(assocShape[i]);

}

// this method is responsible for ensuring a shape's dimensions move in sync.
// code from documentation: http://fabricjs.com/using-transformations
var multiply = fabric.util.multiplyTransformMatrices;
var invert = fabric.util.invertTransform;
function updateDimensions() {

    // if the selected shape is actually a dimension measurement
    if (canvas.getActiveObject().isType('text') || canvas.getActiveObject().isType('textbox') || canvas.getActiveObject().category === 'dimLine'){

        // code to move the selected dim's counterparts, so that they all move instead of just single arrow
        var assocDims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === canvas.getActiveObject().category);

        assocDims.forEach(o => {
            if (!o.relationship) {
                return;
            }
            var relationship = o.relationship;
            var newTransform = multiply(canvas.getActiveObject().calcTransformMatrix(), relationship);
            opt = fabric.util.qrDecompose(newTransform);
            o.set({
            flipX: false,
            flipY: false,
            });
            o.setPositionByOrigin(
            { x: opt.translateX, y: opt.translateY },
            'center',
            'center'
            );

            o.set(opt);
            o.setCoords();
        });

        return;
    }

    // get array of selected shape's dimensions
    var dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && !canvas.getActiveObject().isType('path'));

    // iterate over each one to translate transformations done on the shape
    dims.forEach(o => {
        if (!o.relationship) {
            return;
        }
        var relationship = o.relationship;
        var newTransform = multiply(canvas.getActiveObject().calcTransformMatrix(), relationship);
        opt = fabric.util.qrDecompose(newTransform);
        o.set({
        flipX: false,
        flipY: false,
        });
        o.setPositionByOrigin(
        { x: opt.translateX, y: opt.translateY },
        'center',
        'center'
        );

        o.set(opt);
        o.setCoords();
    });
}

// this function handles the updating and positioning of measurement labels.
function scaleDimensions(){
    // get array of the selected shape's dimension labels
    let dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id);
    let valWidth, valHeight, valCirc;
    let optFontSize;
    let xArrowWidth;
    let yArrowWidth;
    let arrowHeight;

    // iterate over each dimension label item
    dims.forEach(o => {

        // if the dimension is for measuring the x-dimension
        if (o.category === 'dimX'){

            // adjust fontSize if shape width is below a certain threshold
            if (canvas.getActiveObject().getWidth() < 120){
                optFontSize = 15;
            }
            else{
                if (o.fontSize === 15){
                    optFontSize = 29;
                }
                else if (o.fontSize !== 15 || o.fontSize !== 29){
                    optFontSize = o.fontSize;
                }
            }

            // set fontSize
            o.set({ fontSize: optFontSize });

            if (o.arrow === 'left'){
                // set new position for left arrow
                o.set({ left: canvas.getActiveObject().left});
                // also get new width and height for arrow, required for positioning of the textbox portion of dimension label
                xArrowWidth = o.getWidth();
                arrowHeight = o.getHeight();
            }

            // if the shape falls below a further width threshold, make the arrows disappear
            if (canvas.getActiveObject().getWidth() < 50 && o.arrow === 'left' | o.arrow === 'right'){
                o.set({ opacity: 0 });
            }
            else if (canvas.getActiveObject().getWidth() > 50 && !o.hidden){
                o.set({ opacity: 100 });
            }


            if (o.isType('textbox')) {
                // fully center the textbox if the shape reaches a certain width threshold
                if (canvas.getActiveObject().getWidth() < 50){
                    o.set({ width: Math.round(canvas.getActiveObject().getWidth())});
                    o.set({ left: canvas.getActiveObject().left});
                }
                else{
                    // if not, width must account for width of the arrows
                    o.set({ width: Math.round(canvas.getActiveObject().getWidth()) - xArrowWidth * 2});
                    // as must the position
                    o.set({ left: canvas.getActiveObject().left + xArrowWidth});
                }

                // set text to whatever the width is
                o.set({ text: ' ' + Math.round(canvas.getActiveObject().getWidth() * scale)  + ' '});

                // get height and width
                valWidth = o.getWidth()
            }
            if (o.arrow === 'right'){
                // position of right arrow needs to account for textbox width and left arrow width
                o.set({ left: canvas.getActiveObject().left + valWidth + xArrowWidth});
            }
        }
        // if dimension label is for Y-dimension
        if (o.category === 'dimY'){
            if (canvas.getActiveObject().getHeight() < 120){
                optFontSize = 15;
            }
            else{
                if (o.fontSize === 15){
                    optFontSize = 29;
                }
                else if (o.fontSize !== 15 || o.fontSize === 29){
                    optFontSize = o.fontSize;
                }
            }
            o.set({ fontSize: optFontSize });

            if (o.arrow === 'left'){
                yArrowWidth = o.getWidth();
                o.set({ top: canvas.getActiveObject().top + yArrowWidth});
            }

            if (canvas.getActiveObject().getHeight() < 50 && o.arrow === 'left' | o.arrow === 'right'){
                o.set({ opacity: 0 });
            }
            else if (canvas.getActiveObject().getHeight() > 50 && !o.hidden){
                o.set({ opacity: 100 });
            }

            if (o.isType('textbox')){
                if (canvas.getActiveObject().getHeight() < 50){
                    o.set({ width: Math.round(canvas.getActiveObject().getHeight())});
                    valHeight = o.getWidth();
                    o.set({ top: canvas.getActiveObject().top + valHeight});
                }
                else{
                    o.set({ width: Math.round(canvas.getActiveObject().getHeight()) - yArrowWidth*2});
                    valHeight = o.getWidth();
                    o.set({ top: canvas.getActiveObject().top + valHeight + yArrowWidth});
                }
                o.set({ text: ' ' + Math.round(canvas.getActiveObject().getHeight()*scale) + ' '})
            }
            if (o.arrow === 'left'){
                o.set({ top: canvas.getActiveObject().top + yArrowWidth});
            }
            if (o.arrow === 'right'){
                o.set({ top: canvas.getActiveObject().top + valHeight + yArrowWidth*2 - 2});
            }
        }
        // if dimension label is for a circle
        if (o.category === 'dimCirc'){
            if (canvas.getActiveObject().getRadiusX()*2 < 120){
                optFontSize = 15;
            }
            else{
                if (o.fontSize === 15){
                    optFontSize = 29;
                }
                else if (o.fontSize !== 15 || o.fontSize !== 29){
                    optFontSize = o.fontSize;
                }
            }

            o.set({ fontSize: optFontSize });

            if (o.arrow === 'left'){
                o.set({ left: canvas.getActiveObject().left });
                xArrowWidth = o.getWidth();
            }

            if (canvas.getActiveObject().getRadiusX()*2 < 50 && o.arrow === 'left' | o.arrow === 'right'){
                o.set({ opacity: 0 });
            }
            else if (canvas.getActiveObject().getRadiusX()*2 > 50 && !o.hidden){
                o.set({ opacity: 100 });
            }

            if (o.isType('textbox')){
                o.set({ width: Math.round(canvas.getActiveObject().getRadiusX()*2) - xArrowWidth*2 });

                valCirc = o.getWidth();
                o.set({ left: canvas.getActiveObject().left + xArrowWidth });
                o.set({ text: ' ' + Math.round((canvas.getActiveObject().getRadiusX()*2)*scale) + ' '});
            }
            if (o.arrow === 'left'){
                o.set({ left: canvas.getActiveObject().left });
            }
            if (o.arrow === 'right'){
                o.set({ left: canvas.getActiveObject().left + valCirc + xArrowWidth });
            }
        }
        if (o.category === 'dimLine'){
            if (canvas.getActiveObject().lineLen < 120){
                optFontSize = 15;
            }
            else{
                optFontSize = 29;
            }

            if (o.isType('textbox')){
                let newLen = Math.sqrt(Math.pow(canvas.getActiveObject().getHeight(), 2) + Math.pow(canvas.getActiveObject().getWidth(), 2));
                canvas.getActiveObject().set({ lineLen: newLen });


                o.set({ fontSize: optFontSize });
                o.set({ text: ' ' + Math.round(canvas.getActiveObject().lineLen*scale) + ' '});
                o.set({ left: canvas.getActiveObject().left });
                o.set({ top: canvas.getActiveObject().top });
            }
        }
    });
    canvas.getActiveObject().setCoords();
    canvas.renderAll();
}

function bindDimensions() {
    let dims = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id);
    let shapeTransform = canvas.getActiveObject().calcTransformMatrix();
    let invertedshapeTransform = invert(shapeTransform);
    dims.forEach(o => {

        // save the desired relation here.
        o.relationship = multiply(
            invertedshapeTransform,
            o.calcTransformMatrix()
        );
    });
}

//  what to do when text (namely measurement values) are altered
canvas.on('text:editing:exited', function(o){
    //get the edited measurement's associated shape
    let assocShape = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'shape');
    let shapes = canvas.getObjects().filter(o => o.category === 'shape');

    //  when in scaling mode, use the inputted value to alter the canvas's scale value.
    if(scalingMode){
        if(canvas.getActiveObject().category === 'dimX'){
            scale = canvas.getActiveObject().text/assocShape[0].getWidth();
        }
        else if(canvas.getActiveObject().category === 'dimY'){
            scale = canvas.getActiveObject().text/assocShape[0].getHeight();
        }
        else if(canvas.getActiveObject().category === 'dimCirc'){
            scale = (canvas.getActiveObject().text/2)/assocShape[0].getRadiusX();
        }
        else if(canvas.getActiveObject().category === 'dimLine'){
            scale = canvas.getActiveObject().text/assocShape[0].lineLen;
        }

        // once new scale value has been set, iterate over all shapes and make sure their measurements are updated.
        document.getElementById("scaleInput").value = scale*20;
        shapes.forEach( o => {
            canvas.setActiveObject(o);
            scaleDimensions();
        });
    }
    else{
        // if not in scaling mode, call the transform drawing method to transform the selected shape.
        transformDrawing(assocShape, 0);
        scaleDimensions();
    }
});

//  what to do when mouse button is down
canvas.on('mouse:down', function(o){
    isDown = true;
    let pointer = canvas.getPointer(o.e);
    origX = pointer.x;
    origY = pointer.y;

    // create shape with some initial properties, depending on which drawing mode is currently selected.
    if (drawingRect){
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x-origX,
            height: pointer.y-origY,
            angle: 0,
            fill: 'rgba(0,0,0,0)',
            stroke: 'black',
            strokeWidth: 2,
            category: 'shape',
            id: '1'
        });
        canvas.add(rect);
    }
    if (drawingCircle){
        circ = new fabric.Circle({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            radius: (pointer.x-origX)/2,
            fill: 'rgba(0,0,0,0)',
            stroke: 'black',
            strokeWidth: 2,
            category: 'shape',
            id: '2'
        });
        //prevent circle from being scaled on its x/y axis, ensuring it stays a circle
        circ.lockUniScaling = true;
        canvas.add(circ);
    }
    if (drawingLine){
        let points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
            originX: 'center',
            originY: 'center',
            stroke: 'black',
            strokeWidth: 2,
            category: 'shape'
        });
        canvas.add(line);
    }

    // if the canvas is currently set to interactive, enable for the below methods to be called by interaction events
    if (canvasInteractive){
        if (canvas.getActiveObject()){
            canvas.getActiveObject().on('moving', updateDimensions);
            canvas.getActiveObject().on('rotating', updateDimensions);
            canvas.getActiveObject().on('scaling', scaleDimensions);
            bindDimensions();
        }
    }
});

//  what to do when the mouse moves
canvas.on('mouse:move', function(o){

    // do not do anything if mouse button is not down
    if (!isDown) return;

    let pointer = canvas.getPointer(o.e);
    isDragging = true;
    // set dimensions and position of shape, depending on which mode is currently active.
    if (drawingRect){
        if(origX>pointer.x){
        rect.set({ left: Math.abs(pointer.x) });
        }
        if(origY>pointer.y){
            rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });
    }
    if (drawingCircle){
        if(origX>pointer.x){
        circ.set({ left: Math.abs(pointer.x) });
        }
        if(origY>pointer.y){
            circ.set({ top: Math.abs(pointer.y) });
        }

        circ.set({ radius: Math.abs((origX - pointer.x)/2) });
    }
    if (drawingLine){
        line.set({ x2: pointer.x, y2: pointer.y });
    }
});

//  what do when mouse button is lifted
canvas.on('mouse:up', function(o){
    // mouse is no longer down
    isDown = false;


    // randomly generated-string being used as unique ID for shapes. While the chance of ID clashing is extremely low,
    // it would still be a good idea to implement some validation here just to be sure.
    let hopefullyUniqueId = Math.random().toString(16).slice(2);
    let currentShape;

    // depending on which shape is currently being drawn, set some initial values, create dimensions for the shape
    if(drawingRect){
        currentShape = rect;
        rect.set({ id: hopefullyUniqueId });
        rect.setControlsVisibility({ mtr: false });

        // if the shape has dimensions 0/0, we should not create dimensions for it.
        if (rect.width !== 0 && rect.height !== 0){

            dimXLeft = new fabric.Text('⟵', { arrow: 'left', id: rect.id, category: 'dimX', top: rect.top - 50 });
            dimX = new fabric.Textbox(' ' + 100 + ' ', { textAlign: 'center', id: rect.id, category: 'dimX', top: rect.top - 50 });
            dimXRight = new fabric.Text('⟶', { id: rect.id, arrow: 'right', category: 'dimX', left: rect.left+100, top: rect.top - 50});

            dimYTop = new fabric.Text('⟶', { angle: 270, id: rect.id, arrow: 'left', category: 'dimY', left: rect.left - 50 });
            dimY = new fabric.Textbox(' ' + Math.round(rect.getHeight()*scale) + ' ', { angle: 270, textAlign: 'center', id: rect.id, category: 'dimY', left: rect.left - 50 });
            dimYBottom = new fabric.Text('⟵', { angle: 270, id: rect.id, arrow: 'right', category: 'dimY', left: rect.left - 50 });

            // .setCoords() is important, required in order for the shape to be interactive.
            rect.setCoords();
            // add the newly created dimension measurements to canvas
            canvas.add(dimXLeft, dimX, dimXRight, dimYTop, dimY, dimYBottom);
        }
    }
    else if (drawingCircle){
        currentShape = circ;
        circ.set({ id: hopefullyUniqueId });
        circ.setControlsVisibility({ mtr: false });
        if (circ.radius !== 0){
            dimXLeft = new fabric.Text('⟵', { id: circ.id, category: 'dimCirc', arrow: 'left', hidden: false, top: circ.top - 50 });
            dimX = new fabric.Textbox(' ' + 100 + ' ', { textAlign: 'center', id: circ.id, category: 'dimCirc', hidden: false, top: circ.top - 50  });
            dimXRight = new fabric.Text('⟶', { id: circ.id, category: 'dimCirc', arrow: 'right', hidden: false, top: circ.top - 50  });

            circ.setCoords();
            canvas.add(dimXLeft, dimX, dimXRight);
        }
    }
    else if(drawingLine){
        currentShape = line;
        line.set({ id: hopefullyUniqueId });

        // use line's coordinates to calculate angle, then set the value as a property.
        let lineAngle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1);
        lineAngle *= 180 / Math.PI;
        line.set({ lineAng: lineAngle });

        // lines act as a diagonal of a box, use the box's height and width to get the length.
        let lineLen = Math.sqrt(Math.pow(line.getHeight(), 2) + Math.pow(line.getWidth(), 2));
        line.set({ lineLen: lineLen });

        dimX = new fabric.Textbox(' ' + 100 + ' ', { textAlign: 'center', id: line.id, category: 'dimLine', hidden: false });
        canvas.add(dimX);
    }

    //  Apply common properties to dimension objects
    if (drawingRect  || drawingCircle || drawingLine){
        // the dimensions to be modified depends on the shape being drawn.
        let dims = [dimXLeft, dimX, dimXRight, dimYTop, dimY, dimYBottom];

        // circles do not have a y-measurement
        if (!drawingRect){
            dims = [dimXLeft, dimX, dimXRight]
        }
        // lines only have a single value, with no arrows.
        if (drawingLine){
            dims = [dimX];
        }
        // iterate over the array, apply common properties
        dims.forEach(function (dimObject) {
            //  Set common properties
            dimObject.set({ fontSize: 29, hidden: false, positionOffset: 0, hasControls: false });
        });

        // select the newly drawn shape, then run scaleDimensions() to adjust positioning etc. and set interative mode on
        canvas.setActiveObject(currentShape);
        scaleDimensions();
        scaleDimensions();
        setInteractMode();
    }

    // if user (single) clicked on a measurement value (which is of type 'textbox')
    // enter editing mode and highlight all contents.
    if (canvas.getActiveObject() && !isDragging && canvas.getActiveObject().isType('textbox')){
        canvas.getActiveObject().enterEditing();
        canvas.getActiveObject().selectAll();
    }

    // if user had clicked on an arrow (which is of type 'text'), call scaleDimensions() to correct positioning
    if (canvas.getActiveObject() && isDragging && !canvas.getActiveObject().isType('shape')){
        //  Code for setting dim position offset here.
        var assocShape = canvas.getObjects().filter(o => o.id === canvas.getActiveObject().id && o.category === 'shape');

        canvas.setActiveObject(assocShape[0]);
        scaleDimensions();
        scaleDimensions();
    }
    document.getElementById('posVal').value = canvas.getObjects().indexOf(canvas.getActiveObject());
    isDragging = false;
    setInteractive();
    setInteractive();
});