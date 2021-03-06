var nextCenter = view.center;
var nextZoom = view.zoom;
var prevNodeOutline = null;
var prevExecutedNode = null;
var vertical = 40;
var curTree = null;

var texts = {
  TRUE: [["true"]],
  FALSE: [["false"]],
  UNIT: [["unit"]],
  NUM: [["num", 'n']],
  VAR: [["var", "v"]],
  ADD: [["e", "nt"], ["+"], ["e", "nt"]],
  SUB: [["e", "nt"], ["-"], ["e", "nt"]],
  MUL: [["e", "nt"], ["*"], ["e", "nt"]],
  DIV: [["e", "nt"], ["/"], ["e", "nt"]],
  EQUAL: [["e", "nt"], ["="], ["e", "nt"]],
  LESS: [["e", "nt"], ["<"], ["e", "nt"]],
  NOT: [["not"], ["e", "nt"]],
  SEQ: [["e", "nt"], [";"], ["e", "nt"]],
  IF: [["if"], ["e", "nt"], ["then"],
       ["e", "nt"], ["else"], ["e", "nt"]
      ],
  WHILE: [["while"], ["e", "nt"], ["do"], ["e", "nt"]],
  LETV: [["Let"], ["x", "v"],
         [":="], ["e", "nt"], ["in"], ["e", "nt"]],
  LETF: [["Let"], ["proc"], ["f", "v"], ["("], ["args", "nt"], [")"],
         ["="], ["e", "nt"], ["in"], ["e", "nt"]],
  CALLV: [["f", "v"], ["("], ["args", "nt"], [")"]],
  CALLR: [["f", "v"], ["<"], ["args", "nt"], [">"]],
  FIELD: [["e", "nt"], ["."], ["x", "v"]],
  ASSIGN: [["x", "v"], [":="], ["e", "nt"]],
  ASSIGNF: [["e", "nt"], ["."], ["x", "v"], [":="], ["e", "nt"]],
  READ: [["READ"], ["x", "v"]],
  WRITE: [["WRITE"], ["e", "nt"]],
}

var Content = Base.extend({
  initialize: function(start_pt, type, vtexts){
    this.type = type;
    this.all = [];
    this.nts = [];   // non terminal contents
    this.vs = [];    // variables
    this.nums = [];
    if (type === "ARGS" || type === "RECORD" )
      var t = vtexts;
    else{
      var t = texts[type]; }
    this.fillContents(start_pt,t);
    this.updateBounds();
  },
  fillContents: function(start_pt, ts){
    var prev = null;
    for (var i = 0; i < ts.length; i++){
      var cur = new PointText();
      cur.fontSize = 15;
      cur.content = ts[i][0];
      cur.fontWeight = 'bold';
      if (ts[i][1] === 'nt'){
        cur.fillColor = 'red';
        this.nts.push(cur);}
      if (ts[i][1] === 'v'){
        cur.fillColor = '#772277';
        this.vs.push(cur);}
      if (ts[i][1] === 'n'){
        cur.fillColor = '#122277';
        this.nums.push(cur);}

      this.all.push(cur);  }
    this.update();
  },
  // move first text's topLeft
  moveTo: function(pt){
    var prev = null;
    for (var i = 0; i < this.all.length; i++){
      var cur = this.all[i];
      if (i == 0){
        cur.bounds.topLeft = pt;}
      else {
        cur.position = prev.position +
                       {x:5+ (cur.bounds.width/2)+(prev.bounds.width/2),
                        y:0};}
      prev = cur;}
    this.updateBounds();
  },
  updateBounds: function(){
    var fb = this.all[0].bounds;
    var lb = this.all[this.all.length-1].bounds;
    this.bounds = {};
    this.bounds.x = fb.x;
    this.bounds.y = fb.y;
    this.bounds.width = lb.x - fb.x + lb.width;
    this.bounds.height = lb.y - fb.y + lb.height;
  },
  updatePositions: function(){
    var prev = null;
    for (var i = 0; i < this.all.length; i++){
      var cur = this.all[i];
      if (i != 0){
        cur.position = prev.position +
                       {x:5+ (cur.bounds.width/2)+(prev.bounds.width/2),
                        y:0};}
      prev = cur;  }
  },
  update: function(){
    this.updatePositions();
    this.updateBounds();
  },
  clear: function(){
    var all = this.all;
    for (var i = 0; i < all.length; i++){
      all[i].remove();  }
  },
  // hide: function(){
  //   var all = this.all;
  //   for (var i = 0; i < all.length; i++){
  //     all[i].setVisible(false);  }
  // }
});


