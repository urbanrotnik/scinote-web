( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {

$.ui = $.ui || {};

return $.ui.version = "1.12.1";

} ) );

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery", "./version" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {

// This file is deprecated
return $.ui.ie = !!/msie [\w.]+/.exec( navigator.userAgent.toLowerCase() );
} ) );


/*!
 * jQuery UI Widget 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Widget
//>>group: Core
//>>description: Provides a factory for creating stateful widgets with a common API.
//>>docs: http://api.jqueryui.com/jQuery.widget/
//>>demos: http://jqueryui.com/widget/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery", "./version" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

var widgetUuid = 0;
var widgetSlice = Array.prototype.slice;

$.cleanData = ( function( orig ) {
	return function( elems ) {
		var events, elem, i;
		for ( i = 0; ( elem = elems[ i ] ) != null; i++ ) {
			try {

				// Only trigger remove when necessary to save time
				events = $._data( elem, "events" );
				if ( events && events.remove ) {
					$( elem ).triggerHandler( "remove" );
				}

			// Http://bugs.jquery.com/ticket/8235
			} catch ( e ) {}
		}
		orig( elems );
	};
} )( $.cleanData );

$.widget = function( name, base, prototype ) {
	var existingConstructor, constructor, basePrototype;

	// ProxiedPrototype allows the provided prototype to remain unmodified
	// so that it can be used as a mixin for multiple widgets (#8876)
	var proxiedPrototype = {};

	var namespace = name.split( "." )[ 0 ];
	name = name.split( "." )[ 1 ];
	var fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	if ( $.isArray( prototype ) ) {
		prototype = $.extend.apply( null, [ {} ].concat( prototype ) );
	}

	// Create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {

		// Allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// Allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};

	// Extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,

		// Copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),

		// Track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	} );

	basePrototype = new base();

	// We need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( !$.isFunction( value ) ) {
			proxiedPrototype[ prop ] = value;
			return;
		}
		proxiedPrototype[ prop ] = ( function() {
			function _super() {
				return base.prototype[ prop ].apply( this, arguments );
			}

			function _superApply( args ) {
				return base.prototype[ prop ].apply( this, args );
			}

			return function() {
				var __super = this._super;
				var __superApply = this._superApply;
				var returnValue;

				this._super = _super;
				this._superApply = _superApply;

				returnValue = value.apply( this, arguments );

				this._super = __super;
				this._superApply = __superApply;

				return returnValue;
			};
		} )();
	} );
	constructor.prototype = $.widget.extend( basePrototype, {

		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? ( basePrototype.widgetEventPrefix || name ) : name
	}, proxiedPrototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		widgetFullName: fullName
	} );

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// Redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor,
				child._proto );
		} );

		// Remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );

	return constructor;
};

$.widget.extend = function( target ) {
	var input = widgetSlice.call( arguments, 1 );
	var inputIndex = 0;
	var inputLength = input.length;
	var key;
	var value;

	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {

				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :

						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );

				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string";
		var args = widgetSlice.call( arguments, 1 );
		var returnValue = this;

		if ( isMethodCall ) {

			// If this is an empty collection, we need to have the instance method
			// return undefined instead of the jQuery instance
			if ( !this.length && options === "instance" ) {
				returnValue = undefined;
			} else {
				this.each( function() {
					var methodValue;
					var instance = $.data( this, fullName );

					if ( options === "instance" ) {
						returnValue = instance;
						return false;
					}

					if ( !instance ) {
						return $.error( "cannot call methods on " + name +
							" prior to initialization; " +
							"attempted to call method '" + options + "'" );
					}

					if ( !$.isFunction( instance[ options ] ) || options.charAt( 0 ) === "_" ) {
						return $.error( "no such method '" + options + "' for " + name +
							" widget instance" );
					}

					methodValue = instance[ options ].apply( instance, args );

					if ( methodValue !== instance && methodValue !== undefined ) {
						returnValue = methodValue && methodValue.jquery ?
							returnValue.pushStack( methodValue.get() ) :
							methodValue;
						return false;
					}
				} );
			}
		} else {

			// Allow multiple hashes to be passed on init
			if ( args.length ) {
				options = $.widget.extend.apply( null, [ options ].concat( args ) );
			}

			this.each( function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} );
					if ( instance._init ) {
						instance._init();
					}
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			} );
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",

	options: {
		classes: {},
		disabled: false,

		// Callbacks
		create: null
	},

	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = widgetUuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();
		this.classesElementLookup = {};

		if ( element !== this ) {
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			} );
			this.document = $( element.style ?

				// Element within the document
				element.ownerDocument :

				// Element is window or document
				element.document || element );
			this.window = $( this.document[ 0 ].defaultView || this.document[ 0 ].parentWindow );
		}

		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this._create();

		if ( this.options.disabled ) {
			this._setOptionDisabled( this.options.disabled );
		}

		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},

	_getCreateOptions: function() {
		return {};
	},

	_getCreateEventData: $.noop,

	_create: $.noop,

	_init: $.noop,

	destroy: function() {
		var that = this;

		this._destroy();
		$.each( this.classesElementLookup, function( key, value ) {
			that._removeClass( value, key );
		} );

		// We can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.off( this.eventNamespace )
			.removeData( this.widgetFullName );
		this.widget()
			.off( this.eventNamespace )
			.removeAttr( "aria-disabled" );

		// Clean up events and states
		this.bindings.off( this.eventNamespace );
	},

	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key;
		var parts;
		var curOption;
		var i;

		if ( arguments.length === 0 ) {

			// Don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {

			// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( arguments.length === 1 ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( arguments.length === 1 ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},

	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},

	_setOption: function( key, value ) {
		if ( key === "classes" ) {
			this._setOptionClasses( value );
		}

		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this._setOptionDisabled( value );
		}

		return this;
	},

	_setOptionClasses: function( value ) {
		var classKey, elements, currentElements;

		for ( classKey in value ) {
			currentElements = this.classesElementLookup[ classKey ];
			if ( value[ classKey ] === this.options.classes[ classKey ] ||
					!currentElements ||
					!currentElements.length ) {
				continue;
			}

			// We are doing this to create a new jQuery object because the _removeClass() call
			// on the next line is going to destroy the reference to the current elements being
			// tracked. We need to save a copy of this collection so that we can add the new classes
			// below.
			elements = $( currentElements.get() );
			this._removeClass( currentElements, classKey );

			// We don't use _addClass() here, because that uses this.options.classes
			// for generating the string of classes. We want to use the value passed in from
			// _setOption(), this is the new value of the classes option which was passed to
			// _setOption(). We pass this value directly to _classes().
			elements.addClass( this._classes( {
				element: elements,
				keys: classKey,
				classes: value,
				add: true
			} ) );
		}
	},

	_setOptionDisabled: function( value ) {
		this._toggleClass( this.widget(), this.widgetFullName + "-disabled", null, !!value );

		// If the widget is becoming disabled, then nothing is interactive
		if ( value ) {
			this._removeClass( this.hoverable, null, "ui-state-hover" );
			this._removeClass( this.focusable, null, "ui-state-focus" );
		}
	},

	enable: function() {
		return this._setOptions( { disabled: false } );
	},

	disable: function() {
		return this._setOptions( { disabled: true } );
	},

	_classes: function( options ) {
		var full = [];
		var that = this;

		options = $.extend( {
			element: this.element,
			classes: this.options.classes || {}
		}, options );

		function processClassString( classes, checkOption ) {
			var current, i;
			for ( i = 0; i < classes.length; i++ ) {
				current = that.classesElementLookup[ classes[ i ] ] || $();
				if ( options.add ) {
					current = $( $.unique( current.get().concat( options.element.get() ) ) );
				} else {
					current = $( current.not( options.element ).get() );
				}
				that.classesElementLookup[ classes[ i ] ] = current;
				full.push( classes[ i ] );
				if ( checkOption && options.classes[ classes[ i ] ] ) {
					full.push( options.classes[ classes[ i ] ] );
				}
			}
		}

		this._on( options.element, {
			"remove": "_untrackClassesElement"
		} );

		if ( options.keys ) {
			processClassString( options.keys.match( /\S+/g ) || [], true );
		}
		if ( options.extra ) {
			processClassString( options.extra.match( /\S+/g ) || [] );
		}

		return full.join( " " );
	},

	_untrackClassesElement: function( event ) {
		var that = this;
		$.each( that.classesElementLookup, function( key, value ) {
			if ( $.inArray( event.target, value ) !== -1 ) {
				that.classesElementLookup[ key ] = $( value.not( event.target ).get() );
			}
		} );
	},

	_removeClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, false );
	},

	_addClass: function( element, keys, extra ) {
		return this._toggleClass( element, keys, extra, true );
	},

	_toggleClass: function( element, keys, extra, add ) {
		add = ( typeof add === "boolean" ) ? add : extra;
		var shift = ( typeof element === "string" || element === null ),
			options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
		options.element.toggleClass( this._classes( options ), add );
		return this;
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement;
		var instance = this;

		// No suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}

		// No element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {

				// Allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
						$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// Copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^([\w:-]*)\s*(.*)$/ );
			var eventName = match[ 1 ] + instance.eventNamespace;
			var selector = match[ 2 ];

			if ( selector ) {
				delegateElement.on( eventName, selector, handlerProxy );
			} else {
				element.on( eventName, handlerProxy );
			}
		} );
	},

	_off: function( element, eventName ) {
		eventName = ( eventName || "" ).split( " " ).join( this.eventNamespace + " " ) +
			this.eventNamespace;
		element.off( eventName ).off( eventName );

		// Clear the stack to avoid memory leaks (#10056)
		this.bindings = $( this.bindings.not( element ).get() );
		this.focusable = $( this.focusable.not( element ).get() );
		this.hoverable = $( this.hoverable.not( element ).get() );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-hover" );
			},
			mouseleave: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-hover" );
			}
		} );
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				this._addClass( $( event.currentTarget ), null, "ui-state-focus" );
			},
			focusout: function( event ) {
				this._removeClass( $( event.currentTarget ), null, "ui-state-focus" );
			}
		} );
	},

	_trigger: function( type, event, data ) {
		var prop, orig;
		var callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();

		// The original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// Copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[ 0 ], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}

		var hasOptions;
		var effectName = !options ?
			method :
			options === true || typeof options === "number" ?
				defaultEffect :
				options.effect || defaultEffect;

		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}

		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;

		if ( options.delay ) {
			element.delay( options.delay );
		}

		if ( hasOptions && $.effects && $.effects.effect[ effectName ] ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue( function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			} );
		}
	};
} );

return $.widget;

} ) );




/*!
 * jQuery UI Mouse 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Mouse
//>>group: Widgets
//>>description: Abstracts mouse-based interactions to assist in creating certain widgets.
//>>docs: http://api.jqueryui.com/mouse/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [
			"jquery",
			"../ie",
			"../version",
			"../widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

var mouseHandled = false;
$( document ).on( "mouseup", function() {
	mouseHandled = false;
} );

return $.widget( "ui.mouse", {
	version: "1.12.1",
	options: {
		cancel: "input, textarea, button, select, option",
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.on( "mousedown." + this.widgetName, function( event ) {
				return that._mouseDown( event );
			} )
			.on( "click." + this.widgetName, function( event ) {
				if ( true === $.data( event.target, that.widgetName + ".preventClickEvent" ) ) {
					$.removeData( event.target, that.widgetName + ".preventClickEvent" );
					event.stopImmediatePropagation();
					return false;
				}
			} );

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.off( "." + this.widgetName );
		if ( this._mouseMoveDelegate ) {
			this.document
				.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
				.off( "mouseup." + this.widgetName, this._mouseUpDelegate );
		}
	},

	_mouseDown: function( event ) {

		// don't let more than one widget handle mouseStart
		if ( mouseHandled ) {
			return;
		}

		this._mouseMoved = false;

		// We may have missed mouseup (out of window)
		( this._mouseStarted && this._mouseUp( event ) );

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = ( event.which === 1 ),

			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = ( typeof this.options.cancel === "string" && event.target.nodeName ?
				$( event.target ).closest( this.options.cancel ).length : false );
		if ( !btnIsLeft || elIsCancel || !this._mouseCapture( event ) ) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if ( !this.mouseDelayMet ) {
			this._mouseDelayTimer = setTimeout( function() {
				that.mouseDelayMet = true;
			}, this.options.delay );
		}

		if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
			this._mouseStarted = ( this._mouseStart( event ) !== false );
			if ( !this._mouseStarted ) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if ( true === $.data( event.target, this.widgetName + ".preventClickEvent" ) ) {
			$.removeData( event.target, this.widgetName + ".preventClickEvent" );
		}

		// These delegates are required to keep context
		this._mouseMoveDelegate = function( event ) {
			return that._mouseMove( event );
		};
		this._mouseUpDelegate = function( event ) {
			return that._mouseUp( event );
		};

		this.document
			.on( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.on( "mouseup." + this.widgetName, this._mouseUpDelegate );

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function( event ) {

		// Only check for mouseups outside the document if you've moved inside the document
		// at least once. This prevents the firing of mouseup in the case of IE<9, which will
		// fire a mousemove event if content is placed under the cursor. See #7778
		// Support: IE <9
		if ( this._mouseMoved ) {

			// IE mouseup check - mouseup happened when mouse was out of window
			if ( $.ui.ie && ( !document.documentMode || document.documentMode < 9 ) &&
					!event.button ) {
				return this._mouseUp( event );

			// Iframe mouseup check - mouseup occurred in another document
			} else if ( !event.which ) {

				// Support: Safari <=8 - 9
				// Safari sets which to 0 if you press any of the following keys
				// during a drag (#14461)
				if ( event.originalEvent.altKey || event.originalEvent.ctrlKey ||
						event.originalEvent.metaKey || event.originalEvent.shiftKey ) {
					this.ignoreMissingWhich = true;
				} else if ( !this.ignoreMissingWhich ) {
					return this._mouseUp( event );
				}
			}
		}

		if ( event.which || event.button ) {
			this._mouseMoved = true;
		}

		if ( this._mouseStarted ) {
			this._mouseDrag( event );
			return event.preventDefault();
		}

		if ( this._mouseDistanceMet( event ) && this._mouseDelayMet( event ) ) {
			this._mouseStarted =
				( this._mouseStart( this._mouseDownEvent, event ) !== false );
			( this._mouseStarted ? this._mouseDrag( event ) : this._mouseUp( event ) );
		}

		return !this._mouseStarted;
	},

	_mouseUp: function( event ) {
		this.document
			.off( "mousemove." + this.widgetName, this._mouseMoveDelegate )
			.off( "mouseup." + this.widgetName, this._mouseUpDelegate );

		if ( this._mouseStarted ) {
			this._mouseStarted = false;

			if ( event.target === this._mouseDownEvent.target ) {
				$.data( event.target, this.widgetName + ".preventClickEvent", true );
			}

			this._mouseStop( event );
		}

		if ( this._mouseDelayTimer ) {
			clearTimeout( this._mouseDelayTimer );
			delete this._mouseDelayTimer;
		}

		this.ignoreMissingWhich = false;
		mouseHandled = false;
		event.preventDefault();
	},

	_mouseDistanceMet: function( event ) {
		return ( Math.max(
				Math.abs( this._mouseDownEvent.pageX - event.pageX ),
				Math.abs( this._mouseDownEvent.pageY - event.pageY )
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function( /* event */ ) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function( /* event */ ) {},
	_mouseDrag: function( /* event */ ) {},
	_mouseStop: function( /* event */ ) {},
	_mouseCapture: function( /* event */ ) { return true; }
} );

} ) );


