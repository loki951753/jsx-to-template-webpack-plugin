const fs = require('fs');
const path = require('path');

const cheerio = require('cheerio');

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

        // all jsx coms in one project will parsed into a forest
        let coms = {
            roots: [], // refs of the root of jsx coms tree
            coms: {} // all jsx coms
        };

        if(!(this.options.parseFileExtension instanceof RegExp)){
            throw new TypeError('待解析文件的扩展名配置项必须设置为正则表达式');
        }

        compiler.plugins('compilation', (compilation)=>{
            compilation.plugin('normal-module-loader', (loaderContext, module) => {
                const result = compileFile(module.resource, this.options.parseOption);

                if(!result) return;

                // 将ssrNode缓存到森林中，并插入文档中
            });
        });

        // generate final HTML with parsed result
        compiler.plugin('emit', (compilation, callback)=>{
            if(coms.roots.length === 0){
                // no root com found
                callback();
                return;
            }
        });
    }
}

module.exports = JSX2TplPlugin;
