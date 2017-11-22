"use strict";

const
    fs = require("fs"),
    chalk = require("chalk"),
    path = require("path"),
    cp = require("child_process"),
    ccv = require("color-convert"),
    nodeIni = require("ini"),
    slimesFileName = "../slimes.json";

/**
 * @typedef Food
 * @prop {object|string} type
 * @prop {string|boolean|object} hasCrop
 * @prop {object|string} fav
 */
/**
 * @typedef Slime
 * @prop {string} type
 * @prop {Food} food
 * @prop {boolean|string} largoable
 * @prop {string} plot
 * @prop {string} color
 */
    
/**
 * @typedef Largo
 * @prop {String} type
 * @prop {String[]} slimeTypes
 * @prop {Food} food
 */
function main(){
    fs.readFile(path.resolve(__dirname, slimesFileName), "utf8",parseFile);
}
function parseFile(err,slimesFile){
    if(err)
        throw err;
    /** @type { [Slime] } */
    let slimes = JSON.parse(slimesFile);
    // let slimeNames = slimes.filter(slime=>slime.largoable && slime.type!=="Pink").map(slime=>slime.type);
    // slimes = slimes.sort((a,b)=>a.type > b.type);
    let largoableSlimes = slimes.filter(slime=>slime.largoable);

    /** @type { [Largo] } */
    let largos = largoableSlimes.reduce((largos, slime, slimeIdx)=>{
        let slimeName = slime.type;

        let t = largoableSlimes.slice(slimeIdx+1).map(pairSlime=>{
            let pairSlimeName = pairSlime.type;
            let slimeTypes = [slimeName, pairSlimeName].sort();
            return {
                // type: `${slimeName} ${pairSlimeName} largo`,
                type: `${slimeTypes.join(" ")} Largo`,
                slimeTypes: slimeTypes.map(type=>type.toLowerCase()),
                food: {
                    type: (slime.food.type === pairSlime.food.type || (!slime.food.fav || !pairSlime.food.fav))?slime.food.type:([slime.food.type,pairSlime.food.type].sort()),
                    hasCrop: slime.food.hasCrop | pairSlime.food.hasCrop,
                    fav: (slime.food.fav === pairSlime.food.fav || (!slime.food.fav||pairSlime.food.fav))?slime.food.fav:([slime.food.fav,pairSlime.food.fav].sort())
                }
            };
        });
        largos.push(...t);
        return largos;
    }, []);
    

    // let pink = slimes.filter(slime=>slime.type==="Pink")[0];
    // let pinkColor = hexToColor(pink.color);
    // largos = largos.sort((a,b)=>{
    //     return (a.slimeTypes[0] > b.slimeTypes[0]) | (a.slimeTypes[1] > b.slimeTypes[1])
    // });

    // slimes.forEach(slime=>{
    //     let color = hexToColor(slime.color);
    //     let ansiColor = ccv.rgb.ansi256(color.r,color.g,color.b);
    //     console.log(chalk.rgb(color.r,color.g,color.b)(slime.type));
    //     console.log(chalk.ansi256(ansiColor)(slime.type));
    // });
    fs.readFile(path.resolve(__dirname, "matches", "en.ini"), "utf8", (err,inifile)=>{
        /** @type { Object.<String, String> } */
        let iniobj = nodeIni.parse(inifile);
        let iniLargos = Object
        .keys(iniobj)
        .map(k=>{
            let v = iniobj[k];
            k = k.toLowerCase();
            return {type: v, match: k.match(/l\.([^_]+)_([^_]+)_largo/i)}
        })
        .filter(o=>o.match)
        .map(o=>{
            let largo = {type: o.type, slimeTypes: o.match.slice(1,3)};
            return largo;
        }).filter(largo=>{
            return !largo.slimeTypes.includes("saber");
        }); 


        let enumArray = [largos, iniLargos].reduce((e, largoArray)=>{ return (e === null || largoArray.length > e.length)?largoArray:e; });
        enumArray.forEach((enumLargo, enumLargoIdx)=>{
            let iniLargo, largo;
            let iniLargoIdx, largoIdx;

            if(enumLargo.food){ //enumLargo isn't from ini
                largo = enumLargo;
                largoIdx = enumLargoIdx;

                iniLargos.some((searchLargo, searchLargoIdx)=>{
                    if(searchLargo.slimeTypes.includes(enumLargo.slimeTypes[0]) && searchLargo.slimeTypes.includes(enumLargo.slimeTypes[1])){
                        iniLargoIdx = searchLargoIdx;
                        iniLargo = searchLargo;
                        return true;
                    };
                });

            } else { //enumLargo from ini
                iniLargo = enumLargo;
                largos.some((searchLargo, searchLargoIdx)=>{
                    if(searchLargo.slimeTypes.includes(enumLargo.slimeTypes[0]) && searchLargo.slimeTypes.includes(enumLargo.slimeTypes[1])){
                        largoIdx = searchLargoIdx;
                        largo = searchLargo;
                        return true;
                    };
                });
                // largo = largos.filter(searchLargo=>{
                //     return searchLargo.slimeTypes.includes(enumLargo.slimeTypes[0]) && searchLargo.slimeTypes.includes(enumLargo.slimeTypes[1]);
                // })[0];
            }
            let out = "";
            let bg = "?";
            if(largo && iniLargo)
                if(largo.type  === iniLargo.type){
                    return;
                    out = `${largo.type}`;
                    bg = chalk.bgRgb(0,128,0)(" OK!! ");
                } else {
                    out = `${largo.type} officially is ${iniLargo.type}`;
                    bg = chalk.bgRgb(128,0,0)(" FIX? ");
                    largos[largoIdx].type = iniLargo.type;
                }
            else {
                return;
                bg = chalk.bgRgb(128,128,0)(" WARN ");
                if(iniLargo){
                    out = `${iniLargo.type} officially exists, but wasn't listed.`;
                } else { 
                    out = `${largo.type} doesn't exists officially.`;
                }
            }
            out = out.padEnd(80) + bg;
            slimes.forEach(slime=>{
                let color = hexToColor(slime.color);
                let re = new RegExp(slime.type,"gi");
                let pos;
                while((pos = re.exec(out)) !== null){
                    out = out.substring(0,pos.index) + chalk.rgb(color.r,color.g,color.b)(out.substr(pos.index,slime.type.length)) + out.substr(pos.index+slime.type.length);
                    re.exec(out);
                }
            });
            
            console.log(out);//.padEnd(80) + bg);
        });
    

        fs.writeFile(path.resolve(__dirname, "largos.json"), JSON.stringify(largos,undefined,4), (err)=>{if(err) throw err;});
        
        console.log("done");
        largos.forEach(largo=>{
            let out = largo.type;
            slimes.forEach(slime=>{
                let color = hexToColor(slime.color);
                let re = new RegExp(slime.type,"gi");
                let pos;
                while((pos = re.exec(out)) !== null){
                    out = out.substring(0,pos.index) + chalk.rgb(color.r,color.g,color.b)(out.substr(pos.index,slime.type.length)) + out.substr(pos.index+slime.type.length);
                    re.exec(out);
                }
            });
            console.log(out);
        });
        
    });

    return;
    let largoWithCrop = largos.filter(largo=>largo.food.hasCrop);

    largoWithCrop.forEach((largo, i)=>{
        let out = `#${(`${i+1}:`).padEnd(5)} ${largo.type.padStart(25)}\t${String(largo.food.type).padEnd(20)}\t${largo.food.hasCrop?"OK":""}`;
        
        slimes.forEach(slime=>{
            let color = hexToColor(slime.color);

            let pos = out.search(new RegExp(slime.type,"i"));
            if(pos >= 0)
                out = out.substring(0,pos) + chalk.rgb(color.r,color.g,color.b)(out.substr(pos,slime.type.length)) + out.substr(pos+slime.type.length);
        });
        
       //console.log(out);
    });
};

function hexToColor(colorString){
    return colorString.match(/[0-9a-f]{2}/gi)
    .reduce((c,v,ch)=>{c[["r","g", "b"][ch]]=parseInt(v,16); return c;}, {});
}

main();