var Node = Base.extend({
  initialize: function(start_pt, type, vtexts) {
    this.content = new Content(start_pt, type, vtexts);
    this.type = type;
    this.children = [];
    this.edges = [];
    this.update();
  },
  moveTo: function(pt){
    this.content.moveTo(pt);
    this.update();
  },
  adopt: function(children){
    if (this.content.nts.length !== children.length){
      alert("Error: Wrong number of children added");
      alert("childre lengths:" + this.children.length);
      alert("nts lengths:" + this.content.nts.length);}
    for (var i = 0 ; i < children.length; i++){
      this.children.push(children[i]);
      children[i].parent = this;
      var e = new Path.Line([0,0], [0,0]);
      e.strokeColor = 'black';
      this.edges.push(e);}
    this.updateEdges();
  },
  setVariable: function(idx, vname){
    this.content.vs[idx].content = vname;
    this.update();
  },
  setNumber: function(value){
    if (this.content.type != "NUM"){
      alert("Error. set number to a non-number type")  }
    this.content.all[0].content = String(value);
    this.update();
  },
  update: function(){
    this.content.update();
    this.updateOutline();
    this.updateEdges();
    this.bounds = this.content.bounds;
  },
  updateOutline: function(){
    var bounds = this.content.bounds;
    if (this.outline){
      this.outline.bounds = {x:bounds.x-3, y:bounds.y-3,
        width: bounds.width + 6, height: bounds.height+ 6};}
    else{
      this.outline = new Path.Rectangle(
      [bounds.x-3, bounds.y-3], [bounds.width+6, bounds.height+6]);
      this.outline.strokeColor = '#999999';
      this.outline.fillColor='#FDFDFD'
      this.outline.blendMode = 'multiply';}
      this.outline.smooth({type: 'geometric', factor: 0.1 });
    this.outline.onClick = moveCenterToThis
  },
  updateEdges: function(){
    for (var i = 0; i < this.children.length; i++){
      var pb = this.content.nts[i].bounds
      var pbottom = new Point(
        {x: pb.x + (pb.width/2), y: pb.y + pb.height});
      var cb = this.children[i].outline.bounds;
      var ctop = new Point(
        {x: cb.x + (cb.width/2), y: cb.y});
      var edge = this.edges[i];
      edge.segments = []
      // edge.removeSegment(1);
      // edge.removeSegment(0);
      edge.add(pbottom);
      edge.add(ctop);  }
  },
  // move first text's topLeft
  moveTo: function(pt){
    this.content.moveTo(pt);
    this.update();
  },

  clear: function(){
    this.content.clear();
    this.outline.remove();
    var edges = this.edges;
    for (var i = 0; i < edges.length; i++){
      edges[i].remove();  }
  }
});


var terminals = ["NUM", "TRUE", "FALSE", "UNIT", "VAR", "READ", "RECORD"];

function isTerminal(type){
  var ret = false
  for (var i = 0; i < terminals.length; i++)
    if(terminals[i] === type)
      ret = true;
  return ret;
}

function variableText(type, cont){
  var vtexts = [];
  if (type === "ARGS"){
    if (cont.length >= 1){
      // In case of ARGS of LETF or CALLR
      // contents are not expressions
      if (typeof cont[0] === "string"){
        vtexts.push(["x", "v"]);
        for (var i = 1; i < cont.length; i++){
          vtexts.push([","]);
          vtexts.push(["x", "v"]);  }
      }
      // In case of ARGS of CALLV
      // contents will be evaluated later on
      else{
        vtexts.push(["e", "nt"]);
        for (var i = 1; i < cont.length; i++){
          vtexts.push([","]);
          vtexts.push(["e", "nt"]);  }
      }  }
  }
  else if (type === "RECORD"){
    vtexts.push(["{"]);
    for (var i = 0; i < cont.length; i++){
      // ex) a := 1
      vtexts.push([ cont[i][0], "v" ]);
      vtexts.push([":="]);
      vtexts.push([ String(cont[i][1]["NUM"]),
                   'n'] );  }
    vtexts.push(["}"]);  }

  return vtexts;
}