/*!
 * jQuery UI :data 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: :data Selector
//>>group: Core
//>>description: Selects elements which have data stored under the specified key.
//>>docs: http://api.jqueryui.com/data-selector/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery", "./version" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {
return $.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo( function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		} ) :

		// Support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		}
} );
} ) );


/*!
 * jQuery UI Scroll Parent 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: scrollParent
//>>group: Core
//>>description: Get the closest ancestor element that is scrollable.
//>>docs: http://api.jqueryui.com/scrollParent/

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [ "jquery", "./version" ], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
} ( function( $ ) {

return $.fn.scrollParent = function( includeHidden ) {
	var position = this.css( "position" ),
		excludeStaticParent = position === "absolute",
		overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
		scrollParent = this.parents().filter( function() {
			var parent = $( this );
			if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
				return false;
			}
			return overflowRegex.test( parent.css( "overflow" ) + parent.css( "overflow-y" ) +
				parent.css( "overflow-x" ) );
		} ).eq( 0 );

	return position === "fixed" || !scrollParent.length ?
		$( this[ 0 ].ownerDocument || document ) :
		scrollParent;
};

} ) );







/*!
 * jQuery UI Sortable 1.12.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Sortable
//>>group: Interactions
//>>description: Enables items in a list to be sorted using the mouse.
//>>docs: http://api.jqueryui.com/sortable/
//>>demos: http://jqueryui.com/sortable/
//>>css.structure: ../../themes/base/sortable.css

( function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		define( [
			"jquery",
			"./mouse",
			"../data",
			"../ie",
			"../scroll-parent",
			"../version",
			"../widget"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}( function( $ ) {

return $.widget( "ui.sortable", $.ui.mouse, {
	version: "1.12.1",
	widgetEventPrefix: "sort",
	ready: false,
	options: {
		appendTo: "parent",
		axis: false,
		connectWith: false,
		containment: false,
		cursor: "auto",
		cursorAt: false,
		dropOnEmpty: true,
		forcePlaceholderSize: false,
		forceHelperSize: false,
		grid: false,
		handle: false,
		helper: "original",
		items: "> *",
		opacity: false,
		placeholder: false,
		revert: false,
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 20,
		scope: "default",
		tolerance: "intersect",
		zIndex: 1000,

		// Callbacks
		activate: null,
		beforeStop: null,
		change: null,
		deactivate: null,
		out: null,
		over: null,
		receive: null,
		remove: null,
		sort: null,
		start: null,
		stop: null,
		update: null
	},

	_isOverAxis: function( x, reference, size ) {
		return ( x >= reference ) && ( x < ( reference + size ) );
	},

	_isFloating: function( item ) {
		return ( /left|right/ ).test( item.css( "float" ) ) ||
			( /inline|table-cell/ ).test( item.css( "display" ) );
	},

	_create: function() {
		this.containerCache = {};
		this._addClass( "ui-sortable" );

		//Get the items
		this.refresh();

		//Let's determine the parent's offset
		this.offset = this.element.offset();

		//Initialize mouse events for interaction
		this._mouseInit();

		this._setHandleClassName();

		//We're ready to go
		this.ready = true;

	},

	_setOption: function( key, value ) {
		this._super( key, value );

		if ( key === "handle" ) {
			this._setHandleClassName();
		}
	},

	_setHandleClassName: function() {
		var that = this;
		this._removeClass( this.element.find( ".ui-sortable-handle" ), "ui-sortable-handle" );
		$.each( this.items, function() {
			that._addClass(
				this.instance.options.handle ?
					this.item.find( this.instance.options.handle ) :
					this.item,
				"ui-sortable-handle"
			);
		} );
	},

	_destroy: function() {
		this._mouseDestroy();

		for ( var i = this.items.length - 1; i >= 0; i-- ) {
			this.items[ i ].item.removeData( this.widgetName + "-item" );
		}

		return this;
	},

	_mouseCapture: function( event, overrideHandle ) {
		var currentItem = null,
			validHandle = false,
			that = this;

		if ( this.reverting ) {
			return false;
		}

		if ( this.options.disabled || this.options.type === "static" ) {
			return false;
		}

		//We have to refresh the items data once first
		this._refreshItems( event );

		//Find out if the clicked node (or one of its parents) is a actual item in this.items
		$( event.target ).parents().each( function() {
			if ( $.data( this, that.widgetName + "-item" ) === that ) {
				currentItem = $( this );
				return false;
			}
		} );
		if ( $.data( event.target, that.widgetName + "-item" ) === that ) {
			currentItem = $( event.target );
		}

		if ( !currentItem ) {
			return false;
		}
		if ( this.options.handle && !overrideHandle ) {
			$( this.options.handle, currentItem ).find( "*" ).addBack().each( function() {
				if ( this === event.target ) {
					validHandle = true;
				}
			} );
			if ( !validHandle ) {
				return false;
			}
		}

		this.currentItem = currentItem;
		this._removeCurrentsFromItems();
		return true;

	},

	_mouseStart: function( event, overrideHandle, noActivation ) {

		var i, body,
			o = this.options;

		this.currentContainer = this;

		//We only need to call refreshPositions, because the refreshItems call has been moved to
		// mouseCapture
		this.refreshPositions();

		//Create and append the visible helper
		this.helper = this._createHelper( event );

		//Cache the helper size
		this._cacheHelperProportions();

		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

		//Cache the margins of the original element
		this._cacheMargins();

		//Get the next scrolling parent
		this.scrollParent = this.helper.scrollParent();

		//The element's absolute position on the page minus margins
		this.offset = this.currentItem.offset();
		this.offset = {
			top: this.offset.top - this.margins.top,
			left: this.offset.left - this.margins.left
		};

		$.extend( this.offset, {
			click: { //Where the click happened, relative to the element
				left: event.pageX - this.offset.left,
				top: event.pageY - this.offset.top
			},
			parent: this._getParentOffset(),

			// This is a relative to absolute position minus the actual position calculation -
			// only used for relative positioned helper
			relative: this._getRelativeOffset()
		} );

		// Only after we got the offset, we can change the helper's position to absolute
		// TODO: Still need to figure out a way to make relative sorting possible
		this.helper.css( "position", "absolute" );
		this.cssPosition = this.helper.css( "position" );

		//Generate the original position
		this.originalPosition = this._generatePosition( event );
		this.originalPageX = event.pageX;
		this.originalPageY = event.pageY;

		//Adjust the mouse offset relative to the helper if "cursorAt" is supplied
		( o.cursorAt && this._adjustOffsetFromHelper( o.cursorAt ) );

		//Cache the former DOM position
		this.domPosition = {
			prev: this.currentItem.prev()[ 0 ],
			parent: this.currentItem.parent()[ 0 ]
		};

		// If the helper is not the original, hide the original so it's not playing any role during
		// the drag, won't cause anything bad this way
		if ( this.helper[ 0 ] !== this.currentItem[ 0 ] ) {
			this.currentItem.hide();
		}

		//Create the placeholder
		this._createPlaceholder();

		//Set a containment if given in the options
		if ( o.containment ) {
			this._setContainment();
		}

		if ( o.cursor && o.cursor !== "auto" ) { // cursor option
			body = this.document.find( "body" );

			// Support: IE
			this.storedCursor = body.css( "cursor" );
			body.css( "cursor", o.cursor );

			this.storedStylesheet =
				$( "<style>*{ cursor: " + o.cursor + " !important; }</style>" ).appendTo( body );
		}

		if ( o.opacity ) { // opacity option
			if ( this.helper.css( "opacity" ) ) {
				this._storedOpacity = this.helper.css( "opacity" );
			}
			this.helper.css( "opacity", o.opacity );
		}

		if ( o.zIndex ) { // zIndex option
			if ( this.helper.css( "zIndex" ) ) {
				this._storedZIndex = this.helper.css( "zIndex" );
			}
			this.helper.css( "zIndex", o.zIndex );
		}

		//Prepare scrolling
		if ( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				this.scrollParent[ 0 ].tagName !== "HTML" ) {
			this.overflowOffset = this.scrollParent.offset();
		}

		//Call callbacks
		this._trigger( "start", event, this._uiHash() );

		//Recache the helper size
		if ( !this._preserveHelperProportions ) {
			this._cacheHelperProportions();
		}

		//Post "activate" events to possible containers
		if ( !noActivation ) {
			for ( i = this.containers.length - 1; i >= 0; i-- ) {
				this.containers[ i ]._trigger( "activate", event, this._uiHash( this ) );
			}
		}

		//Prepare possible droppables
		if ( $.ui.ddmanager ) {
			$.ui.ddmanager.current = this;
		}

		if ( $.ui.ddmanager && !o.dropBehaviour ) {
			$.ui.ddmanager.prepareOffsets( this, event );
		}

		this.dragging = true;

		this._addClass( this.helper, "ui-sortable-helper" );

		// Execute the drag once - this causes the helper not to be visiblebefore getting its
		// correct position
		this._mouseDrag( event );
		return true;

	},

	_mouseDrag: function( event ) {
		var i, item, itemElement, intersection,
			o = this.options,
			scrolled = false;

		//Compute the helpers position
		this.position = this._generatePosition( event );
		this.positionAbs = this._convertPositionTo( "absolute" );

		if ( !this.lastPositionAbs ) {
			this.lastPositionAbs = this.positionAbs;
		}

		//Do scrolling
		if ( this.options.scroll ) {
			if ( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
					this.scrollParent[ 0 ].tagName !== "HTML" ) {

				if ( ( this.overflowOffset.top + this.scrollParent[ 0 ].offsetHeight ) -
						event.pageY < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollTop =
						scrolled = this.scrollParent[ 0 ].scrollTop + o.scrollSpeed;
				} else if ( event.pageY - this.overflowOffset.top < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollTop =
						scrolled = this.scrollParent[ 0 ].scrollTop - o.scrollSpeed;
				}

				if ( ( this.overflowOffset.left + this.scrollParent[ 0 ].offsetWidth ) -
						event.pageX < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollLeft = scrolled =
						this.scrollParent[ 0 ].scrollLeft + o.scrollSpeed;
				} else if ( event.pageX - this.overflowOffset.left < o.scrollSensitivity ) {
					this.scrollParent[ 0 ].scrollLeft = scrolled =
						this.scrollParent[ 0 ].scrollLeft - o.scrollSpeed;
				}

			} else {

				if ( event.pageY - this.document.scrollTop() < o.scrollSensitivity ) {
					scrolled = this.document.scrollTop( this.document.scrollTop() - o.scrollSpeed );
				} else if ( this.window.height() - ( event.pageY - this.document.scrollTop() ) <
						o.scrollSensitivity ) {
					scrolled = this.document.scrollTop( this.document.scrollTop() + o.scrollSpeed );
				}

				if ( event.pageX - this.document.scrollLeft() < o.scrollSensitivity ) {
					scrolled = this.document.scrollLeft(
						this.document.scrollLeft() - o.scrollSpeed
					);
				} else if ( this.window.width() - ( event.pageX - this.document.scrollLeft() ) <
						o.scrollSensitivity ) {
					scrolled = this.document.scrollLeft(
						this.document.scrollLeft() + o.scrollSpeed
					);
				}

			}

			if ( scrolled !== false && $.ui.ddmanager && !o.dropBehaviour ) {
				$.ui.ddmanager.prepareOffsets( this, event );
			}
		}

		//Regenerate the absolute position used for position checks
		this.positionAbs = this._convertPositionTo( "absolute" );

		//Set the helper position
		if ( !this.options.axis || this.options.axis !== "y" ) {
			this.helper[ 0 ].style.left = this.position.left + "px";
		}
		if ( !this.options.axis || this.options.axis !== "x" ) {
			this.helper[ 0 ].style.top = this.position.top + "px";
		}

		//Rearrange
		for ( i = this.items.length - 1; i >= 0; i-- ) {

			//Cache variables and intersection, continue if no intersection
			item = this.items[ i ];
			itemElement = item.item[ 0 ];
			intersection = this._intersectsWithPointer( item );
			if ( !intersection ) {
				continue;
			}

			// Only put the placeholder inside the current Container, skip all
			// items from other containers. This works because when moving
			// an item from one container to another the
			// currentContainer is switched before the placeholder is moved.
			//
			// Without this, moving items in "sub-sortables" can cause
			// the placeholder to jitter between the outer and inner container.
			if ( item.instance !== this.currentContainer ) {
				continue;
			}

			// Cannot intersect with itself
			// no useless actions that have been done before
			// no action if the item moved is the parent of the item checked
			if ( itemElement !== this.currentItem[ 0 ] &&
				this.placeholder[ intersection === 1 ? "next" : "prev" ]()[ 0 ] !== itemElement &&
				!$.contains( this.placeholder[ 0 ], itemElement ) &&
				( this.options.type === "semi-dynamic" ?
					!$.contains( this.element[ 0 ], itemElement ) :
					true
				)
			) {

				this.direction = intersection === 1 ? "down" : "up";

				if ( this.options.tolerance === "pointer" || this._intersectsWithSides( item ) ) {
					this._rearrange( event, item );
				} else {
					break;
				}

				this._trigger( "change", event, this._uiHash() );
				break;
			}
		}

		//Post events to containers
		this._contactContainers( event );

		//Interconnect with droppables
		if ( $.ui.ddmanager ) {
			$.ui.ddmanager.drag( this, event );
		}

		//Call callbacks
		this._trigger( "sort", event, this._uiHash() );

		this.lastPositionAbs = this.positionAbs;
		return false;

	},

	_mouseStop: function( event, noPropagation ) {

		if ( !event ) {
			return;
		}

		//If we are using droppables, inform the manager about the drop
		if ( $.ui.ddmanager && !this.options.dropBehaviour ) {
			$.ui.ddmanager.drop( this, event );
		}

		if ( this.options.revert ) {
			var that = this,
				cur = this.placeholder.offset(),
				axis = this.options.axis,
				animation = {};

			if ( !axis || axis === "x" ) {
				animation.left = cur.left - this.offset.parent.left - this.margins.left +
					( this.offsetParent[ 0 ] === this.document[ 0 ].body ?
						0 :
						this.offsetParent[ 0 ].scrollLeft
					);
			}
			if ( !axis || axis === "y" ) {
				animation.top = cur.top - this.offset.parent.top - this.margins.top +
					( this.offsetParent[ 0 ] === this.document[ 0 ].body ?
						0 :
						this.offsetParent[ 0 ].scrollTop
					);
			}
			this.reverting = true;
			$( this.helper ).animate(
				animation,
				parseInt( this.options.revert, 10 ) || 500,
				function() {
					that._clear( event );
				}
			);
		} else {
			this._clear( event, noPropagation );
		}

		return false;

	},

	cancel: function() {

		if ( this.dragging ) {

			this._mouseUp( new $.Event( "mouseup", { target: null } ) );

			if ( this.options.helper === "original" ) {
				this.currentItem.css( this._storedCSS );
				this._removeClass( this.currentItem, "ui-sortable-helper" );
			} else {
				this.currentItem.show();
			}

			//Post deactivating events to containers
			for ( var i = this.containers.length - 1; i >= 0; i-- ) {
				this.containers[ i ]._trigger( "deactivate", null, this._uiHash( this ) );
				if ( this.containers[ i ].containerCache.over ) {
					this.containers[ i ]._trigger( "out", null, this._uiHash( this ) );
					this.containers[ i ].containerCache.over = 0;
				}
			}

		}

		if ( this.placeholder ) {

			//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
			// it unbinds ALL events from the original node!
			if ( this.placeholder[ 0 ].parentNode ) {
				this.placeholder[ 0 ].parentNode.removeChild( this.placeholder[ 0 ] );
			}
			if ( this.options.helper !== "original" && this.helper &&
					this.helper[ 0 ].parentNode ) {
				this.helper.remove();
			}

			$.extend( this, {
				helper: null,
				dragging: false,
				reverting: false,
				_noFinalSort: null
			} );

			if ( this.domPosition.prev ) {
				$( this.domPosition.prev ).after( this.currentItem );
			} else {
				$( this.domPosition.parent ).prepend( this.currentItem );
			}
		}

		return this;

	},

	serialize: function( o ) {

		var items = this._getItemsAsjQuery( o && o.connected ),
			str = [];
		o = o || {};

		$( items ).each( function() {
			var res = ( $( o.item || this ).attr( o.attribute || "id" ) || "" )
				.match( o.expression || ( /(.+)[\-=_](.+)/ ) );
			if ( res ) {
				str.push(
					( o.key || res[ 1 ] + "[]" ) +
					"=" + ( o.key && o.expression ? res[ 1 ] : res[ 2 ] ) );
			}
		} );

		if ( !str.length && o.key ) {
			str.push( o.key + "=" );
		}

		return str.join( "&" );

	},

	toArray: function( o ) {

		var items = this._getItemsAsjQuery( o && o.connected ),
			ret = [];

		o = o || {};

		items.each( function() {
			ret.push( $( o.item || this ).attr( o.attribute || "id" ) || "" );
		} );
		return ret;

	},

	/* Be careful with the following core functions */
	_intersectsWith: function( item ) {

		var x1 = this.positionAbs.left,
			x2 = x1 + this.helperProportions.width,
			y1 = this.positionAbs.top,
			y2 = y1 + this.helperProportions.height,
			l = item.left,
			r = l + item.width,
			t = item.top,
			b = t + item.height,
			dyClick = this.offset.click.top,
			dxClick = this.offset.click.left,
			isOverElementHeight = ( this.options.axis === "x" ) || ( ( y1 + dyClick ) > t &&
				( y1 + dyClick ) < b ),
			isOverElementWidth = ( this.options.axis === "y" ) || ( ( x1 + dxClick ) > l &&
				( x1 + dxClick ) < r ),
			isOverElement = isOverElementHeight && isOverElementWidth;

		if ( this.options.tolerance === "pointer" ||
			this.options.forcePointerForContainers ||
			( this.options.tolerance !== "pointer" &&
				this.helperProportions[ this.floating ? "width" : "height" ] >
				item[ this.floating ? "width" : "height" ] )
		) {
			return isOverElement;
		} else {

			return ( l < x1 + ( this.helperProportions.width / 2 ) && // Right Half
				x2 - ( this.helperProportions.width / 2 ) < r && // Left Half
				t < y1 + ( this.helperProportions.height / 2 ) && // Bottom Half
				y2 - ( this.helperProportions.height / 2 ) < b ); // Top Half

		}
	},

	_intersectsWithPointer: function( item ) {
		var verticalDirection, horizontalDirection,
			isOverElementHeight = ( this.options.axis === "x" ) ||
				this._isOverAxis(
					this.positionAbs.top + this.offset.click.top, item.top, item.height ),
			isOverElementWidth = ( this.options.axis === "y" ) ||
				this._isOverAxis(
					this.positionAbs.left + this.offset.click.left, item.left, item.width ),
			isOverElement = isOverElementHeight && isOverElementWidth;

		if ( !isOverElement ) {
			return false;
		}

		verticalDirection = this._getDragVerticalDirection();
		horizontalDirection = this._getDragHorizontalDirection();

		return this.floating ?
			( ( horizontalDirection === "right" || verticalDirection === "down" ) ? 2 : 1 )
			: ( verticalDirection && ( verticalDirection === "down" ? 2 : 1 ) );

	},

	_intersectsWithSides: function( item ) {

		var isOverBottomHalf = this._isOverAxis( this.positionAbs.top +
				this.offset.click.top, item.top + ( item.height / 2 ), item.height ),
			isOverRightHalf = this._isOverAxis( this.positionAbs.left +
				this.offset.click.left, item.left + ( item.width / 2 ), item.width ),
			verticalDirection = this._getDragVerticalDirection(),
			horizontalDirection = this._getDragHorizontalDirection();

		if ( this.floating && horizontalDirection ) {
			return ( ( horizontalDirection === "right" && isOverRightHalf ) ||
				( horizontalDirection === "left" && !isOverRightHalf ) );
		} else {
			return verticalDirection && ( ( verticalDirection === "down" && isOverBottomHalf ) ||
				( verticalDirection === "up" && !isOverBottomHalf ) );
		}

	},

	_getDragVerticalDirection: function() {
		var delta = this.positionAbs.top - this.lastPositionAbs.top;
		return delta !== 0 && ( delta > 0 ? "down" : "up" );
	},

	_getDragHorizontalDirection: function() {
		var delta = this.positionAbs.left - this.lastPositionAbs.left;
		return delta !== 0 && ( delta > 0 ? "right" : "left" );
	},

	refresh: function( event ) {
		this._refreshItems( event );
		this._setHandleClassName();
		this.refreshPositions();
		return this;
	},

	_connectWith: function() {
		var options = this.options;
		return options.connectWith.constructor === String ?
			[ options.connectWith ] :
			options.connectWith;
	},

	_getItemsAsjQuery: function( connected ) {

		var i, j, cur, inst,
			items = [],
			queries = [],
			connectWith = this._connectWith();

		if ( connectWith && connected ) {
			for ( i = connectWith.length - 1; i >= 0; i-- ) {
				cur = $( connectWith[ i ], this.document[ 0 ] );
				for ( j = cur.length - 1; j >= 0; j-- ) {
					inst = $.data( cur[ j ], this.widgetFullName );
					if ( inst && inst !== this && !inst.options.disabled ) {
						queries.push( [ $.isFunction( inst.options.items ) ?
							inst.options.items.call( inst.element ) :
							$( inst.options.items, inst.element )
								.not( ".ui-sortable-helper" )
								.not( ".ui-sortable-placeholder" ), inst ] );
					}
				}
			}
		}

		queries.push( [ $.isFunction( this.options.items ) ?
			this.options.items
				.call( this.element, null, { options: this.options, item: this.currentItem } ) :
			$( this.options.items, this.element )
				.not( ".ui-sortable-helper" )
				.not( ".ui-sortable-placeholder" ), this ] );

		function addItems() {
			items.push( this );
		}
		for ( i = queries.length - 1; i >= 0; i-- ) {
			queries[ i ][ 0 ].each( addItems );
		}

		return $( items );

	},

	_removeCurrentsFromItems: function() {

		var list = this.currentItem.find( ":data(" + this.widgetName + "-item)" );

		this.items = $.grep( this.items, function( item ) {
			for ( var j = 0; j < list.length; j++ ) {
				if ( list[ j ] === item.item[ 0 ] ) {
					return false;
				}
			}
			return true;
		} );

	},

	_refreshItems: function( event ) {

		this.items = [];
		this.containers = [ this ];

		var i, j, cur, inst, targetData, _queries, item, queriesLength,
			items = this.items,
			queries = [ [ $.isFunction( this.options.items ) ?
				this.options.items.call( this.element[ 0 ], event, { item: this.currentItem } ) :
				$( this.options.items, this.element ), this ] ],
			connectWith = this._connectWith();

		//Shouldn't be run the first time through due to massive slow-down
		if ( connectWith && this.ready ) {
			for ( i = connectWith.length - 1; i >= 0; i-- ) {
				cur = $( connectWith[ i ], this.document[ 0 ] );
				for ( j = cur.length - 1; j >= 0; j-- ) {
					inst = $.data( cur[ j ], this.widgetFullName );
					if ( inst && inst !== this && !inst.options.disabled ) {
						queries.push( [ $.isFunction( inst.options.items ) ?
							inst.options.items
								.call( inst.element[ 0 ], event, { item: this.currentItem } ) :
							$( inst.options.items, inst.element ), inst ] );
						this.containers.push( inst );
					}
				}
			}
		}

		for ( i = queries.length - 1; i >= 0; i-- ) {
			targetData = queries[ i ][ 1 ];
			_queries = queries[ i ][ 0 ];

			for ( j = 0, queriesLength = _queries.length; j < queriesLength; j++ ) {
				item = $( _queries[ j ] );

				// Data for target checking (mouse manager)
				item.data( this.widgetName + "-item", targetData );

				items.push( {
					item: item,
					instance: targetData,
					width: 0, height: 0,
					left: 0, top: 0
				} );
			}
		}

	},

	refreshPositions: function( fast ) {

		// Determine whether items are being displayed horizontally
		this.floating = this.items.length ?
			this.options.axis === "x" || this._isFloating( this.items[ 0 ].item ) :
			false;

		//This has to be redone because due to the item being moved out/into the offsetParent,
		// the offsetParent's position will change
		if ( this.offsetParent && this.helper ) {
			this.offset.parent = this._getParentOffset();
		}

		var i, item, t, p;

		for ( i = this.items.length - 1; i >= 0; i-- ) {
			item = this.items[ i ];

			//We ignore calculating positions of all connected containers when we're not over them
			if ( item.instance !== this.currentContainer && this.currentContainer &&
					item.item[ 0 ] !== this.currentItem[ 0 ] ) {
				continue;
			}

			t = this.options.toleranceElement ?
				$( this.options.toleranceElement, item.item ) :
				item.item;

			if ( !fast ) {
				item.width = t.outerWidth();
				item.height = t.outerHeight();
			}

			p = t.offset();
			item.left = p.left;
			item.top = p.top;
		}

		if ( this.options.custom && this.options.custom.refreshContainers ) {
			this.options.custom.refreshContainers.call( this );
		} else {
			for ( i = this.containers.length - 1; i >= 0; i-- ) {
				p = this.containers[ i ].element.offset();
				this.containers[ i ].containerCache.left = p.left;
				this.containers[ i ].containerCache.top = p.top;
				this.containers[ i ].containerCache.width =
					this.containers[ i ].element.outerWidth();
				this.containers[ i ].containerCache.height =
					this.containers[ i ].element.outerHeight();
			}
		}

		return this;
	},

	_createPlaceholder: function( that ) {
		that = that || this;
		var className,
			o = that.options;

		if ( !o.placeholder || o.placeholder.constructor === String ) {
			className = o.placeholder;
			o.placeholder = {
				element: function() {

					var nodeName = that.currentItem[ 0 ].nodeName.toLowerCase(),
						element = $( "<" + nodeName + ">", that.document[ 0 ] );

						that._addClass( element, "ui-sortable-placeholder",
								className || that.currentItem[ 0 ].className )
							._removeClass( element, "ui-sortable-helper" );

					if ( nodeName === "tbody" ) {
						that._createTrPlaceholder(
							that.currentItem.find( "tr" ).eq( 0 ),
							$( "<tr>", that.document[ 0 ] ).appendTo( element )
						);
					} else if ( nodeName === "tr" ) {
						that._createTrPlaceholder( that.currentItem, element );
					} else if ( nodeName === "img" ) {
						element.attr( "src", that.currentItem.attr( "src" ) );
					}

					if ( !className ) {
						element.css( "visibility", "hidden" );
					}

					return element;
				},
				update: function( container, p ) {

					// 1. If a className is set as 'placeholder option, we don't force sizes -
					// the class is responsible for that
					// 2. The option 'forcePlaceholderSize can be enabled to force it even if a
					// class name is specified
					if ( className && !o.forcePlaceholderSize ) {
						return;
					}

					//If the element doesn't have a actual height by itself (without styles coming
					// from a stylesheet), it receives the inline height from the dragged item
					if ( !p.height() ) {
						p.height(
							that.currentItem.innerHeight() -
							parseInt( that.currentItem.css( "paddingTop" ) || 0, 10 ) -
							parseInt( that.currentItem.css( "paddingBottom" ) || 0, 10 ) );
					}
					if ( !p.width() ) {
						p.width(
							that.currentItem.innerWidth() -
							parseInt( that.currentItem.css( "paddingLeft" ) || 0, 10 ) -
							parseInt( that.currentItem.css( "paddingRight" ) || 0, 10 ) );
					}
				}
			};
		}

		//Create the placeholder
		that.placeholder = $( o.placeholder.element.call( that.element, that.currentItem ) );

		//Append it after the actual current item
		that.currentItem.after( that.placeholder );

		//Update the size of the placeholder (TODO: Logic to fuzzy, see line 316/317)
		o.placeholder.update( that, that.placeholder );

	},

	_createTrPlaceholder: function( sourceTr, targetTr ) {
		var that = this;

		sourceTr.children().each( function() {
			$( "<td>&#160;</td>", that.document[ 0 ] )
				.attr( "colspan", $( this ).attr( "colspan" ) || 1 )
				.appendTo( targetTr );
		} );
	},

	_contactContainers: function( event ) {
		var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, cur, nearBottom,
			floating, axis,
			innermostContainer = null,
			innermostIndex = null;

		// Get innermost container that intersects with item
		for ( i = this.containers.length - 1; i >= 0; i-- ) {

			// Never consider a container that's located within the item itself
			if ( $.contains( this.currentItem[ 0 ], this.containers[ i ].element[ 0 ] ) ) {
				continue;
			}

			if ( this._intersectsWith( this.containers[ i ].containerCache ) ) {

				// If we've already found a container and it's more "inner" than this, then continue
				if ( innermostContainer &&
						$.contains(
							this.containers[ i ].element[ 0 ],
							innermostContainer.element[ 0 ] ) ) {
					continue;
				}

				innermostContainer = this.containers[ i ];
				innermostIndex = i;

			} else {

				// container doesn't intersect. trigger "out" event if necessary
				if ( this.containers[ i ].containerCache.over ) {
					this.containers[ i ]._trigger( "out", event, this._uiHash( this ) );
					this.containers[ i ].containerCache.over = 0;
				}
			}

		}

		// If no intersecting containers found, return
		if ( !innermostContainer ) {
			return;
		}

		// Move the item into the container if it's not there already
		if ( this.containers.length === 1 ) {
			if ( !this.containers[ innermostIndex ].containerCache.over ) {
				this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash( this ) );
				this.containers[ innermostIndex ].containerCache.over = 1;
			}
		} else {

			// When entering a new container, we will find the item with the least distance and
			// append our item near it
			dist = 10000;
			itemWithLeastDistance = null;
			floating = innermostContainer.floating || this._isFloating( this.currentItem );
			posProperty = floating ? "left" : "top";
			sizeProperty = floating ? "width" : "height";
			axis = floating ? "pageX" : "pageY";

			for ( j = this.items.length - 1; j >= 0; j-- ) {
				if ( !$.contains(
						this.containers[ innermostIndex ].element[ 0 ], this.items[ j ].item[ 0 ] )
				) {
					continue;
				}
				if ( this.items[ j ].item[ 0 ] === this.currentItem[ 0 ] ) {
					continue;
				}

				cur = this.items[ j ].item.offset()[ posProperty ];
				nearBottom = false;
				if ( event[ axis ] - cur > this.items[ j ][ sizeProperty ] / 2 ) {
					nearBottom = true;
				}

				if ( Math.abs( event[ axis ] - cur ) < dist ) {
					dist = Math.abs( event[ axis ] - cur );
					itemWithLeastDistance = this.items[ j ];
					this.direction = nearBottom ? "up" : "down";
				}
			}

			//Check if dropOnEmpty is enabled
			if ( !itemWithLeastDistance && !this.options.dropOnEmpty ) {
				return;
			}

			if ( this.currentContainer === this.containers[ innermostIndex ] ) {
				if ( !this.currentContainer.containerCache.over ) {
					this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash() );
					this.currentContainer.containerCache.over = 1;
				}
				return;
			}

			itemWithLeastDistance ?
				this._rearrange( event, itemWithLeastDistance, null, true ) :
				this._rearrange( event, null, this.containers[ innermostIndex ].element, true );
			this._trigger( "change", event, this._uiHash() );
			this.containers[ innermostIndex ]._trigger( "change", event, this._uiHash( this ) );
			this.currentContainer = this.containers[ innermostIndex ];

			//Update the placeholder
			this.options.placeholder.update( this.currentContainer, this.placeholder );

			this.containers[ innermostIndex ]._trigger( "over", event, this._uiHash( this ) );
			this.containers[ innermostIndex ].containerCache.over = 1;
		}

	},

	_createHelper: function( event ) {

		var o = this.options,
			helper = $.isFunction( o.helper ) ?
				$( o.helper.apply( this.element[ 0 ], [ event, this.currentItem ] ) ) :
				( o.helper === "clone" ? this.currentItem.clone() : this.currentItem );

		//Add the helper to the DOM if that didn't happen already
		if ( !helper.parents( "body" ).length ) {
			$( o.appendTo !== "parent" ?
				o.appendTo :
				this.currentItem[ 0 ].parentNode )[ 0 ].appendChild( helper[ 0 ] );
		}

		if ( helper[ 0 ] === this.currentItem[ 0 ] ) {
			this._storedCSS = {
				width: this.currentItem[ 0 ].style.width,
				height: this.currentItem[ 0 ].style.height,
				position: this.currentItem.css( "position" ),
				top: this.currentItem.css( "top" ),
				left: this.currentItem.css( "left" )
			};
		}

		if ( !helper[ 0 ].style.width || o.forceHelperSize ) {
			helper.width( this.currentItem.width() );
		}
		if ( !helper[ 0 ].style.height || o.forceHelperSize ) {
			helper.height( this.currentItem.height() );
		}

		return helper;

	},

	_adjustOffsetFromHelper: function( obj ) {
		if ( typeof obj === "string" ) {
			obj = obj.split( " " );
		}
		if ( $.isArray( obj ) ) {
			obj = { left: +obj[ 0 ], top: +obj[ 1 ] || 0 };
		}
		if ( "left" in obj ) {
			this.offset.click.left = obj.left + this.margins.left;
		}
		if ( "right" in obj ) {
			this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
		}
		if ( "top" in obj ) {
			this.offset.click.top = obj.top + this.margins.top;
		}
		if ( "bottom" in obj ) {
			this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
		}
	},

	_getParentOffset: function() {

		//Get the offsetParent and cache its position
		this.offsetParent = this.helper.offsetParent();
		var po = this.offsetParent.offset();

		// This is a special case where we need to modify a offset calculated on start, since the
		// following happened:
		// 1. The position of the helper is absolute, so it's position is calculated based on the
		// next positioned parent
		// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't
		// the document, which means that the scroll is included in the initial calculation of the
		// offset of the parent, and never recalculated upon drag
		if ( this.cssPosition === "absolute" && this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) {
			po.left += this.scrollParent.scrollLeft();
			po.top += this.scrollParent.scrollTop();
		}

		// This needs to be actually done for all browsers, since pageX/pageY includes this
		// information with an ugly IE fix
		if ( this.offsetParent[ 0 ] === this.document[ 0 ].body ||
				( this.offsetParent[ 0 ].tagName &&
				this.offsetParent[ 0 ].tagName.toLowerCase() === "html" && $.ui.ie ) ) {
			po = { top: 0, left: 0 };
		}

		return {
			top: po.top + ( parseInt( this.offsetParent.css( "borderTopWidth" ), 10 ) || 0 ),
			left: po.left + ( parseInt( this.offsetParent.css( "borderLeftWidth" ), 10 ) || 0 )
		};

	},

	_getRelativeOffset: function() {

		if ( this.cssPosition === "relative" ) {
			var p = this.currentItem.position();
			return {
				top: p.top - ( parseInt( this.helper.css( "top" ), 10 ) || 0 ) +
					this.scrollParent.scrollTop(),
				left: p.left - ( parseInt( this.helper.css( "left" ), 10 ) || 0 ) +
					this.scrollParent.scrollLeft()
			};
		} else {
			return { top: 0, left: 0 };
		}

	},

	_cacheMargins: function() {
		this.margins = {
			left: ( parseInt( this.currentItem.css( "marginLeft" ), 10 ) || 0 ),
			top: ( parseInt( this.currentItem.css( "marginTop" ), 10 ) || 0 )
		};
	},

	_cacheHelperProportions: function() {
		this.helperProportions = {
			width: this.helper.outerWidth(),
			height: this.helper.outerHeight()
		};
	},

	_setContainment: function() {

		var ce, co, over,
			o = this.options;
		if ( o.containment === "parent" ) {
			o.containment = this.helper[ 0 ].parentNode;
		}
		if ( o.containment === "document" || o.containment === "window" ) {
			this.containment = [
				0 - this.offset.relative.left - this.offset.parent.left,
				0 - this.offset.relative.top - this.offset.parent.top,
				o.containment === "document" ?
					this.document.width() :
					this.window.width() - this.helperProportions.width - this.margins.left,
				( o.containment === "document" ?
					( this.document.height() || document.body.parentNode.scrollHeight ) :
					this.window.height() || this.document[ 0 ].body.parentNode.scrollHeight
				) - this.helperProportions.height - this.margins.top
			];
		}

		if ( !( /^(document|window|parent)$/ ).test( o.containment ) ) {
			ce = $( o.containment )[ 0 ];
			co = $( o.containment ).offset();
			over = ( $( ce ).css( "overflow" ) !== "hidden" );

			this.containment = [
				co.left + ( parseInt( $( ce ).css( "borderLeftWidth" ), 10 ) || 0 ) +
					( parseInt( $( ce ).css( "paddingLeft" ), 10 ) || 0 ) - this.margins.left,
				co.top + ( parseInt( $( ce ).css( "borderTopWidth" ), 10 ) || 0 ) +
					( parseInt( $( ce ).css( "paddingTop" ), 10 ) || 0 ) - this.margins.top,
				co.left + ( over ? Math.max( ce.scrollWidth, ce.offsetWidth ) : ce.offsetWidth ) -
					( parseInt( $( ce ).css( "borderLeftWidth" ), 10 ) || 0 ) -
					( parseInt( $( ce ).css( "paddingRight" ), 10 ) || 0 ) -
					this.helperProportions.width - this.margins.left,
				co.top + ( over ? Math.max( ce.scrollHeight, ce.offsetHeight ) : ce.offsetHeight ) -
					( parseInt( $( ce ).css( "borderTopWidth" ), 10 ) || 0 ) -
					( parseInt( $( ce ).css( "paddingBottom" ), 10 ) || 0 ) -
					this.helperProportions.height - this.margins.top
			];
		}

	},

	_convertPositionTo: function( d, pos ) {

		if ( !pos ) {
			pos = this.position;
		}
		var mod = d === "absolute" ? 1 : -1,
			scroll = this.cssPosition === "absolute" &&
				!( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) ?
					this.offsetParent :
					this.scrollParent,
			scrollIsRootNode = ( /(html|body)/i ).test( scroll[ 0 ].tagName );

		return {
			top: (

				// The absolute mouse position
				pos.top	+

				// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.relative.top * mod +

				// The offsetParent's offset without borders (offset + border)
				this.offset.parent.top * mod -
				( ( this.cssPosition === "fixed" ?
					-this.scrollParent.scrollTop() :
					( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod )
			),
			left: (

				// The absolute mouse position
				pos.left +

				// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.relative.left * mod +

				// The offsetParent's offset without borders (offset + border)
				this.offset.parent.left * mod	-
				( ( this.cssPosition === "fixed" ?
					-this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 :
					scroll.scrollLeft() ) * mod )
			)
		};

	},

	_generatePosition: function( event ) {

		var top, left,
			o = this.options,
			pageX = event.pageX,
			pageY = event.pageY,
			scroll = this.cssPosition === "absolute" &&
				!( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				$.contains( this.scrollParent[ 0 ], this.offsetParent[ 0 ] ) ) ?
					this.offsetParent :
					this.scrollParent,
				scrollIsRootNode = ( /(html|body)/i ).test( scroll[ 0 ].tagName );

		// This is another very weird special case that only happens for relative elements:
		// 1. If the css position is relative
		// 2. and the scroll parent is the document or similar to the offset parent
		// we have to refresh the relative offset during the scroll so there are no jumps
		if ( this.cssPosition === "relative" && !( this.scrollParent[ 0 ] !== this.document[ 0 ] &&
				this.scrollParent[ 0 ] !== this.offsetParent[ 0 ] ) ) {
			this.offset.relative = this._getRelativeOffset();
		}

		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

		if ( this.originalPosition ) { //If we are not dragging yet, we won't check for options

			if ( this.containment ) {
				if ( event.pageX - this.offset.click.left < this.containment[ 0 ] ) {
					pageX = this.containment[ 0 ] + this.offset.click.left;
				}
				if ( event.pageY - this.offset.click.top < this.containment[ 1 ] ) {
					pageY = this.containment[ 1 ] + this.offset.click.top;
				}
				if ( event.pageX - this.offset.click.left > this.containment[ 2 ] ) {
					pageX = this.containment[ 2 ] + this.offset.click.left;
				}
				if ( event.pageY - this.offset.click.top > this.containment[ 3 ] ) {
					pageY = this.containment[ 3 ] + this.offset.click.top;
				}
			}

			if ( o.grid ) {
				top = this.originalPageY + Math.round( ( pageY - this.originalPageY ) /
					o.grid[ 1 ] ) * o.grid[ 1 ];
				pageY = this.containment ?
					( ( top - this.offset.click.top >= this.containment[ 1 ] &&
						top - this.offset.click.top <= this.containment[ 3 ] ) ?
							top :
							( ( top - this.offset.click.top >= this.containment[ 1 ] ) ?
								top - o.grid[ 1 ] : top + o.grid[ 1 ] ) ) :
								top;

				left = this.originalPageX + Math.round( ( pageX - this.originalPageX ) /
					o.grid[ 0 ] ) * o.grid[ 0 ];
				pageX = this.containment ?
					( ( left - this.offset.click.left >= this.containment[ 0 ] &&
						left - this.offset.click.left <= this.containment[ 2 ] ) ?
							left :
							( ( left - this.offset.click.left >= this.containment[ 0 ] ) ?
								left - o.grid[ 0 ] : left + o.grid[ 0 ] ) ) :
								left;
			}

		}

		return {
			top: (

				// The absolute mouse position
				pageY -

				// Click offset (relative to the element)
				this.offset.click.top -

				// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.relative.top -

				// The offsetParent's offset without borders (offset + border)
				this.offset.parent.top +
				( ( this.cssPosition === "fixed" ?
					-this.scrollParent.scrollTop() :
					( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) )
			),
			left: (

				// The absolute mouse position
				pageX -

				// Click offset (relative to the element)
				this.offset.click.left -

				// Only for relative positioned nodes: Relative offset from element to offset parent
				this.offset.relative.left -

				// The offsetParent's offset without borders (offset + border)
				this.offset.parent.left +
				( ( this.cssPosition === "fixed" ?
					-this.scrollParent.scrollLeft() :
					scrollIsRootNode ? 0 : scroll.scrollLeft() ) )
			)
		};

	},

	_rearrange: function( event, i, a, hardRefresh ) {

		a ? a[ 0 ].appendChild( this.placeholder[ 0 ] ) :
			i.item[ 0 ].parentNode.insertBefore( this.placeholder[ 0 ],
				( this.direction === "down" ? i.item[ 0 ] : i.item[ 0 ].nextSibling ) );

		//Various things done here to improve the performance:
		// 1. we create a setTimeout, that calls refreshPositions
		// 2. on the instance, we have a counter variable, that get's higher after every append
		// 3. on the local scope, we copy the counter variable, and check in the timeout,
		// if it's still the same
		// 4. this lets only the last addition to the timeout stack through
		this.counter = this.counter ? ++this.counter : 1;
		var counter = this.counter;

		this._delay( function() {
			if ( counter === this.counter ) {

				//Precompute after each DOM insertion, NOT on mousemove
				this.refreshPositions( !hardRefresh );
			}
		} );

	},

	_clear: function( event, noPropagation ) {

		this.reverting = false;

		// We delay all events that have to be triggered to after the point where the placeholder
		// has been removed and everything else normalized again
		var i,
			delayedTriggers = [];

		// We first have to update the dom position of the actual currentItem
		// Note: don't do it if the current item is already removed (by a user), or it gets
		// reappended (see #4088)
		if ( !this._noFinalSort && this.currentItem.parent().length ) {
			this.placeholder.before( this.currentItem );
		}
		this._noFinalSort = null;

		if ( this.helper[ 0 ] === this.currentItem[ 0 ] ) {
			for ( i in this._storedCSS ) {
				if ( this._storedCSS[ i ] === "auto" || this._storedCSS[ i ] === "static" ) {
					this._storedCSS[ i ] = "";
				}
			}
			this.currentItem.css( this._storedCSS );
			this._removeClass( this.currentItem, "ui-sortable-helper" );
		} else {
			this.currentItem.show();
		}

		if ( this.fromOutside && !noPropagation ) {
			delayedTriggers.push( function( event ) {
				this._trigger( "receive", event, this._uiHash( this.fromOutside ) );
			} );
		}
		if ( ( this.fromOutside ||
				this.domPosition.prev !==
				this.currentItem.prev().not( ".ui-sortable-helper" )[ 0 ] ||
				this.domPosition.parent !== this.currentItem.parent()[ 0 ] ) && !noPropagation ) {

			// Trigger update callback if the DOM position has changed
			delayedTriggers.push( function( event ) {
				this._trigger( "update", event, this._uiHash() );
			} );
		}

		// Check if the items Container has Changed and trigger appropriate
		// events.
		if ( this !== this.currentContainer ) {
			if ( !noPropagation ) {
				delayedTriggers.push( function( event ) {
					this._trigger( "remove", event, this._uiHash() );
				} );
				delayedTriggers.push( ( function( c ) {
					return function( event ) {
						c._trigger( "receive", event, this._uiHash( this ) );
					};
				} ).call( this, this.currentContainer ) );
				delayedTriggers.push( ( function( c ) {
					return function( event ) {
						c._trigger( "update", event, this._uiHash( this ) );
					};
				} ).call( this, this.currentContainer ) );
			}
		}

		//Post events to containers
		function delayEvent( type, instance, container ) {
			return function( event ) {
				container._trigger( type, event, instance._uiHash( instance ) );
			};
		}
		for ( i = this.containers.length - 1; i >= 0; i-- ) {
			if ( !noPropagation ) {
				delayedTriggers.push( delayEvent( "deactivate", this, this.containers[ i ] ) );
			}
			if ( this.containers[ i ].containerCache.over ) {
				delayedTriggers.push( delayEvent( "out", this, this.containers[ i ] ) );
				this.containers[ i ].containerCache.over = 0;
			}
		}

		//Do what was originally in plugins
		if ( this.storedCursor ) {
			this.document.find( "body" ).css( "cursor", this.storedCursor );
			this.storedStylesheet.remove();
		}
		if ( this._storedOpacity ) {
			this.helper.css( "opacity", this._storedOpacity );
		}
		if ( this._storedZIndex ) {
			this.helper.css( "zIndex", this._storedZIndex === "auto" ? "" : this._storedZIndex );
		}

		this.dragging = false;

		if ( !noPropagation ) {
			this._trigger( "beforeStop", event, this._uiHash() );
		}

		//$(this.placeholder[0]).remove(); would have been the jQuery way - unfortunately,
		// it unbinds ALL events from the original node!
		this.placeholder[ 0 ].parentNode.removeChild( this.placeholder[ 0 ] );

		if ( !this.cancelHelperRemoval ) {
			if ( this.helper[ 0 ] !== this.currentItem[ 0 ] ) {
				this.helper.remove();
			}
			this.helper = null;
		}

		if ( !noPropagation ) {
			for ( i = 0; i < delayedTriggers.length; i++ ) {

				// Trigger all delayed events
				delayedTriggers[ i ].call( this, event );
			}
			this._trigger( "stop", event, this._uiHash() );
		}

		this.fromOutside = false;
		return !this.cancelHelperRemoval;

	},

	_trigger: function() {
		if ( $.Widget.prototype._trigger.apply( this, arguments ) === false ) {
			this.cancel();
		}
	},

	_uiHash: function( _inst ) {
		var inst = _inst || this;
		return {
			helper: inst.helper,
			placeholder: inst.placeholder || $( [] ),
			position: inst.position,
			originalPosition: inst.originalPosition,
			offset: inst.positionAbs,
			item: inst.currentItem,
			sender: _inst ? _inst.element : null
		};
	}

} );

} ) );


