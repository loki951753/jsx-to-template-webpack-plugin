const fs = require('fs');
const babelParser = require('@babel/parser');

class Parser {
    constructor(filepath, option){
        this.filepath = filepath;
        this.option = option;
    }
    parse(){
        const content = fs.readFileSync(this.filepath, 'utf8');
        const ast = babelParser.parse(content, {
            sourceType: 'module',
            plugins: this.option.plugins
        });

        let comInfo;

        // visitor to find the com need to be transpile and parse meta data in the leading comment
        const validateElementVisitor = {
            JSXElement(path){
                let node = path.node;
                if((!node))
            }
        };
    }
}

module.exports = Parser;
