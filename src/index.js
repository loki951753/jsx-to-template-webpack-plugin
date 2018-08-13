const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');

const { compileFileBy } = require('../../jsx-to-template-core/src/');

function cacheComs(coms, currentComsInfo){
    /*
        {
            comInfo: tags,
            code
        }
    */

    currentComsInfo.forEach((com)=>{
        if(coms.comForest[com.comInfo.name]){
            throw new Error(`Component '${com.comInfo.name}' has multiple defination`);
        }
        if(com.comInfo.mount){
            coms.roots.push(com.comInfo.name);
        }
        coms.comForest[com.comInfo.name] = {
            code: com.code,
            data: com.comInfo.data, // use it to insert template data
            mount: com.comInfo.mount
        }
    })
}


class JSX2TplPlugin {
    constructor(options){
        this.options = Object.assign({}, {
            tplPath: path.join(__dirname, 'default_index.html'),
            tplType: 'ejs',
            parseOption: {
                sourceType: 'module',
                plugins: [
                    'jsx',
                    'decorators-legacy',
                    'classProperties',
                    'classPrivateProperties',
                    'classPrivateMethods',
                    'exportDefaultFrom',
                    'exportNamespaceFrom',
                    'asyncGenerators',
                    'functionBind',
                    'functionSent',
                    'dynamicImport',
                    'numericSeparator',
                    'optionalChaining',
                    'importMeta',
                    'bigInt',
                    'optionalCatchBinding',
                    'throwExpressions',
                    'pipelineOperator',
                    'nullishCoalescingOperator'
                ]
            },
            parseFileExtension: /\.js$/,
        }, options);
    }

    apply(compiler){
        // load template file
        const templateContent = fs.readFileSync(this.options.tplPath, 'utf8');
        let $;

        // all jsx coms in one project will parsed into a forest
        let coms = {
            roots: [], // refs of the root of jsx coms tree
            comForest: {} // all jsx coms
        };

        if(!(this.options.parseFileExtension instanceof RegExp)){
            throw new TypeError('待解析文件的扩展名配置项必须设置为正则表达式');
        }

        compiler.plugin('compilation', (compilation)=>{
            compilation.plugin('normal-module-loader', (loaderContext, module) => {
                if(!this.options.parseFileExtension.test(module.resource)) return;

                console.log(`come to ${module.resource}`);

                // @TODO: extend 'ejs' to option, and support custom visitor
                const result = compileFileBy('ejs')(module.resource, this.options.parseOption);
                // const result = compileFile(module.resource, this.options.parseOption);

                if(!result) return;

                console.log(`Found tag in ${module.resource}`);

                // 将组件缓存到森林中，并插入文档中
                cacheComs(coms, result);
            });
        });

        // generate final HTML with parsed result
        compiler.plugin('emit', (compilation, callback)=>{
            if(coms.roots.length === 0){
                // no root com found
                callback();
                return;
            }

            function getComCode(comForest, comRef){
                let com = comForest[comRef];
                if(!com){
                    console.log(`skip an undeclared custom/vendor component: ${comRef}`);
                    return '';
                }

                let comCode = '';
                let reg = /###(.*?)###/g;
                let match;
                let cur=0;
                while(match = reg.exec(com.code)){
                    comCode += com.code.slice(cur, match.index);
                    comCode += getComCode(comForest, match[1]);
                    cur = match.index + match[0].length;
                }
                comCode += com.code.slice(cur);

                return comCode;
            }

            $ = $ || cheerio.load(templateContent, {
                decodeEntities: false
            });

            coms.roots.forEach(rootRef=>{
                let com = coms.comForest[rootRef];
                let rootComCode = getComCode(coms.comForest, rootRef);
                $(com.mount).text(rootComCode);
            });

            const output = $.html();
            const filename = path.basename(this.options.tplPath).replace(/html/, this.options.tplType);

            compilation.assets[filename] = {
                source: function(){
                    return output;
                },
                size: function(){
                    return output.length;
                }
            }

            callback();
        });
    }
}

module.exports = JSX2TplPlugin;