// Extend datatables API with searchable options
// (http://stackoverflow.com/questions/39912395/datatables-dynamically-set-columns-searchable)
$.fn.dataTable.Api.register('isColumnSearchable()', function(colSelector) {
  var idx = this.column(colSelector).index();
  return this.settings()[0].aoColumns[idx].bSearchable;
});
$.fn.dataTable.Api.register('setColumnSearchable()', function(colSelector, value) {
  if (value !== this.isColumnSearchable(colSelector)) {
    var idx = this.column(colSelector).index();
    this.settings()[0].aoColumns[idx].bSearchable = value;
    if (value === true) {
      this.rows().invalidate();
    }
  }
  return value;
});

var rowsSelected = [];

// Tells whether we're currently viewing or editing table
var currentMode = 'viewMode';

// Tells what action will execute by pressing on save button (update/create)
var saveAction = 'update';
var selectedSample;

// Helps saving correct table state
var myData;
var loadFirstTime = true;

var table;
var originalHeader;

var view_assigned;

function dataTableInit() {
  // Make a copy of original samples table header
  originalHeader = $('#samples thead').children().clone();
  view_assigned = 'assigned';
  table = $('#samples').DataTable({
    order: [[2, 'desc']],
    dom: "R<'row'<'col-sm-9-custom toolbar'l><'col-sm-3-custom'f>>tpi",
    stateSave: true,
    processing: true,
    serverSide: true,
    sScrollX: '100%',
    sScrollXInner: '100%',
    scrollY: '64vh',
    scrollCollapse: true,
    colReorder: {
      fixedColumnsLeft: 2,
      realtime: false
    },
    destroy: true,
    ajax: {
      url: $('#samples').data('source'),
      data: function ( d ) {
          d.assigned = view_assigned;
      },
      global: false,
      type: 'POST'
    },
    columnDefs: [{
      targets: 0,
      searchable: false,
      orderable: false,
      className: 'dt-body-center',
      sWidth: '1%',
      render: function() {
        return "<input type='checkbox'>";
      }
    }, {
      targets: 1,
      searchable: false,
      orderable: true,
      sWidth: '1%'
    }, {
      targets: 2,
      render: function(data, type, row) {
        return "<a href='" + row.sampleInfoUrl + "'" +
               "class='sample-info-link'>" + data + '</a>';
      }
    }],
    rowCallback: function(row, data) {
      // Get row ID
      var rowId = data.DT_RowId;

      // If row ID is in the list of selected row IDs
      if ($.inArray(rowId, rowsSelected) !== -1) {
        $(row).find('input[type="checkbox"]').prop('checked', true);

        $(row).addClass('selected');
      }
    },
    columns: (function() {
      var numOfColumns = $('#samples').data('num-columns');
      var columns = [];

      for (var i = 0; i < numOfColumns; i++) {
        var visible = (i <= 6);
        columns.push({
          data: String(i),
          defaultContent: '',
          visible: visible,
          searchable: visible
        });
      }
      return columns;
    })(),
    fnDrawCallback: function() {
      animateSpinner(this, false);
      changeToViewMode();
      updateButtons();
      // Show number of selected samples info
      $('#samples_info').append('<span id="selected_info"></span>');
      $('#selected_info').html(' ('+rowsSelected.length+' entries selected)');
    },
    preDrawCallback: function() {
      rowsSelected = [];
      animateSpinner(this);
      $('.sample-info-link').off('click');
    },
    stateLoadCallback: function(settings) {
      // Send an Ajax request to the server to get the data. Note that
      // this is a synchronous request since the data is expected back from the
      // function
      var team = $('#samples').attr('data-team-id');
      var user = $('#samples').attr('data-user-id');

      $.ajax({
        url: '/state_load/' + team + '/' + user,
        data: {team: team},
        async: false,
        dataType: 'json',
        type: 'POST',
        success: function(json) {
          myData = json.state;
        }
      });
      return myData;
    },
    stateSaveCallback: function(settings, data) {
      // Send an Ajax request to the server with the state object
      var team = $('#samples').attr('data-team-id');
      var user = $('#samples').attr('data-user-id');
      // Save correct data
      if (loadFirstTime == true) {
        data = myData;
      }

      $.ajax({
        url: '/state_save/' + team + '/' + user,
        data: {team: team, state: data},
        dataType: 'json',
        type: 'POST'
      });
      loadFirstTime = false;
    },
    fnInitComplete: function(oSettings, json) {
      // Reload correct column order and visibility (if you refresh page)
      for (var i = 0; i < table.columns()[0].length; i++) {
        var visibility = false;
        if (myData.columns[i]) {
          visibility = myData.columns[i].visible;
        }
        if (typeof (visibility) === 'string') {
          visibility = (visibility === 'true');
        }
        table.column(i).visible(visibility);
        table.setColumnSearchable(i, visibility);
      }
      oSettings._colReorder.fnOrder(myData.ColReorder);
      table.on('mousedown', function() {
        $('#samples-columns-dropdown').removeClass('open');
      });
      initHeaderTooltip();
    }
  });

  // Append button to inner toolbar in table
  $('div.toolbarButtons').appendTo('div.toolbar');
  $('div.toolbarButtons').show();

  $('.delete_samples_submit').click(function() {
      animateLoading();
  });

  $('#assignSamples, #unassignSamples').click(function() {
      animateLoading();
  });

  // Handle click on table cells with checkboxes
  $('#samples').on('click', 'tbody td, thead th:first-child', function(e) {
    if (!$(e.target).is('.sample-info-link')) {
      // Skip if clicking on samples info link
      $(this).parent().find('input[type="checkbox"]').trigger('click');
    }
  });

  // Handle clicks on checkbox
  $('#samples tbody').on('click', "input[type='checkbox']", function(e) {
    if (currentMode !== 'viewMode') {
      return false;
    }
    // Get row ID
    var $row = $(this).closest('tr');
    var data = table.row($row).data();
    var rowId = data.DT_RowId;

    // Determine whether row ID is in the list of selected row IDs
    var index = $.inArray(rowId, rowsSelected);

    // If checkbox is checked and row ID is not in list of selected row IDs
    if (this.checked && index === -1) {
      rowsSelected.push(rowId);
    // Otherwise, if checkbox is not checked and row ID is in list of selected row IDs
    } else if (!this.checked && index !== -1) {
      rowsSelected.splice(index, 1);
    }

    if (this.checked) {
      $row.addClass('selected');
    } else {
      $row.removeClass('selected');
    }

    updateDataTableSelectAllCtrl(table);

    e.stopPropagation();

    updateButtons();

    // Update number of selected samples info
    $('#selected_info').html(' ('+ rowsSelected.length +' entries selected)');
  });

  // Handle click on "Select all" control
  $('.dataTables_scrollHead input[name="select_all"]').on('click', function(e) {
    if (this.checked) {
      $('#samples tbody input[type="checkbox"]:not(:checked)').trigger('click');
    } else {
      $('#samples tbody input[type="checkbox"]:checked').trigger('click');
    }

    // Prevent click event from propagating to parent
    e.stopPropagation();
  });

  // Handle table draw event
  table.on('draw', function() {
    updateDataTableSelectAllCtrl(table);
    sampleInfoListener();

    // Prevent sample row toggling when selecting user smart annotation link
    SmartAnnotation.preventPropagation('.atwho-user-popover');
  });

  table.on('column-reorder', function() {
    sampleInfoListener();
  });

  return table;
}