function _drawTree(ast, left, level){
  var type = Object.keys(ast)[0];
  var cont = ast[type]; // array
  var vtexts = variableText(type, cont);
  var cur = new Node([0,0], type, vtexts);
  // console.log(type + " start")
  for (var i = 0; i < terminals.length; i++){
    if (terminals[i] === type){
      if (type == "NUM")
        cur.setNumber(cont[0]);
      if (type == "VAR" || type == "READ"){
        for (var j = 0; j < cont.length; j++){
            cur.setVariable(j, cont[j]);}
        }
      var w = cur.bounds.width;
      cur.moveTo([left,level*vertical])
      return [w+16, cur];
    }
  }
  var varCount = 0;
  var totalWidth = 0;
  var widths = [];
  var children = [];
  for (var i = 0; i < cont.length; i++){
    // console.log("children", typeof cont[i]);
    if (typeof cont[i] === "string"){
      // if (type !== "CALLV")
      //   continue;
      cur.setVariable(varCount, cont[i]);
      // console.log("set ",cur,"to",cont[i]);
      varCount++;
      continue;
    }
    var result = _drawTree(
      cont[i], left + totalWidth, level+1);
    totalWidth += result[0]; // result[0]: width
    widths.push(result[0]);
    children.push(result[1]);  // result[1]: new_node
  }
  cur.adopt(children)

  var left_added = 0;
  if ((widths.length % 2) == 0){
    for (var i = 0; i < (widths.length/2); i++){
      left_added += widths[i];}
  }
  else if(widths.length != 1) {
    var i = 0;
    for (; i < Math.floor((widths.length/2)); i++){
      left_added += widths[i];}
  }

  // console.log(type, " end")

  cur.moveTo([left + left_added, level*vertical]);
  var w = Math.max(totalWidth, cur.bounds.width);
  return [w+16, cur];
}

function drawTree(ast){
  if(curTree)
    removeTree(curTree);
  var result = _drawTree(ast, 0, 0);
  curTree = result[1];
  curTree.parent = null;
  return result;
}

function removeTree(node){
  var children = node.children;
  node.clear();
  delete node;
  for (var i = 0; i < children.length; i++)
    removeTree(children[i]);
}


function onFrame(event){
  var delta = nextCenter - view.center;
  _x = Math.round(delta.x/7);
  _y = Math.round(delta.y/7);
  view.center = view.center + {x:_x, y:_y};

  var delta = (nextZoom - view.zoom)/6;
  if (delta > 0.002 || delta < -0.002)
    view.zoom = view.zoom + delta;
}

function moveCenterToThis(event){
  nextCenter = event.point;
  this.fillColor = '#CCCCFD';
  if (prevNodeOutline)
    prevNodeOutline.fillColor = '#FDFDFD';
  prevNodeOutline = this;
}

function moveCenterTo1(nodeOutline){
  if (nextCenter - nodeOutline.position == {x:0, y:0}){
    return;}
  nextCenter = nodeOutline.position;
  nodeOutline.fillColor = '#CCCCFD';
  if (prevNodeOutline)
    prevNodeOutline.fillColor = '#FDFDFD';
  prevNodeOutline = nodeOutline;
}

function moveCenterTo2(coord){
  nextCenter = new Point(coord);  }

function focus(node, curVal, mem, env){
  if (curVal === null) curVal = "unit";
  else if (typeof curVal === "object") curVal = "{}"
  moveCenterTo1(node.outline);
  $("#result h4#result-content").text(curVal);
  renewMem(mem);
  renewEnv(env);  }

