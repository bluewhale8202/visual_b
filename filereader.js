// code from bcmoney at Stackoverflow
// https://stackoverflow.com/questions/13709482/how-to-read-text-file-in-javascript

// [External dependencies]
// drawTree: visual.html
// printInit: visual.html
// decorateInit: visual.html
// moveCenterTo2: visual.html

var reader; //GLOBAL File Reader object

function checkFileAPI() {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        reader = new FileReader();
        return true; 
    } else {
        alert('The File APIs are not fully supported by your browser. Fallback required.');
        return false;
    }
}

// var output;
function readText(filePath) {
    var output = "";    
     //placeholder for text output
    if(filePath.files && filePath.files[0]) {     
        reader.onload = function (e) {
            output = e.target.result;
            j = JSON.parse(output);
            var width_and_tree = drawTree(j);
            var width = width_and_tree[0];
            printInit();
            decorateInit();
            moveCenterTo2([width/2, paper.view.size.height/2 - 20]);
            window.executeOne = function(){
                var gen = eval(curTree);
                return function () {gen.next();}
            }();
            window.executeAll = function(){
                var gen = eval(curTree);
                var done = false;
                function one(){
                    if(!gen.next().done){
                        setTimeout(one, 120); }  }
                setTimeout(one, 120);
            }
        };//end onload()
        reader.readAsText(filePath.files[0]);
    }//end if html5 filelist support
    else if(ActiveXObject && filePath) { //fallback to IE 6-8 support via ActiveX
        try {
            reader = new ActiveXObject("Scripting.FileSystemObject");
            var file = reader.OpenTextFile(filePath, 1); //ActiveX File Object
            output = file.ReadAll(); //text contents of file
            file.Close(); //close file "input stream"
        } catch (e) {
            if (e.number == -2146827859) {
                alert('Unable to access local files due to browser security settings. ' + 
                 'To overcome this, go to Tools->Internet Options->Security->Custom Level. ' + 
                 'Find the setting for "Initialize and script ActiveX controls not marked as safe" and change it to "Enable" or "Prompt"'); 
            }
        }       
    }
    else { //this is where you could fallback to Java Applet, Flash or similar
        return false;
    }       
    return true;
}   