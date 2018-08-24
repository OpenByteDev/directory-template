const process = require('process');
const path = require('path');
const fs = require('fs');
const afs = fs.promises;
const readline = require('readline');
const rmdirRecursiveAsync = require('rmdir-recursive-async');
const stringReplaceAsync = require('string-replace-async');

const data = new Map();

async function main() {
	const args = process.argv.slice(2);
	
	if (args.length < 1)
		return Promise.reject('Template directory not specified');

	const templateDir = args[0];
	const templateDirStats = await afs.stat(templateDir).catch(() => null);
	if (templateDir === null || !templateDirStats.isDirectory())
		return Promise.reject('Invalid template directory specified: ' + templateDir);
	
	
	if (args.length < 2)
		return Promise.reject('Target directory not specified');
	
	const targetDir = args[1];
	if (fs.existsSync(targetDir))
		await rmdirRecursiveAsync(targetDir);
	await afs.mkdir(targetDir)
	
	
	return run(templateDir, targetDir);
}

async function run(template, target) {
	const dir = template;
	const files = await afs.readdir(dir);
	for (file of files) {
		const p = path.join(dir, file);
		const stats = await afs.stat(p);
		if (stats.isDirectory())
			await run(p, await fillDir(p, target));
		else await fillFile(p, target);
	}
}

async function fillDir(dir, target) {
	console.log('Directory: ', file);
	const name = path.basename(dir);
	const targetName = await replace(name);
	const targetDir = path.join(target, targetName);
	await afs.mkdir(targetDir);
	return targetDir;
}

async function fillFile(file, target) {
	console.log('File: ', file);
	const name = path.basename(file);
	const targetName = await replace(name);
	const targetFile = path.join(target, targetName);
	const contentBuffer = await afs.readFile(file);
	const contents = contentBuffer.toString();
	const targetContents = await replace(contents);
	await afs.writeFile(targetFile, targetContents);
	return targetFile;
}

async function replace(str) {
	const regex = /{{([^{}]+)}}/ig;
	return stringReplaceAsync(str, regex, replacer);
}

async function replacer(match, p1) {
	const [ key, mod=null ] = p1.split(';', 2).reverse();
	if (data.has(key))
		return getModValue(mod, data.get(key));
	const userInput = (await input('{{' + key + '}}: ')).trim();
	if (userInput.replace(/\t\n\s/, '') === '')
		return match;
	data.set(key, userInput);
	return getModValue(mod, userInput);
}

function getModValue(mod, value) {
	if (!mod)
		return value;
	switch (mod) {
		case 'lc':
			return value.toLowerCase();
		case 'uc':
			return value.toUpperCase();
		case 'cp':
			return capitalizeFirstLetter(value);
		default:
			return value;
	}
}

// https://stackoverflow.com/a/1026087/6304917
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

async function input(prompt) {
	return new Promise(resolve => {
		const reader = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		reader.question(prompt, answer => {
			resolve(answer);
			reader.close();
		});
	});
}


main().then(e => {
	if (e)
		console.log(e);
}).catch(e => {
	if (e)
		console.error(e);
});
