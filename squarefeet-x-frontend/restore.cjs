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
    
    // Check if motion is used
    if (content.includes('<motion.')) {
        // Check if motion is imported
        if (!content.includes('import { motion') && !content.includes('import {motion')) {
            // Find a good place to insert, right after the last import or at the top
            const lines = content.split('\n');
            let insertIdx = 0;
            for(let i=0; i<lines.length; i++) {
                if (lines[i].startsWith('import ')) {
                    insertIdx = i;
                }
            }
            lines.splice(insertIdx + 1, 0, "import { motion } from 'framer-motion';");
            fs.writeFileSync(file, lines.join('\n'));
            console.log('Restored motion to ' + file);
        }
    }
});
