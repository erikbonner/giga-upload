/**
 * Some parts of this code are based on code in the fo0nikens file uploader example: 
 * https://github.com/fo0nikens/file-uploader
 * 
 * Licence:
 * 
 * The MIT License (MIT)
 * 
 * Copyright (c) 2016 coligo
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
const express = require('express');
const app = express();
const path = require('path');
const formidable = require('formidable');
const fs = require('fs');
const jsonfile = require('jsonfile');
const shortid = require('shortid');

const serverConfigFile = './server-config.json'

// set default baseUrl to root.
// This may be overloaded by defining a new value in serverConfigFile on the server.
// This will be necessary if we are hosting the webapp from a subdirectory
let baseUrl = "/"
if(fs.existsSync(serverConfigFile)) {
  console.log("reading local server configuration...")
  try {
    baseUrl = JSON.parse(fs.readFileSync(serverConfigFile)).baseUrl || baseUrl
    console.log("updated baseUrl to", baseUrl)
  } catch(e) {
    console.warn("error loading server config:", e);
    console.warn("using defaults");
  }
}
console.log("baseUrl:", baseUrl);

const mappingsJson = './mappings.json';
if(!fs.existsSync(mappingsJson)){
  console.log("No mapping file found, creating a new one...");
  fs.writeFileSync(mappingsJson, "{}", {flag: "w+"})
}

const getKey = (keymap, filename) => {

  // first check to see of path already exists
  var key;
  const keys = Object.keys(keymap);  
  for (var i = 0; i < keys.length; i++) {
    if(filename === keymap[keys[i]]) {
      key = keys[i];
      break;
    }
  }

  return key || shortid.generate();
}

const updateKeymap = (filename) => {
  const mappingsFile = path.join(__dirname, mappingsJson);
  const keymap = jsonfile.readFileSync(mappingsFile);
  const key = getKey(keymap, filename);
  keymap[key] = filename;
  jsonfile.writeFileSync(mappingsFile, keymap);
  return key;
}

const getPathFromKeymap = (key) => {
  const mappingsFile = path.join(__dirname, mappingsJson);  
  return jsonfile.readFileSync(mappingsFile)[key];
}

const router = express.Router()

app.use(baseUrl, express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs')

router.get('/', (_, res) => {
  console.log("GET received /");
  res.render(path.join(__dirname, 'views/index.ejs'), {baseUrl})
});

router.get('/:id', (req, res) => {
  const id = req.params.id;
  console.log("GET received /:id", id)
  const filename = getPathFromKeymap(id);
  if (filename === undefined || filename === null) {
    res.status(404).render(path.join(__dirname, 'views/not-found.ejs'), {baseUrl});
    return;
  }
  res.set({ "Content-Disposition": 'attachment; filename="' + filename + '"' });
  res.sendFile(path.join(__dirname, 'uploads/' + filename));
});

router.post('/upload', (req, res) => {
  console.log("upload received")
  var key;
  var form = new formidable.IncomingForm();
  form.uploadDir = path.join(__dirname, '/uploads');
  form.on('file', (_, file) => {
    fs.renameSync(file.path, path.join(form.uploadDir, file.name));
    key = updateKeymap(file.name);
  });

  form.on('error', () => console.log('An error has occured: \n' + err));
  form.on('end', () => res.end(key));

  form.parse(req);
});

app.use(baseUrl, router)

const port = process.env.PORT || '8080';
app.listen(port, () => console.log(`Server listening on port ${port}`));