table = dataTableInit();

// Timeout for table header scrolling
setTimeout(function () {
  table.columns.adjust();
}, 10);


// Enables noSearchHidden plugin
$.fn.dataTable.defaults.noSearchHidden = true;

// Updates "Select all" control in a data table
function updateDataTableSelectAllCtrl(table) {
    var $table = table.table().node();
    var $header = table.table().header();
    var $chkbox_all = $('tbody input[type="checkbox"]', $table);
    var $chkbox_checked = $('tbody input[type="checkbox"]:checked', $table);
    var chkbox_select_all = $('input[name="select_all"]', $header).get(0);

    // If none of the checkboxes are checked
    if($chkbox_checked.length === 0){
        chkbox_select_all.checked = false;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = false;
        }

        // If all of the checkboxes are checked
    } else if ($chkbox_checked.length === $chkbox_all.length){
        chkbox_select_all.checked = true;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = false;
        }

        // If some of the checkboxes are checked
    } else {
        chkbox_select_all.checked = true;
        if('indeterminate' in chkbox_select_all){
            chkbox_select_all.indeterminate = true;
        }
    }
}

// Append selected samples to form
$("form#form-samples").submit(function(e){
    var form = this;

    if (currentMode == "viewMode")
        appendSamplesIdToForm(form);
});

