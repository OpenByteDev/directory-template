#! /usr/bin/env node

const process = require('process');
const path = require('path');
const fs = require('fs');
const afs = fs.promises;
const readline = require('readline');
const rmdirRecursiveAsync = require('rmdir-recursive-async');
const stringReplaceAsync = require('string-replace-async');
const yargs = require('yargs');

const data = new Map();

async function main() {
    const args = yargs
		.scriptName('directory-template')
		.option('template', {
			alias: 't',
			describe: 'Template directory',
            type: 'string',
            demandOption: true,
            normalize: true,
            requiresArg: true,
            coerce: e => validateDirectory(e, 'Template')
		})
        .option('out', {
            alias: 'o',
            describe: 'Target directory',
            type: 'string',
			demandOption: true,
            normalize: true,
            requiresArg: true,
            coerce: e => validateDirectory(e, 'Target')
        })
		.option('clear', {
			describe: 'Clear target directory',
			default: false
        })
		.help()
		.parse();

	if (args.clear)
		await rmdirRecursiveAsync(args.out, false);
	
	return run(args.template, args.out);
}

function validateDirectory(path, name) {
	if (!fs.existsSync(path))
        throw new TypeError(name + ' does not exist');
	const stats = fs.statSync(path);
	if (!stats.isDirectory())
		throw new TypeError(name + ' has to be a directory');
	return path;
}

async function run(template, target) {
	const files = await afs.readdir(template);
	for (const file of files) {
		const p = path.join(template, file);
		const stats = await afs.stat(p);
		if (stats.isDirectory())
			await run(p, await fillDir(p, target));
		else await fillFile(p, target);
	}
}

async function fillDir(dir, target) {
	console.log('Directory: ', dir);
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
