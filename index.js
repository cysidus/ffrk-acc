'use strict';

var beautify_js = require('js-beautify');
var beautify_css = require('js-beautify').css;
var option = require("commander");
var fs = require("fs-extra");
var unpacker = require("./lib/unpacker");



option
    .option('-n, --non-cache', 'Clean non-cache files')
    .option('-v, --ver', 'Clean .ver files')
    .option('-d, --dir', 'Use DeNA directory structure')
    .option('-o, --overwrite', 'Overwrite all target files')
    .parse(process.argv);



var path_config = [
    {
        DENA: "Content/img/", // DeNA Directory Mistake?
        CLEAN: "Content/web/img/"
    },
    {
        DENA: "Content/lang/ab_image/", // DeNA Directory Mistake?
        CLEAN: "Content/image/"
    },
    {
        DENA: "Content/lang/image/", // DeNA Directory Mistake?
        CLEAN: "Content/image/"
    },
    {
        DENA: "Content/lang/bgm/bgm_m4a/",
        CLEAN: "Content/bgm/"
    },
    {
        DENA: "Content/lang/se/se_ogg/",
        CLEAN: "Content/se/"
    },
    {
        DENA: "Content/lang/ww/compile/en/ab/",
        CLEAN: "Content/animation/"
    },
    {
        DENA: "Content/lang/ww/compile/en/",
        CLEAN: "Content/"
    },
    {
        DENA: "Content/lang/",
        CLEAN: "Content/"
    },
    {
        DENA: "Content/ww/compile/en/js/direct/battle/ai/conf/",
        CLEAN: "Content/js/direct/battle/"
    },
    {
        DENA: "Content/ww/compile/en/js/",
        CLEAN: "Content/js/"
    },
    {
        DENA: "Content/ww/compile/en/css/compile/",
        CLEAN: "Content/web/css/"
    },
    {
        DENA: "Content/ww/compile/en/img/compile/sprite/",
        CLEAN: "Content/web/img/sprite/"
    },
    {
        DENA: "Content/ww/compile/en/",
        CLEAN: "Content/web/"
    },
];



function cleaner(){
    var items = fs.readdirSync('.');
    var items_length = items.length;

    items.forEach(function(item, index){
        var type = new TypeManager(item);
        var name = new NameManager(item);

        // check to see if option to use dena directory structure is specified
        // otherwise use the clean directory structure
        if (option.dir && type.isCacheFile){
            var target_fullpath = name.fullpath;
        }
        else{
            var target_fullpath = name.clean_fullpath;
        }

        // check to see if the file should be cleaned up or not
        var cleanup = cleanupCheck(type, name, target_fullpath);
        if (!cleanup) return;

        // copy and rename the file to the specified directory
        try {
            fs.copySync(name.source, target_fullpath, {clobber: true});
        }
        catch (err) {
            console.error('Error: ' + err.message);
        }

        // deobfuscate and beautify the file if it's a javascript file
        if (type.isJS){
            var content = fs.readFileSync(target_fullpath, 'utf8');
            if (unpacker.detect(content)) {
                content = unpacker.unpack(content);
            }
            var beautified = beautify_js(content);
            fs.writeFileSync(target_fullpath, beautified);
        }

        // beautify the file if it's a css/json file
        if (type.isCSS){
            var content = fs.readFileSync(target_fullpath, 'utf8');
            var beautified = beautify_css(content);
            fs.writeFileSync(target_fullpath, beautified);
        }

        if (type.isJSON){
            var content = fs.readFileSync(target_fullpath, 'utf8');
            var beautified = JSON.stringify(JSON.parse(content), null, 4);
            fs.writeFileSync(target_fullpath, beautified);
        }

        // show progress in console
        var progress = Math.floor((100 / items_length) * (index + 1));
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write("Cleanup Progress: " + progress + "%");
    });


    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write("FFRK cache cleanup completed!");
}



function cleanupCheck(type, name, fullpath){
    // ignore directory
    if (type.isDir) return false;

    // ignore non ffrk cache file unless specified in the option
    if (!type.isCacheFile && !option.nonCache) return false;

    // ignore .ver file unless specified in the option
    if (type.isVer && !option.ver) return false;

    // overwrite file if source file modified date is higher than target's unless specified in the option
    if (existsSync(fullpath)){
        var source_mtime = fs.statSync(name.source).mtime;
        var target_mtime = fs.statSync(fullpath).mtime;
        if (source_mtime < target_mtime && !option.overwrite) return false;
    }

    return true;
}



function existsSync(fullpath){
    try {
        fs.statSync(fullpath);
        return true;
    }
    catch(err) {
        return false;
    }
}



// TypeManager
// Check what type of item it is. Exposed properties:
//
// isDir
// isFile
// isCacheFile
// isVer
// isJS
// isCSS
// isJSON

function TypeManager(item){
    this.isDir = false;
    this.isFile = false;
    this.isCacheFile = false;
    this.isVer = false;
    this.isJS = false;
    this.isCSS = false;
    this.isJSON = false;

    this.isDir = fs.statSync(item).isDirectory();
    this.isFile = fs.statSync(item).isFile();

    if (item.indexOf("https%3a%2f%2fffrk.denagames.com%2fdff%2fstatic") == 0 && this.isFile) {
        this.isCacheFile = true;
    }

    var parts = item.split('.');
    var format = parts[parts.length - 1];

    if (format == "ver"){
        this.isVer = true;
    }

    if (format == "js"){
        this.isJS = true;
    }

    if (format == "css"){
        this.isCSS = true;
    }

    if (format == "json" || format == "sajson"){
        this.isJSON = true;
    }
}



// NameManager
// Handles various path and name mutation. Example of exposed properties:
//
// source: https%3a%2f%2fffrk.denagames.com%2fdff%2fstatic%2fww%2fcompile%2fen%2fjs%2fbattle.js
// decoded: https://ffrk.denagames.com/dff/static/ww/compile/en/js/battle.js
// filename: battle.js
// fullpath: Content/ww/compile/en/js/battle.js
// path: Content/ww/compile/en/js/
// clean_fullpath: Content/js/battle.js
// clean_path: Content/js/

function NameManager(item){
    var _this = this;
    this.source = item;
    this.decoded = decodeURIComponent(item).replace(".sajson", "_sa.json");
    this.filename = this.decoded.substring(this.decoded.lastIndexOf('/') + 1);
    this.fullpath = this.decoded.replace("https://ffrk.denagames.com/dff/static", "Content");
    this.path = this.fullpath.replace(this.filename, "");
    this.clean_fullpath = "Content/undefined/" + this.source;
    this.clean_path = "Content/undefined/";

    path_config.some(function(conf){
        if (_this.path.indexOf(conf.DENA) == 0){
            _this.clean_fullpath = _this.path.replace(conf.DENA, conf.CLEAN) + _this.filename;
            _this.clean_path = conf.CLEAN;
            return true;
        }
    });
}



module.exports = cleaner;
