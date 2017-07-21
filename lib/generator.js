const fs = require('fs'),
iconv = require('iconv-lite');


let header = Buffer([]);
header = Buffer.concat([ header, new Buffer("%FDF-1.2\n") ]);
header = Buffer.concat([ header, new Buffer((String.fromCharCode(226)) + (String.fromCharCode(227)) + (String.fromCharCode(207)) + (String.fromCharCode(211)) + "\n") ]);
header = Buffer.concat([ header, new Buffer("1 0 obj \n") ]);
header = Buffer.concat([ header, new Buffer("<<\n") ]);
header = Buffer.concat([ header, new Buffer("/FDF \n") ]);
header = Buffer.concat([ header, new Buffer("<<\n") ]);
header = Buffer.concat([ header, new Buffer("/Fields [\n") ]);

let footer = Buffer([]);
footer = Buffer.concat([ footer, new Buffer("]\n") ]);
footer = Buffer.concat([ footer, new Buffer(">>\n") ]);
footer = Buffer.concat([ footer, new Buffer(">>\n") ]);
footer = Buffer.concat([ footer, new Buffer("endobj \n") ]);
footer = Buffer.concat([ footer, new Buffer("trailer\n") ]);
footer = Buffer.concat([ footer, new Buffer("\n") ]);
footer = Buffer.concat([ footer, new Buffer("<<\n") ]);
footer = Buffer.concat([ footer, new Buffer("/Root 1 0 R\n") ]);
footer = Buffer.concat([ footer, new Buffer(">>\n") ]);
footer = Buffer.concat([ footer, new Buffer("%%EOF\n") ]);


exports.generator = (data, fileName) => {
  return new Promise((resolve, reject) => {
    let body, dataKeys;

    dataKeys = Object.keys(data);

    body = new Buffer([]);

    for(var i=0; i<dataKeys.length; i++) {
      var name = dataKeys[i];
      var value = data[name];

      body = Buffer.concat([ body, new Buffer("<<\n") ]);
      body = Buffer.concat([ body, new Buffer("/T (") ]);
      body = Buffer.concat([ body, iconv.decode(name.toString(), 'utf8') ]);
      body = Buffer.concat([ body, new Buffer(")\n") ]);
      body = Buffer.concat([ body, new Buffer("/V (") ]);
      body = Buffer.concat([ body, iconv.decode(value.toString(), 'utf8') ]);
      body = Buffer.concat([ body, new Buffer(")\n") ]);
      body = Buffer.concat([ body, new Buffer(">>\n") ]);
    }

    fs.writeFile(fileName, Buffer.concat([ header, body, footer ]), (err) => {
      if(err) return reject(err);
       
      return resolve();
    });
  });
}
