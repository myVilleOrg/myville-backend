# myVille
Api backend for the future application.

v0.1


### Getting started
To start developping the myVille backend follow the steps.

First copy the project :
```bash
$ git clone git@github.com:myVilleOrg/myville-backend.git
```
When it finishes
```bash
$ npm install
```
You have to install mongodb at least v3.0 in order to use Big Polygon feature (https://www.mongodb.com/blog/post/mongodb-30-features-big-polygon). A tutorial to install last version mongodb https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
And it should be nice :)

### Configuration
Go to the file config/config.js.
Update the file with our informations.
```
development: {
		root: rootPath, #Don't touch
		app: {
			name: 'backend' #Name of application
		},
		port: process.env.PORT || 3000, # port running (by default 3000)
		db: '', # MongoDB address
		tokenSalt: '', # Token salt can be anything
		nosecurePath: ['/user/reset', '/user/create', '/user/login', '/', '/user/login/facebook', '/user/login/google', '/ua/get/geo', '/ua/get/popular', '/user/forgetPassword'], #Don't touch
		facebook: { # Facebook application credentials
			appId: '',
			appSecret: ''
		},
		google: { # Google application credentials
			appId: '',
			appSecret: ''
		},
		email: { # SMTP server configuration to send mail
			host: 'smtp.gmail.com',
			port: 587,
			auth: {
				user: '',
				pass: ''
			}
		}
	}
```
### Usage
To launch the project, just use the following command :
```bash
$ npm start
```

### Docker
Build the image :
```bash
$ sudo docker build absolute-path-of-myville-backend -t myville-backend
```
Run it in a container :
```bash
$ sudo docker run -i -d -p 3000:3000 -v absolute-path-of-myville-backend-config-folder:/app/config myville-backend
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