function renewMem(mem){
  var table = $("#memory table");
  table.empty();
  var keys = Object.keys(mem);
  for (var i = 0; i < keys.length;){
    var tr_addr = $("<tr/>").addClass("addr");
    var tr_content = $("<tr/>");
    for(var count5 = 0; count5 < 5 && i < keys.length;
                       count5++, i++){
      tr_addr.append(
        $("<td/>").text(keys[i])  );
      if (typeof (mem[keys[i]]) === 'object'){
          tr_content.append($("<td/>").text('{}'));
      } else {
          tr_content.append($("<td/>").text(
            JSON.stringify(mem[keys[i]]))  );  }
      }
    table.append(tr_addr).append(tr_content);  }
}

function renewEnv(env){
  var table = $("#env table");
  table.empty();
  var keys = Object.keys(env);
  for (var i = 0; i < keys.length;){
    var tr = $("<tr/>");
    for(var count2 = 0; count2 < 2 && i < keys.length;
                       count2++, i++){
      var key = ("<span style='color: #772277'>" +
       keys[i] + "</span>");
      var content = (" : <span style='font-size:0.5em'>" +
        env[keys[i]] + "</span>");
      if (typeof env[keys[i]] === 'object'){
        content  = " : proc" }
      tr.append(
        $("<td>").append(key).append(content)  );
    }
    table.append(tr); }
}


function initializePrint(){
  $("#print table").empty();  }

function updatePrint(val){
  $("#print table").append(
      "<tr><td>" + val + "</td></tr>");  }

function initializeResult(){
  $("#result h3").text("Interpretation of").append("<br>").append(
        "the current node").css("color", "black");
  $("#result h4#result-content").css("color", "black").empty();  }


function initialize(j){
    if(window.evalDone === false)
        return;
    window.j = j;
    var width = drawTree(j)[0];
    window.evalDone = true;
    window.mem = {};
    renewMem({});
    renewEnv({});
    initializePrint();
    initializeResult();
    moveCenterTo2([width/2, paper.view.size.height/2 - 20]);
    var gen = eval(curTree);
    window.executeOne = function(){
        // var gen = eval(curTree);
        return function () {
            gen.next();
        }
    }();
    window.executeAll = function(){
        if(!window.evalDone)
            return;
        // var gen = eval(curTree);
        window.evalDone = false;
        function one(){
            if(!gen.next().done){
                setTimeout(one, 120);  }
            else{
                window.evalDone = true;  }  }
        setTimeout(one, 120);
    }
}


function finalizeResult(){
  $("#result h3").text("Final interpretation").append("<br>").append(
        "of the program").css("color", "blue");
  $("#result h4#result-content").css("color", "blue");  }

//
// function* travMaker(node){
//   moveCenterTo1(node.outline);
//   yield node.type;
//   var cLen = node.children.length;
//   for (var i = 0; i < cLen; i++){
//     var travGenerator = travMaker(node.children[i]);
//     var next = travGenerator.next();
//     while (!next.done){
//       yield  next.value
//       next = travGenerator.next();}
//   }
//   if(cLen){
//     moveCenterTo1(node.outline);
//     yield node.type;}
// }
// window.drawTree = drawTree;
// window.removeTree= removeTree;
window.focus = focus;
// window.initializePrint = initializePrint;
window.updatePrint = updatePrint;
// window.initializeResult = initializeResult;
window.finalizeResult = finalizeResult;
// window.moveCenterTo2 = function(coord){nextCenter=new Point(coord)};
zooms = {0.25:{1:0.5, "-1":0.25},0.5: {1:1, "-1":0.25},
            1:{1:2, "-1":0.5}, 2:{1:3, "-1":1},
            3:{1:4, "-1":2}, 4:{1:4, "-1":3}}
window.zoom = function(z){
  nextZoom = zooms[nextZoom][z];
};
// window.travMaker = travMaker;
window.initialize = initialize;

window.setCode = function(text) {
    $("code").text(text);
}

window.toggleCode = function getToggleCode(){
  var show = true;
  function toggleCode(){
    if (show){
      $("code").hide();
      $("canvas").show();
      $("#toggle-code").text("Show code");
      show = false;  }
    else {
      $("canvas").hide();
      $("code").show();
      $("#toggle-code").text("Hide code");
      show = true;  }
  }
  toggleCode();
  return toggleCode;
}();
