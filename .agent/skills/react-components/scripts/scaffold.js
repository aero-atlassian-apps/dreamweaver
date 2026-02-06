
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: node scaffold.js <ComponentName> [ElementType]');
    process.exit(1);
}

const componentName = args[0];
const elementType = args[1] || 'div';

// Helpers
const toKebabCase = str => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`).replace(/^-/, '');
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

const kebabName = toKebabCase(componentName);
const elementCapitalized = capitalize(elementType);

// Paths
const templatePath = path.join(__dirname, '../resources/templates/component.tsx.hbs');
const targetDir = path.join(process.cwd(), 'src/components/ui', componentName); // Default location

// Ensure directory calls
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Read template
let template = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
const content = template
    .replace(/{{ComponentName}}/g, componentName)
    .replace(/{{ElementType}}/g, elementType)
    .replace(/{{ElementCapitalized}}/g, elementCapitalized)
    .replace(/{{kebabName}}/g, kebabName);

// Write Component
const filePath = path.join(targetDir, `${componentName}.tsx`);
fs.writeFileSync(filePath, content);
console.log(`Created ${filePath}`);

// Write CSS
const cssPath = path.join(targetDir, `${componentName}.css`);
const cssContent = `.${kebabName} {\n  /* TODO: Add styles */\n}\n`;
fs.writeFileSync(cssPath, cssContent);
console.log(`Created ${cssPath}`);

// Write index.ts
const indexPath = path.join(targetDir, 'index.ts');
fs.writeFileSync(indexPath, `export * from './${componentName}';\n`);
console.log(`Created ${indexPath}`);

console.log('Done!');