// Append selected samples and headers form
$("form#form-export").submit(function(e){
    var form = this;

    if (currentMode == "viewMode") {
        // Remove all hidden fields
        $("#form-export").find("input[name=sample_ids\\[\\]]").remove();
        $("#form-export").find("input[name=header_ids\\[\\]]").remove();

        // Append samples
        appendSamplesIdToForm(form);

        // Append visible column information
        $("table#samples thead tr").children("th").each(function(i) {
            var th = $(this);
            var val;

            if ($(th).attr("id") == "sample-name")
                val = -1;
            else if ($(th).attr("id") == "sample-type")
                val = -2;
            else if ($(th).attr("id") == "sample-group")
                val = -3;
            else if ($(th).attr("id") == "added-by")
                val = -4;
            else if ($(th).attr("id") == "added-on")
                val = -5;
            else if ($(th).hasClass("custom-field"))
                val = th.attr("id");

            if (val)
                $(form).append(
                    $('<input>')
                    .attr('type', 'hidden')
                    .attr('name', 'header_ids[]')
                    .val(val)
                );
        });

    }
});

function appendSamplesIdToForm(form) {
    $.each(rowsSelected, function(index, rowId){
        $(form).append(
            $('<input>')
            .attr('type', 'hidden')
            .attr('name', 'sample_ids[]')
            .val(rowId)
        );
    });
}

