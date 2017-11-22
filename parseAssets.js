"use strict";

const 
    fs = require("fs"),
    path = require("path");

fs.readFile(path.resolve(__dirname, "resources.assets"), (err,assets)=>{
    // let actorStart = assets.indexOf("actor", 0, "utf8");
    // let actorEnd = assets
    // const controlchars = ["NUL","SOH","STX","ETX","EOT","ENQ","ACK","BEL","BS","TAB","LF","VT","FF","CR","SO","SI","DLE","DC1","DC2","DC3","DC4","NAK","SYN","ETB","CAN","EM","SUB","ESC","FS","GS","RS","US"];
    // let safeassets = (assets.reduce((saida, v,i)=>{saida += v<32?"[" + controlchars[v] + "]":String.fromCharCode(v); return saida;}, ""));//.toString("utf8");
    // safeassets.match(/actor/g)
    let safeassets = assets.toString("ascii");
    let re = /actor\x00/g, repos;
    let i = 0;
    while((repos = re.exec(safeassets)) != null){
        let pos = repos.index+repos[0].length;
        
        // let nearestcc = safeassets.slice(pos+6).match(/[^\x20-\x7E\r\n\x80-\xff]/);
        // if(nearestcc == null || (nearestcc.index > assets.length)) 
        //     nearestcc = {0: " ", index: 20};

        // else if(nearestcc - pos > 50)
        // nearestcc = pos+6+50;
        // else if(nearestcc - pos < 0)
        // nearestcc = pos+6+20;
        // let txt = safeassets.substr(pos+6, nearestcc.index);
        let len = assets.slice(pos+2, pos+4).readInt16LE();
        if(len < 0) len = 1;
        let txt = assets.slice(pos+6, pos+6+len);

        // console.log(assets.slice(pos, pos+6), safeassets.substr(pos,6));
        fs.writeFile(path.resolve(__dirname, "matches", `match${String(i++).padStart(4,"0")}.txt`), txt, err=>{if(err) throw err;});
    }
});
