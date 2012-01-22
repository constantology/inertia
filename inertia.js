//#!/usr/bin/env node
var fs          = require( 'fs'     ),
	path        = require( 'path'   ),
	url         = require( 'url'    ),
	util        = require( 'util'   ),
	zlib        = require( 'zlib'   ),

	mime        = require( 'mime' ),
	server_info = 'inertia/0.0.1',
	slice       = Array.prototype.slice;

module.exports = {
	mime          : mime,
	createHandler : function() {
		var SH = new StaticHandler;
		slice.call( arguments ).forEach( SH.addFileHandler, SH );
		return SH;
	}
};

function cache( SH, url, response ) {
	SH.__cache[url.path] || ( SH.__cache[url.path] = prepare( SH, url, response ) );

	return SH.__cache[url.path];
}

function compress( SH, o, response ) {
	if ( SH.useCache ) {
		if ( o.wait === true ) {
			o.fns.push( createCallback( response, o ) );
			return o;
		}
		if ( o.file_cmp ) return o;
	}
	if ( SH.__compress[o.ext] ) {
		o.fns.push( createCallback( response, o ) );
		o.headers['Content-Encoding'] = 'deflate';
		o.wait = true;

		zlib.deflate( o.file_buf, function( err, compressed ) {
			delete o.wait;
			if ( err ) throw err;
			o.file_cmp = compressed;
			o.headers['Content-Length'] = o.file_cmp.length;
			finish( o );
		} );

		return o;
	}
	else return o;
}

function copy( destination, source ) {
	Object.keys( source ).forEach( function( key ) { destination[key] = source[key]; } );
	return destination;
}

function createCallback( response, o ) {
	return function() { respond( response, o ); };
}

function finish( o ) {
	if ( o.fns.length ) {
		o.fns.forEach( function( fn ) { fn(); } );
		delete o.fns;
	}
}

function prepare( SH, url, response ) {
	var o, p    = path.normalize( process.cwd() + url.path ),
		ext     = path.extname( p ).substring( 1 ),
		stat    = fs.statSync( p ),
		headers = {
			'Content-Length' : stat.size,
			'Date'           : new Date().toUTCString(),
			'Last-Modified'  : new Date( stat.mtime ).toUTCString(),
			'Server'         : server_info
		};

	headers['Content-Type'] = mime.lookup( ext );

	if ( stat.isFile() ) o = {
		ext      : ext,
		fns      : [],
		file_buf : fs.readFileSync( p ),
		headers  : headers,
		status   : 200,
		success  : true,
		url      : url.path
	};
	else {
		o = {
			ext      : 'txt',
			fns      : [],
			file_buf : util.format( '404 %s not found.', url.path ),
			headers  : headers,
			status   : 404,
			success  : false,
			url      : url.path
		};
		o.headers['Content-Length'] = o.file_buf.length;
		o.headers['Content-Type']   = mime.lookup( 'txt' );
	}

	typeof SH.__maxAge[ext] != 'number'
	|| ( o.headers['Cache-Control'] = util.format( 'max-age=%d', SH.__maxAge[ext] ) );

	return SH.useCompression ? compress( SH, o, response ) : o;
}

function respond( response, o ) {
	response.writeHead( o.status, o.headers );
	response.end( o.file_cmp || o.file_buf );
	return o.success;
}

function send( SH, url, response ) {
	var o = !SH.useCache ? prepare( SH, url, response ) : cache( SH, url, response );

	if ( o.wait === true ) {
		o.fns.push( createCallback( response, o ) );
		return true;
	}
	else respond( response, o );

	return o.success;
}

function StaticHandler( config ) {
	copy( this, config || {} );

	this.__cache        = {};
	this.__compress     = { txt : true };
	this.__files        = [];
	this.__directories  = [];
	this.__maxAge       = {};
}

StaticHandler.prototype = {
	encoding       : 'utf-8',
	maxAge         : 3600,
	useCache       : true,
	useCompression : true,

	addFileHandler : function( ext, type ) {
		if ( typeof type == 'string' && typeof ext == 'string' && !( ext in mime.types ) ) {
			var nm = {};
			mime.define( ( nm[type.toLowerCase()] = ext ) );
		}

		this.__files.push( typeof ext == 'string' ? new RegExp( '\\.' + ext + '$', 'i' ) : ext );

		return this;
	},
	addDirHandler  : function( dir ) {
		this.__directories.push( typeof dir == 'string' ? new RegExp( '\\/' + dir + '|' + dir + '\\/', 'i' ) : dir );

		return this;
	},
	compress       : function() {
		slice.call( arguments ).forEach( function( extension ) {
			this.__compress[String( extension ).toLowerCase()] = true;
		}, this );

		return this;
	},
	maxAge         : function() {
		var a       = slice.call( arguments ),
			max_age = typeof a[a.length - 1] == 'number' ? a.pop() : this.maxAge;

		a.forEach( function( ext ) { this[ext] = max_age; }, this.__maxAge );

		return this;
	},
	serve          : function( request, response ) {
		var urlp = url.parse( request.url );

		return !!this.__directories.some( function( directory ) {
			return directory.test( urlp.path ) ? send( this, urlp, response ) : false;
		}, this )
		|| !!this.__files.some( function( file ) {
			return file.test( urlp.path ) ? send( this, urlp, response ) : false;
		}, this );
	}
};