function initHeaderTooltip() {
  // Fix compatibility of fixed table header and column names modal-tooltip
  $('.modal-tooltip').off();
  $('.modal-tooltip').hover(function() {
    var $tooltip = $(this).find('.modal-tooltiptext');
    var offsetLeft = $tooltip.offset().left;
    (offsetLeft + 200) > $(window).width() ? offsetLeft -= 150 : offsetLeft;
    var offsetTop = $tooltip.offset().top;
    $('body').append($tooltip);
    $tooltip.css('background-color', '#d2d2d2');
    $tooltip.css('border-radius', '6px');
    $tooltip.css('color', '#333');
    $tooltip.css('display', 'block');
    $tooltip.css('left', offsetLeft + 'px');
    $tooltip.css('padding', '5px');
    $tooltip.css('position', 'absolute');
    $tooltip.css('text-align', 'center');
    $tooltip.css('top', offsetTop + 'px');
    $tooltip.css('visibility', 'visible');
    $tooltip.css('width', '200px');
    $tooltip.css('word-wrap', 'break-word');
    $(this).data('dropdown-tooltip', $tooltip);
  }, function() {
    $(this).append($(this).data('dropdown-tooltip'));
    $(this).data('dropdown-tooltip').removeAttr('style');
  });
}

//Show sample info
function sampleInfoListener() {
    $(".sample_info").on("click", function(e){
        $("#modal-info-sample").remove();
        var that = $(this);
        $.ajax({
            method: "GET",
            url: that.attr("data-href")  + '.json',
            dataType: "json"
        }).done(function(xhr, settings, data) {
            $("body").append($.parseHTML(data.responseJSON.html));
            $("#modal-info-sample").modal('show',{
                backdrop: true,
                keyboard: false,
            }).on('hidden.bs.modal', function () {
                $(this).find(".modal-body #sample-info-table").DataTable().destroy();
                $(this).remove();
            });

            $('#sample-info-table').DataTable({
                dom: "RBltpi",
                stateSave: false,
                buttons: [],
                processing: true,
                colReorder: {
                    fixedColumnsLeft: 1000000 // Disable reordering
                },
                columnDefs: [{
                    targets: 0,
                    searchable: false,
                    orderable: false
                }],
                fnDrawCallback: function(settings, json) {
                    animateSpinner(this, false);
                },
                preDrawCallback: function(settings) {
                    animateSpinner(this);
                }
            });
        }).fail(function(error){
            // TODO
        }).always(function(data){
            // TODO
        });
        e.preventDefault();
        return false;
    });
}

// Edit sample
function onClickEdit() {
    if (rowsSelected.length != 1) return;

    var row = table.row("#" + rowsSelected[0]);
    var node = row.node();
    var rowData = row.data();

    $(node).find("td input").trigger("click");
    selectedSample = node;

    clearAllErrors();
    changeToEditMode();
    updateButtons();
    saveAction = "update";

    $.ajax({
        url: rowData["sampleEditUrl"],
        type: "GET",
        dataType: "json",
        success: function (data) {
            // Show save and cancel buttons in first two columns
            $(node).children("td").eq(0).html($("#saveSample").clone());
            $(node).children("td").eq(1).html($("#cancelSave").clone());

            // Sample name column
            var colIndex = getColumnIndex("#sample-name");
            if (colIndex) {
                $(node).children("td").eq(colIndex).html(changeToInputField("sample", "name", data["sample"]["name"]));
            }

            // Sample type column
            var colIndex = getColumnIndex("#sample-type");
            if (colIndex) {
                var selectType = createSampleTypeSelect(data["sample_types"], data["sample"]["sample_type"]);
                $(node).children("td").eq(colIndex).html(selectType);
                $("select[name=sample_type_id]").selectpicker();
            }

            // Sample group column
            var colIndex = getColumnIndex("#sample-group");
            if (colIndex) {
                var selectGroup = createSampleGroupSelect(data["sample_groups"], data["sample"]["sample_group"]);
                $(node).children("td").eq(colIndex).html(selectGroup);
                $("select[name=sample_group_id]").selectpicker();
            }

            // Take care of custom fields
            var cfields = data["sample"]["custom_fields"];
            $(node).children("td").each(function(i) {
                var td = $(this);
                var rawIndex = table.column.index("fromVisible", i);
                var colHeader = table.column(rawIndex).header();
                if ($(colHeader).hasClass("custom-field")) {
                    // Check if custom field on this sample exists
                    var cf = cfields[$(colHeader).attr("id")];
                    if (cf)
                        td.html(changeToInputField("sample_custom_fields", cf["sample_custom_field_id"], cf["value"]));
                    else
                        td.html(changeToInputField("custom_fields", $(colHeader).attr("id"), ""));
                }
            });

            // initialize smart annotation
            SmartAnnotation.init($('[data-object="sample_custom_fields"]'));
            _.each($('[data-object="custom_fields"]'), function(el) {
              if(_.isUndefined($(el).data('atwho'))) {
                SmartAnnotation.init(el);
              }
            });
            // Adjust columns width in table header
            adjustTableHeader();
        },
        error: function (e, data, status, xhr) {
            if (e.status == 403) {
                HelperModule.flashAlertMsg(
                  I18n.t('samples.js.permission_error'), e.responseJSON.style
                );
                changeToViewMode();
                updateButtons();
            }
        }
    });
}

