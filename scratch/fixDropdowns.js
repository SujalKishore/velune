const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'settings', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to match the selectWrapper div, the select, its options, and the closing ChevronDown & div.
// It handles newlines and attributes on the select.
const regex = /<div className=\{styles\.selectWrapper\}>\s*<select\s*className=\{styles\.dropdown\}([\s\S]*?)>([\s\S]*?)<\/select>\s*<ChevronDown[^>]*\/>\s*<\/div>/g;

content = content.replace(regex, (match, selectAttrs, options) => {
    return `<select className={styles.selectControl}${selectAttrs}>${options}</select>`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced all selectWrapper occurrences.');
