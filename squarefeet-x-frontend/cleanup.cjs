const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else {
            filelist.push(dirFile);
        }
    });
    return filelist;
}

const files = walkSync('./src').filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Regular expressions are better
    content = content.replace(/^import \{ motion \} from 'framer-motion';\r?\n?/gm, '');
    content = content.replace(/^import \{ motion, AnimatePresence \} from 'framer-motion';/gm, "import { AnimatePresence } from 'framer-motion';");
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Cleaned up ' + file);
    }
});
