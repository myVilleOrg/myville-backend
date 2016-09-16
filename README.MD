# myVille
Api backend for the future application.

v0.1


### Getting started
To start developping the myVille backend follow the steps.

First copy the project :
```bash
$ git clone https://kakulukian@bitbucket.org/kakulukian/myville-backend.git
```
When it finishes
```bash
$ npm install
```
And it should be nice :)

### Usage
To launch the project, just use the following command :
```bash
$ npm start
```
### Pull Request
If you want to add features on the backend, you should respect several conditions :

First, create a branch from the project with coherent name, if you want to add a feature call it : feature/my-feature

For a hotfix : hotfix/my-hotfix

Once your modifications on your branch are finished, just do a pull request on the branch next-version :)


### Coding conventions

Don't put spaces before if and for parentheses.

Put spaces around comparaison signs (`=`, `<`, `===`, `+`, `:`).

Try using `===` instead of `==` as much as possible.

```
if(x === 1) x++;
for(var i = 0; i < 5; i++) console.log('Hello ' + i);

var object = {
	key:value, // WRONG
	key :value, // WRONG
	key : value // WRONG
	key: value, // RIGHT
}
```
Try aligning lines that match together.
Avoid using switch.
Only use single quotes
Use empty lines only for logic separation. Never use more than 1 separation line.
Indent using tabs and not spaces (tab length = 4 spaces)
