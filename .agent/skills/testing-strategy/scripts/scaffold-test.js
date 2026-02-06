
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 1) {
    console.error('Usage: node scaffold-test.js <SubjectName> [TargetDir]');
    process.exit(1);
}

const subjectName = args[0];
const targetDir = args[1] || process.cwd();

const templatePath = path.join(__dirname, '../resources/templates/test.ts.hbs');

if (!fs.existsSync(templatePath)) {
    console.error(`Template not found at ${templatePath}`);
    process.exit(1);
}

const template = fs.readFileSync(templatePath, 'utf8');
const content = template.replace(/{{SubjectName}}/g, subjectName);

const filePath = path.join(targetDir, `${subjectName}.test.ts`);

if (fs.existsSync(filePath)) {
    console.error(`File already exists: ${filePath}`);
    process.exit(1);
}

fs.writeFileSync(filePath, content);
console.log(`Created test file at ${filePath}`);
