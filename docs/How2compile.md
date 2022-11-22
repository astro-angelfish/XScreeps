# How to compile Xscreeps

Note: this document is translated from [here](https://www.jianshu.com/p/13e2cbcb60ab) by [HoPGoldy](https://screeps.com/a/#!/profile/HoPGoldy). Astro\_angelfish does **not** have any copyright.

## Rollup
Rollup is a word. In my opinion, it's like compiling, but just an alias in JavaScript/TypeScript world. You give them a bunch of source code, it would combine into a js file which is easier to deploy. That all we need to know for this game now.

## Steps

#### 1. Configure the project and install rollup

1.1. Clone this project.
1.2. Install [NodeJS](https://nodejs.org) along with [npm](https://www.npmjs.com/). You can find them in links provided to the website. Choose the matching version for your operation system.

#### 2. Compile/Rollup the project

2.1.  You can compile with command in terminal below now
```bash
npm run build
```
Now you can find a result file called `dist/main.js` which is easier to upload.

#### 3. Upload the compiled code to Screeps
3.1. Create a key file called `.secret.json` in the root of the project. Do not worry because it won't be uploaded to your code repository or somewhere because of `.gitignore` unless you are removing it on purpose. Fill the `.secret.json` with these:
```json
{
	"main": {
		"token": "Your screeps token",
		"protocol": "https",
		"hostname": "screeps.com",
		"port": 443,
		"path": "/",
		"branch": "default"
	},
	"local": {
		"copyPath": "Where the local game repository is located."
	}
}
```
The token can be obtained [here](https://screeps.com/a/#!/account/auth-tokens), and the local repository can be located via client in the left bottom corner link displayed *Open local folder* where is in *Script* tab at the bottom.
3.2. Upload the compiled code using command
```bash
npm run push
```