// Save sample
function onClickSave() {
    if (saveAction == "update") {
        var row = table.row(selectedSample);
        var node = row.node();
        var rowData = row.data();
    } else if (saveAction == "create")
        var node = selectedSample;

    // First fetch all the data in input fields
    data = {
        request_url: $('#samples').data('current-uri'),
        sample_id: $(selectedSample).attr("id"),
        sample: {},
        custom_fields: {}, // These fields are not currently bound to this sample
        sample_custom_fields: {} // These fields are already in database (linked to this sample)
    };

    // Direct sample attributes
    // Sample name
    $(node).find("td input[data-object = sample]").each(function() {
        data["sample"][$(this).attr("name")] = $(this).val();
    });

    // Sample type
    $(node).find("td select[name = sample_type_id]").each(function() {
        data["sample"]["sample_type_id"] = $(this).val();
    });

    // Sample group
    $(node).find("td select[name = sample_group_id]").each(function() {
        data["sample"]["sample_group_id"] = $(this).val();
    });

    // Custom fields (new fields)
    $(node).find("td input[data-object = custom_fields]").each(function () {
        // Send data only and only if string is not empty
        if ($(this).val().trim()) {
            data["custom_fields"][$(this).attr("name")] = $(this).val();
        }
    });

    // Sample custom fields (existent fields)
    $(node).find("td input[data-object = sample_custom_fields]").each(function () {
        data["sample_custom_fields"][$(this).attr("name")] = $(this).val();
    });

    var url = (saveAction == "update" ? rowData["sampleUpdateUrl"] : $("table#samples").data("create-sample"))
    var type = (saveAction == "update" ? "PUT" : "POST")
    $.ajax({
        url: url,
        type: type,
        dataType: "json",
        data: data,
        success: function (data) {
            HelperModule.flashAlertMsg(data.flash, 'success');
            onClickCancel();
        },
        error: function (e, eData, status, xhr) {
            var data = e.responseJSON;
            clearAllErrors();

            if (e.status == 404) {
                HelperModule.flashAlertMsg(
                  I18n.t('samples.js.not_found_error'), 'danger'
                );
                changeToViewMode();
                updateButtons();
            }
            else if (e.status == 403) {
                HelperModule.flashAlertMsg(
                  I18n.t('samples.js.permission_error'), 'danger'
                );
                changeToViewMode();
                updateButtons();
            }
            else if (e.status == 400) {
                if (data["init_fields"]) {
                    var init_fields = data["init_fields"];

                    // Validate sample name
                    if (init_fields["name"]) {
                        var input = $(selectedSample).find("input[name=name]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + init_fields["name"] + "<br /></span>");
                        }
                    }
                };

                // Validate custom fields
                $.each(data["custom_fields"] || [], function(key, val) {
                    $.each(val, function(key, val) {
                        var input = $(selectedSample).find("input[name=" + key + "]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + val["value"][0] + "<br /></span>");
                        }
                    });
                });

                // Validate sample custom fields
                $.each(data["sample_custom_fields"] || [], function(key, val) {
                    $.each(val, function(key, val) {
                        var input = $(selectedSample).find("input[name=" + key + "]");

                        if (input) {
                            input.closest(".form-group").addClass("has-error");
                            input.parent().append("<span class='help-block'>" + val["value"][0] + "<br /></span>");
                        }
                    });
                });
            }
        }
    });
}

// Enable/disable edit button
function updateButtons() {
    if (currentMode=="viewMode") {
        $("#importSamplesButton").removeClass("disabled");
        $("#importSamplesButton").prop("disabled",false);
        $("#addSample").removeClass("disabled");
        $("#addSample").prop("disabled",false);
        $("#addNewColumn").removeClass("disabled");
        $("#addNewColumn").prop("disabled",false);
        $('#samples-columns-dropdown')
          .find('.dropdown-toggle')
          .prop("disabled",false);
        $("th").removeClass('disable-click');
        if (rowsSelected.length == 1) {
            $("#editSample").prop("disabled", false);
            $("#editSample").removeClass("disabled");
            $("#deleteSamplesButton").prop("disabled", false);
            $("#deleteSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").prop("disabled",false);
            $("#exportSamplesButton").on("click", function() {
              $('#modal-export-samples-success')
                .modal('show')
                .on('hidden.bs.modal', function() {
                  animateSpinner(null, true);
                  $('#form-export').submit();
                });
            });
            $("#assignSamples").removeClass("disabled");
            $("#assignSamples").prop("disabled", false);
            $("#unassignSamples").removeClass("disabled");
            $("#unassignSamples").prop("disabled", false);
        }
        else if (rowsSelected.length == 0) {
            $("#editSample").prop("disabled", true);
            $("#editSample").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled", true);
            $("#deleteSamplesButton").addClass("disabled");
            $("#exportSamplesButton").addClass("disabled");
            $("#exportSamplesButton").prop("disabled",true);
            $("#exportSamplesButton").off("click");
            $("#assignSamples").addClass("disabled");
            $("#assignSamples").prop("disabled", true);
            $("#unassignSamples").addClass("disabled");
            $("#unassignSamples").prop("disabled", true);
        }
        else {
            $("#editSample").prop("disabled", true);
            $("#editSample").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled", false);
            $("#deleteSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").removeClass("disabled");
            $("#exportSamplesButton").prop("disabled",false);
            $("#exportSamplesButton").on("click", function() {
              $('#modal-export-samples-success')
                .modal('show')
                .on('hidden.bs.modal', function() {
                  animateSpinner(null, true);
                  $('#form-export').submit();
                });
            });
            $("#assignSamples").removeClass("disabled");
            $("#assignSamples").prop("disabled", false);
            $("#unassignSamples").removeClass("disabled");
            $("#unassignSamples").prop("disabled", false);
        }
    }
    else if (currentMode=="editMode") {
            $("#importSamplesButton").addClass("disabled");
            $("#importSamplesButton").prop("disabled",true);
            $("#addSample").addClass("disabled");
            $("#addSample").prop("disabled",true);
            $("#editSample").addClass("disabled");
            $("#editSample").prop("disabled",true);
            $("#addNewColumn").addClass("disabled");
            $("#addNewColumn").prop("disabled", true);
            $("#exportSamplesButton").addClass("disabled");
            $("#exportSamplesButton").off("click");
            $("#deleteSamplesButton").addClass("disabled");
            $("#deleteSamplesButton").prop("disabled",true);
            $("#assignSamples").addClass("disabled");
            $("#assignSamples").prop("disabled", true);
            $("#unassignSamples").addClass("disabled");
            $("#unassignSamples").prop("disabled", true);
            $('#samples-columns-dropdown')
              .find('.dropdown-toggle')
              .prop("disabled",true);
            $("th").addClass('disable-click');
    }
}

// Clear all has-error tags
function clearAllErrors() {
    // Remove any validation errors
    $(selectedSample).find(".has-error").each(function() {
        $(this).removeClass("has-error");
        $(this).find("span").remove();
    });

    // Remove any alerts
    $("#alert-container").find("div").remove();
}

// Restore previous table
function onClickCancel() {
    table.draw('page');

    changeToViewMode();
    updateButtons();
}

function onClickAddSample() {
    changeToEditMode();
    updateButtons();

    saveAction = "create";
    $.ajax({
        url: $("table#samples").data("new-sample"),
        type: "GET",
        dataType: "json",
        success: function (data) {
            var tr = document.createElement("tr")
            $("table#samples thead tr").children("th").each(function(i) {
                var th = $(this);
                if ($(th).attr("id") == "checkbox") {
                    var td = createTdElement("");
                    $(td).html($("#saveSample").clone());
                    tr.appendChild(td);
                }
                else if ($(th).attr("id") == "assigned") {
                   var td = createTdElement("");
                    $(td).html($("#cancelSave").clone());
                    tr.appendChild(td);
                }
                else if ($(th).attr("id") == "sample-name") {
                    var input = changeToInputField("sample", "name", "");
                    tr.appendChild(createTdElement(input));
                }
                else if ($(th).attr("id") == "sample-type") {
                    var colIndex = getColumnIndex("#sample-type")
                    if (colIndex) {
                        var selectType = createSampleTypeSelect(data["sample_types"]);
                        var td = createTdElement("");
                        td.appendChild(selectType[0]);
                        tr.appendChild(td);
                    }
                }
                else if ($(th).attr("id") == "sample-group") {
                    var colIndex = getColumnIndex("#sample-group")
                    if (colIndex) {
                        var selectGroup = createSampleGroupSelect(data["sample_groups"]);
                        var td = createTdElement("");
                        td.appendChild(selectGroup[0]);
                        tr.appendChild(td);
                    }
                }
                else if ($(th).hasClass("custom-field")) {
                    var input = changeToInputField("custom_fields", th.attr("id"), "");
                    tr.appendChild(createTdElement(input));
                }
                else {
                    // Column we don't care for, just add empty td
                    tr.appendChild(createTdElement(""));
                }
            });
            $("table#samples").prepend(tr);
            selectedSample = tr;

            // Init dropdown with icons
            $("select[name=sample_group_id]").selectpicker();
            $("select[name=sample_type_id]").selectpicker();

            // initialize smart annotation
            _.each($('[data-object="custom_fields"]'), function(el) {
              if(_.isUndefined($(el).data('atwho'))) {
                SmartAnnotation.init(el);
              }
            });
            // Adjust columns width in table header
            adjustTableHeader();
        },
        error: function (e, eData, status, xhr) {
            if (e.status == 403)
                HelperModule.flashAlertMsg(
                  I18n.t('samples.js.permission_error'), 'danger'
                );
            changeToViewMode();
            updateButtons();
        }
    });
}

$('#assignedSamples').on('click', function () {
  view_assigned = 'assigned';
  table.draw();
});
$('#allSamples').on('click', function () {
  view_assigned = 'all';
  table.draw();
});

// Handle enter key
$(document).off('keypress').keypress(function(event) {
  var keycode = (event.keyCode ? event.keyCode : event.which);
  if (currentMode === 'editMode' && keycode === '13') {
    $('#saveSample').click();
    return false;
  }
});

// Helper functions
function getColumnIndex(id) {
  if (id < 0) {
    return false;
  }
  return table.column(id).index('visible');
}

// Takes object and surrounds it with input
function changeToInputField(object, name, value) {
  return "<div class='form-group'><input class='form-control' data-object='" +
      object + "' name='" + name + "' value='" + value + "'></input></div>";
}

// Return td element with content
function createTdElement(content) {
  var td = document.createElement('td');
  td.innerHTML = content;
  return td;
}

// Adjust columns width in table header
function adjustTableHeader() {
  table.columns.adjust();
  $('.dropdown-menu').parent().on('shown.bs.dropdown hidden.bs.dropdown', function () {
    table.columns.adjust();
  });
}

/**
 * Creates select dropdown for sample type
 * @param {Object[]} data List of sample types
 * @param {number} selected Selected sample type id
 * @return {Object} select dropdown
 */
function createSampleTypeSelect(data, selected) {

  var $selectType = $('<select></select>')
    .attr('name', 'sample_type_id').addClass('show-tick');

  $option = $('<option></option>')
    .attr('value', -1).text(I18n.t('samples.table.no_type'))
  $selectType.append($option);

  $.each(data, function(i, val) {
    var $option = $('<option></option>')
      .attr('value', val.id).text(val.name);
    if(val.id === selected) {
      $option.attr('selected', true);
    }
    $selectType.append($option);
  });
  return $selectType;
}

/**
 * Creates select dropdown for sample group
 * @param data List of sample groups
 * @param selected Selected sample group id
 */
function createSampleGroupSelect(data, selected) {

  var $selectGroup = $('<select></select>')
    .attr('name', 'sample_group_id').addClass('show-tick');

  $option = $('<option></option>')
    .attr('value', -1).text(I18n.t('samples.table.no_group'))
    .attr('data-icon', 'glyphicon glyphicon-asterisk');
  $selectGroup.append($option);

  $.each(data, function(i, val) {
    var $span = $('<span></span>').addClass('glyphicon glyphicon-asterisk')
      .css('color', val.color);
    var $option = $('<option></option>')
      .attr('value', val.id).text(val.name)
      .attr('data-content', $span.prop('outerHTML') + ' ' + val.name);
    if(val.id === selected) {
      $option.attr('selected', true);
    }
    $selectGroup.append($option);
  });
  return $selectGroup;
}

function changeToViewMode() {
  currentMode = 'viewMode';

    // $("#saveCancel").hide();

    // Table specific stuff
  table.button(0).enable(true);
}

function changeToEditMode() {
  currentMode = 'editMode';

    // $("#saveCancel").show();

    // Table specific stuff
  table.button(0).enable(false);
}

/*
 * Sample columns dropdown
 */
