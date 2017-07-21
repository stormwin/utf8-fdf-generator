'use strict';

const { writeFile } = require('fs');

let header = Buffer.from([]);
header = Buffer.concat([ header, Buffer.from('%FDF-1.2\n') ]);
header = Buffer.concat([ header, Buffer.from((String.fromCharCode(226)) + (String.fromCharCode(227)) + (String.fromCharCode(207)) + (String.fromCharCode(211)) + '\n') ]);
header = Buffer.concat([ header, Buffer.from('1 0 obj \n') ]);
header = Buffer.concat([ header, Buffer.from('<<\n') ]);
header = Buffer.concat([ header, Buffer.from('/FDF \n') ]);
header = Buffer.concat([ header, Buffer.from('<<\n') ]);
header = Buffer.concat([ header, Buffer.from('/Fields [\n') ]);

let footer = Buffer.from([]);
footer = Buffer.concat([ footer, Buffer.from(']\n') ]);
footer = Buffer.concat([ footer, Buffer.from('>>\n') ]);
footer = Buffer.concat([ footer, Buffer.from('>>\n') ]);
footer = Buffer.concat([ footer, Buffer.from('endobj \n') ]);
footer = Buffer.concat([ footer, Buffer.from('trailer\n') ]);
footer = Buffer.concat([ footer, Buffer.from('\n') ]);
footer = Buffer.concat([ footer, Buffer.from('<<\n') ]);
footer = Buffer.concat([ footer, Buffer.from('/Root 1 0 R\n') ]);
footer = Buffer.concat([ footer, Buffer.from('>>\n') ]);
footer = Buffer.concat([ footer, Buffer.from('%%EOF\n') ]);


exports.generator = (data, fileName) => {
  return new Promise((resolve, reject) => {
    let body, dataKeys;

    dataKeys = Object.keys(data);

    body = Buffer.from([]);

    for(var i=0; i<dataKeys.length; i++) {
      var name = dataKeys[i];
      var value = data[name];

      body = Buffer.concat([ body, Buffer.from('<<\n') ]);
      body = Buffer.concat([ body, Buffer.from('/T (') ]);
      body = Buffer.concat([ body, Buffer.from(name, 'utf8') ]);
      body = Buffer.concat([ body, Buffer.from(')\n') ]);
      body = Buffer.concat([ body, Buffer.from('/V (') ]);
      body = Buffer.concat([ body, Buffer.from(value, 'utf8') ]);
      body = Buffer.concat([ body, Buffer.from(')\n') ]);
      body = Buffer.concat([ body, Buffer.from('>>\n') ]);

    }

    writeFile(fileName, Buffer.concat([ header, body, footer ]), (err) => {
      if(err) return reject(err);
       
      return resolve();
    });
  });
};
