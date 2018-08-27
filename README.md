# directory-template
Generate directories based on templates.

[![npm version](https://badge.fury.io/js/directory-template.svg)](https://www.npmjs.com/package/directory-template) 
[![Dependency Status](https://david-dm.org/OpenByteDev/directory-templater/status.svg)](https://david-dm.org/OpenByteDev/directory-template)
[![DevDependency Status](https://david-dm.org/OpenByteDev/directory-template/dev-status.svg)](https://david-dm.org/OpenByteDev/directory-template?type=dev)
[![License](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

<hr>

## Getting Started
### Installation
```bash
$ npm i -g directory-template
```

### Usage
```bash
dtgen --template <path to template> --out <path to target>
```

The template directory is searched for template expressions and prompts the user to provide values.

A template expression looks like this: `{{<name>}}`


An optional modifier can be included to modify the provoded value:
`{{<modifier>;<name>}}`
 - cp: capitalize
 - lc: lowercase
 - uc: uppercase