(function(table) {
  'use strict';

  var dropdown = $('#samples-columns-dropdown');
  var dropdownList = $('#samples-columns-list');
  var columnEditMode = false;

  function createNewColumn() {
    // Make an Ajax request to custom_fields_controller
    var url = $('#new-column-form').data('action');
    var columnName = $('#new-column-name').val();
    if (columnName.length > 0) {
      $.ajax({
        method: 'POST',
        dataType: 'json',
        data: {custom_field: {name: columnName}},
        error: function(data) {
          var form = $('#new-column-form');
          form.addClass('has-error');
          form.find('.help-block').remove();
          form.append('<span class="help-block">' +
            data.responseJSON.name +
            '</span>');
        },
        success: function(data) {
          var form = $('#new-column-form');
          form.find('.help-block').remove();
          if (form.hasClass('has-error')) {
            form.removeClass('has-error');
          }
          $('#new-column-name').val('');
          form.append('<span class="help-block">' +
            I18n.t('samples.js.column_added') +
            '</span>');

          // Preserve save/delete buttons as we need them after new table
          // will be created
          $('div.toolbarButtons').appendTo('div.samples-table');
          $('div.toolbarButtons').hide();

          // Destroy datatable
          table.destroy();

          // Add number of columns
          $('#samples').data('num-columns',
            $('#samples').data('num-columns') + 1);
          // Add column to table (=table header)
          originalHeader.append(
            '<th class="custom-field" id="' + data.id + '" ' +
            'data-editable data-deletable ' +
            'data-edit-url="' + data.edit_url + '" ' +
            'data-update-url="' + data.update_url + '" ' +
            'data-destroy-html-url="' + data.destroy_html_url + '"' +
            '>' + generateColumnNameTooltip(data.name) + '</th>');

          // Remove all event handlers as we re-initialize them later with
          // new table
          $('#samples').off();
          $('#samples thead').empty();
          $('#samples thead').append(originalHeader);

          // Re-initialize datatable
          table = dataTableInit();
          table.on('init.dt', function() {
            loadColumnsNames();
            dropdownOverflow();
          });
        },
        url: url
      });
    } else {
      var form = $('#new-column-form');
      form.addClass('has-error');
      form.find('.help-block').remove();
      form.append('<span class="help-block">' +
        I18n.t('samples.js.empty_column_name') +
        '</span>');
    }
  }

  function initNewColumnForm() {
    $('#samples-columns-dropdown').on('show.bs.dropdown', function() {
      // Clear input and errors when dropdown is opened
      var input = $(this).find('input#new-column-name');
      input.val('');
      var form = $('#new-column-form');
      if (form.hasClass('has-error')) {
        form.removeClass('has-error');
      }
      form.find('.help-block').remove();
    });

    $('#add-new-column-button').click(function(e) {
      e.stopPropagation();
      createNewColumn();
    });

    $('#new-column-name').keydown(function(e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        createNewColumn();
      }
    });
  }

  // loads the columns names in the dropdown list
  function loadColumnsNames() {
    // Save scroll position
    var scrollPosition = dropdownList.scrollTop();
    // Clear the list
    dropdownList.find('li[data-position]').remove();
    _.each(table.columns().header(), function(el, index) {
      if (index > 1) {
        var colIndex = $(el).attr('data-column-index');
        var visible = table.column(colIndex).visible();
        var editable = $(el).is('[data-editable]');
        var deletable = $(el).is('[data-deletable]');

        var visClass = (visible) ? 'glyphicon-eye-open' : 'glyphicon-eye-close';
        var visLi = (visible) ? '' : 'col-invisible';
        var editClass = (editable) ? '' : 'disabled';
        var delClass = (deletable) ? '' : 'disabled';

        var thederName;
        if ($(el).find('.modal-tooltiptext').length > 0) {
          thederName = $(el).find('.modal-tooltiptext').text();
        } else {
          thederName = el.innerText;
        }

        var html =
          '<li ' +
          'data-position="' + colIndex + '" ' +
          'data-id="' + $(el).attr('id') + '" ' +
          'data-edit-url=' + $(el).attr('data-edit-url') + ' ' +
          'data-update-url=' + $(el).attr('data-update-url') + ' ' +
          'data-destroy-html-url=' + $(el).attr('data-destroy-html-url') + ' ' +
          'class="' + visLi + '"' +
          '>' +
          '<i class="grippy"></i> ' +
          '<span class="text">' + generateColumnNameTooltip(thederName) + '</span> ' +
          '<span class="form-group"><input type="text" class="text-edit form-control" style="display: none;" />' +
          '<span class="pull-right controls">' +
          '<span class="ok glyphicon glyphicon-ok" style="display: none;" title="Save"></span>' +
          '<span class="cancel glyphicon glyphicon-remove" style="display: none;" title="Cancel"></span>' +
          '<span class="vis glyphicon ' + visClass + '" title="Toggle visibility"></span> ' +
          '<span class="edit glyphicon glyphicon-pencil ' + editClass + '" title="Edit"></span>' +
          '<span class="del glyphicon glyphicon-trash ' + delClass + '" title="Delete"></span>' +
          '</span><br></span></li>';
        dropdownList.append(html);
      }
    });
    // Restore scroll position
    dropdownList.scrollTop(scrollPosition);
    toggleColumnVisibility();
    // toggles grip img
    customLiHoverEffect();
  }

  function customLiHoverEffect() {
    var liEl = dropdownList.find('li');
    liEl.mouseover(function() {
      $(this)
        .find('.grippy')
        .addClass('grippy-img');
    }).mouseout(function() {
      $(this)
        .find('.grippy')
        .removeClass('grippy-img');
    });
  }

  function toggleColumnVisibility() {
    var lis = dropdownList.find('.vis');
    lis.on('click', function(event) {
      event.stopPropagation();
      var self = $(this);
      var li = self.closest('li');
      var column = table.column(li.attr('data-position'));

      if (column.visible()) {
        self.addClass('glyphicon-eye-close');
        self.removeClass('glyphicon-eye-open');
        li.addClass('col-invisible');
        column.visible(false);
        table.setColumnSearchable(column.index(), false);
      } else {
        self.addClass('glyphicon-eye-open');
        self.removeClass('glyphicon-eye-close');
        li.removeClass('col-invisible');
        column.visible(true);
        table.setColumnSearchable(column.index(), true);
        initHeaderTooltip();
      }

      // Re-filter/search if neccesary
      var searchText = $('div.dataTables_filter input').val();
      if (!_.isEmpty(searchText)) {
        table.search(searchText).draw();
      }
      sampleInfoListener();
    });
  }

  function initSorting() {
    dropdownList.sortable({
      items: 'li:not(.add-new-column-form)',
      cancel: '.new-samples-column',
      axis: 'y',
      update: function() {
        var reorderer = table.colReorder;
        var listIds = [];
        // We skip first two columns
        listIds.push(0, 1);
        dropdownList.find('li[data-position]').each(function() {
          listIds.push($(this).first().data('position'));
        });
        reorderer.order(listIds, false);
        loadColumnsNames();
      }
    });
  }

  function initEditColumns() {
    function cancelEditMode() {
      dropdownList.find('.text-edit').hide();
      dropdownList.find('.controls .ok,.cancel').hide();
      dropdownList.find('.text').css('display', ''); // show() doesn't work
      dropdownList.find('.controls .vis,.edit,.del').css('display', ''); // show() doesn't work
      columnEditMode = false;
    }

    function editColumn(li) {
      var id = li.attr('data-id');
      var text = li.find('.text');
      var textEdit = li.find('.text-edit');
      var newName = textEdit.val().trim();
      var url = li.attr('data-update-url');

      $.ajax({
        url: url,
        type: 'PUT',
        data: {custom_field: {name: newName}},
        dataType: 'json',
        success: function() {
          dropdownList.sortable('enable');
          $(li).clearFormErrors();
          text.html(generateColumnNameTooltip(newName));
          $(table.columns().header()).filter('#' + id)
            .html(generateColumnNameTooltip(newName));
          originalHeader.find('#' + id).html(newName);
          cancelEditMode();
          initHeaderTooltip();
        },
        error: function(xhr) {
          dropdownList.sortable('disable');
          $(li).clearFormErrors();
          var msg = $.parseJSON(xhr.responseText);

          renderFormError(xhr,
                          $(li).find('.text-edit'),
                          Object.keys(msg)[0] + ' ' + msg.name.toString());
          var verticalHeight = $(li).offset().top;
          dropdownList.scrollTo(verticalHeight,0);
        }
      });
    }

    // On edit buttons click (bind onto master dropdown list)
    dropdownList.on('click', '.edit:not(.disabled)', function(event) {
      event.stopPropagation();

      // Clear all input errors
      _.each(dropdownList, function(el) {
        $(el).clearFormErrors();
      });

      cancelEditMode();

      var li = $(this).closest('li');
      var url = li.attr('data-edit-url');
      ajaxCallEvent();

      function ajaxCallEvent(){
        $.ajax({
          url: url,
          success: function() {
            var text, textEdit, controls, controlsEdit;
            text = li.find('.text');
            if ($(text).find('.modal-tooltiptext').length > 0) {
              text = $(text).find('.modal-tooltiptext');
            }
            textEdit = li.find('.text-edit');
            controls = li.find('.controls .vis,.edit,.del');
            controlsEdit = li.find('.controls .ok,.cancel');

            // Toggle edit mode
            columnEditMode = true;
            li.addClass('editing');

            // Set the text-edit's value
            textEdit.val(text.text().trim());

            // Toggle elements
            text.hide();
            controls.hide();
            textEdit.css('display', ''); // show() doesn't work
            controlsEdit.css('display', ''); // show() doesn't work
            dropdownList.sortable('disable');
            dropdownList.on('click', function(ev) {
              ev.stopPropagation();
            });
            // Focus input
            textEdit.focus();
          },
          error: function(e) {
            $(li).clearFormErrors();
            var msg = $.parseJSON(e.responseText);

            renderFormError(undefined,
                            $(li).find('.text-edit'),
                            msg.name.toString());
            var verticalHeight = $(li).offset().top;
            dropdownList.scrollTo(verticalHeight,0);
            setTimeout(function() {
              $(li).clearFormErrors();
            }, 5000);
          }
        });
      }
    });

    // On hiding dropdown, cancel edit mode throughout dropdown
    dropdown.on('hidden.bs.dropdown', function() {
      cancelEditMode();
    });

    // On ok buttons click
    dropdownList.on('click', '.ok', function(event) {
      event.stopPropagation();
      dropdownList.sortable('enable');
      var self = $(this);
      var li = self.closest('li');
      $(li).clearFormErrors();
      editColumn(li);
    });

    // On enter click while editing column text
    dropdownList.on('keydown', 'input.text-edit', function(event) {
      if (event.keyCode === 13) {
        event.preventDefault();
        dropdownList.sortable('enable');
        var self = $(this);
        var li = self.closest('li');
        $(li).clearFormErrors();
        editColumn(li);
      }
    });

    // On cancel buttons click
    dropdownList.on('click', '.cancel', function(event) {
      event.stopPropagation();
      dropdownList.sortable('enable');
      var self = $(this);
      var li = self.closest('li');
      $(li).clearFormErrors();
      columnEditMode = false;
      li.removeClass('editing');

      li.find('.text-edit').hide();
      li.find('.controls .ok,.cancel').hide();
      li.find('.text').css('display', ''); // show() doesn't work
      li.find('.controls .vis,.edit,.del').css('display', ''); // show() doesn't work
    });
  }

  function initDeleteColumns() {
    var modal = $('#deleteCustomField');

    dropdownList.on('click', '.del', function(event) {
      event.stopPropagation();

      var self = $(this);
      var li = self.closest('li');
      var url = li.attr('data-destroy-html-url');
      var colIndex = originalHeader.find('#' + li.attr('data-id')).index();

      $.ajax({
        url: url,
        type: 'GET',
        dataType: 'json',
        data: {column_index: colIndex},
        success: function(data) {
          var modalBody = modal.find('.modal-body');

          // Inject the body's HTML into modal
          modalBody.html(data.html);

          // Show the modal
          modal.modal('show');
        },
        error: function(xhr) {
          dropdownList.sortable('disable');
          $(li).clearFormErrors();
          var msg = $.parseJSON(xhr.responseText);

          renderFormError(undefined,
                          $(li).find('.text-edit'),
                          msg.name.toString());
          var verticalHeight = $(li).offset().top;
          dropdownList.scrollTo(verticalHeight,0);
          setTimeout(function() {
            $(li).clearFormErrors();
          }, 5000);
        }
      });
    });

    modal.find('.modal-footer [data-action=delete]').on('click', function() {
      var modalBody = modal.find('.modal-body');
      var form = modalBody.find('[data-role=destroy-custom-field-form]');
      var id = form.attr('data-id');

      form
      .on('ajax:success', function() {
        // Preserve save/delete buttons as we need them after new table
        // will be created
        $('div.toolbarButtons').appendTo('div.samples-table');
        $('div.toolbarButtons').hide();

        // Destroy datatable
        table.destroy();

        // Subtract number of columns
        $('#samples').data(
          'num-columns',
          $('#samples').data('num-columns') - 1
        );

        // Remove column from table (=table header) & rows
        var th = originalHeader.find('#' + id);
        var index = th.index();
        th.remove();
        $('#samples tbody td:nth-child(' + (index + 1) + ')').remove();

        // Remove all event handlers as we re-initialize them later with
        // new table
        $('#samples').off();
        $('#samples thead').empty();
        $('#samples thead').append(originalHeader);

        // Re-initialize datatable
        table = dataTableInit();
        loadColumnsNames();

        // Hide modal
        modal.modal('hide');
      })
      .on('ajax:error', function() {
        // TODO
      });

      form.submit();
    });

    modal.on('hidden.bs.modal', function() {
      // Remove event handlers, clear contents
      var modalBody = modal.find('.modal-body');
      modalBody.off();
      modalBody.html('');
    });
  }

  // calculate the max height of window and adjust dropdown max-height
  function dropdownOverflow() {
    var windowHeight = $( window ).height();
    var offset = windowHeight - dropdownList.offset().top;

    if(dropdownList.height() >= offset) {
      dropdownList.css('maxHeight', offset);
    }
  }

  function generateColumnNameTooltip(name) {
    if( $.trim(name).length >
        20) {
      return '<div class="modal-tooltip">' +
             truncateLongString(name,
               20) +
             '<span class="modal-tooltiptext">' + name + '</span></div>';
    } else {
      return name;
    }
  }

  // initialze dropdown after the table is loaded
  function initDropdown() {
    table.on('init.dt', function() {
      initNewColumnForm();
      initSorting();
      toggleColumnVisibility();
      initEditColumns();
      initDeleteColumns();
    });
    $('#samples-columns-dropdown').on('show.bs.dropdown', function() {
      loadColumnsNames();
      dropdownList.sortable('enable');
    });

    $('#samples-columns-dropdown').on('shown.bs.dropdown', function() {
      dropdownOverflow();
    })
  }

  initDropdown();
})(table);
