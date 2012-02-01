# inertia

inertia is a VERY simple static file server for nodejs. so simple, it's retarded.

## Installation

```
   npm install inertia

```

## Requiring

```javascript

   var inertia = require( 'inertia' );

```

## Usage

```javascript

   var static = inertia.createHandler();

   static.encoding       = 'iso-8859-1';                     // set character encoding
   static.useCache       = false|true;                       // turn off/ on in-memory caching
   static.useCompression = false|true;                       // turn off/ on compression

   static.addFileHandler( /^static\..*\.(gif|jpe?g|png)$/i ) // regexp file handler
         .addFileHandler( 'foo', 'application/foo' )        // add a custom file type with a custom mime type
         .addFileHandler( 'html' );                         // add a standard file type, common mime types are handled internally

   static.addDirHandler( './lib' );                          // serve all files from a specific directory

   static.compress( 'css', 'html', 'js', 'json', 'txt' );    // compress (using deflate) files with specific extensions

   static.maxAge( 'css', 'js'  60 * 60 * 24 )                // add max-age Cache-Control headers for specific extensions
         .maxAge( 'html',      60 * 60 )

   http.createServer( function( req, res ) {
      if ( static.serve( req, res ) ) return;

      // otherwise, do something else...
   } ).listen( '8080' );

```

## License

(The MIT License)

Copyright &copy; 2012 christos "constantology" constandinou http://muigui.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
