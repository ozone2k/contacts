(function($){	
	
	// Using backbone.localstorage.js to replace sync functionality so it is not dependent on server-side storage.
	// Local storage created under the window object for ease of debugging
	window.myLocalStorage = new Store("contactsTbl");
	
	// configuring the Underscore.js template to work like Mustache markup {{var}}
	// Templates are used to format and output the views to HTML
	_.templateSettings = {interpolate : /\{\{(.+?)\}\}/g}; 
	
	var Contact = Backbone.Model.extend({
		
		localStorage: window.myLocalStorage,
		
		//Validate each of the attributes if they are being defined to be set or saved.
		//All fields required. More advanced validation rules to be added later.
		validate : function (attrs) {
			var error = []; //creates an array for all the errors it encounters.
			if (!_.isUndefined(attrs.firstname) && _.isEmpty($.trim(attrs.firstname))) {
				error.push("First name required.");
			}
			if (!_.isUndefined(attrs.lastname) && _.isEmpty($.trim(attrs.lastname))) {
				error.push("Last name required.");
			}
			if (!_.isUndefined(attrs.email) && _.isEmpty($.trim(attrs.email))) {
				error.push("Email required.");
			}
			if (!_.isUndefined(attrs.phone) && _.isEmpty($.trim(attrs.phone))) {
				error.push("Phone required.");
			}
			if (!_.isUndefined(attrs.address) && _.isEmpty($.trim(attrs.address))) {
				error.push("Address required.");
			}
			
			//returns the error array if there are errors and this gets handled by the error function. 
			//Otherwise returns false and successfully add model
			return (_.any(error) ? error : false); 
		},
		
		initialize : function (attrs) {
			//bindings of the backbone functions to this model's functions
			this.bind('error',this.error);
			this.bind('add', this.addContact);
		},
		
		//this function is called if model does not pass validation 
		error : function (model,error) {
			alert(error.join('\n'));
			return model;
		},
		
		//this function is called if model is successfully saved.
		addContact : function (model) {
			//alert(model.get('firstname') + ' ' + model.get('lastname') + ' saved!');	
		}
	});
	
	/* COLLECTION */ 
	var ContactList = Backbone.Collection.extend({
		model: Contact, //declaring the model to be used by the collection
		comparator : function (model) { //this ensures records are saved in alpha order by first name.
			return model.get("firstname");	
		}
	});
	
	
	/* VIEW for each contact (model) displayed from the collection to be appended to the main application view*/ 
	var EachContactView = Backbone.View.extend({
		tagName : 'li', //each contact wil be represented as an li and appended to the main application contact list
		className : 'item',
		
		events : {
			'click .del' : 'remove',
			'click .edit' : 'editcontact',
			'blur input.editThis' : 'onExitEdit'
		},
		
		initialize : function () {
			_.bindAll(this, 'render', 'remove', 'unrender', 'editcontact',  'onExitEdit'); //'alertContact', 'viewDetails',
			this.model.bind('remove', this.unrender);	
			this.model.bind('save', this.render);
			this.model.bind('change', this.render);
		},
		
		render : function () {
			//Use template stored in the index.html file encased by <javascript> to prevent initial output to html
			var template = _.template( $("#eachContact_template").html(), this.model.toJSON() ); 
			$(this.el).html(template);
			return this;
		},
		
		remove : function () {
			this.model.destroy();
		},
		
		unrender : function () {
			$(this.el).remove();	
		},
		
		editcontact : function () {
			editView = new EditView({model:this.model});
			//Router to be implemented in the future to allow for history state and bookmarking
			//app_router.navigate("!/user/" + this.model.get("firstname"), false);	
		},
		onExitEdit : function () {
			this.render();	
		}
	});
	
	/* VIEW - Edit existing contact or create a new one */
	
	var EditView = Backbone.View.extend({
		// Model will be passed on instantiation if it exists otherwise 
		// the collection will be passed to be used when creating a new model
		tagName : 'div',
		className : 'editing',
		
		events : {
			'click #saveBtn' : 'savecontact',
			'click #cancelBtn' : 'closeedit',
			'submit #userdetailform' : 'savecontact'
		},
		
		initialize : function () {
			_.bindAll(this, 'render', 'savecontact', 'closeedit', 'unrender'); 
			
			//Creates a blank contact object if model does not exists and use it to populate the edit template later.
			//Or binds the existing model to be edited 
			if (_.isUndefined(this.model)) {
				newContactObj = {firstname:'',lastname:'',email:'',phone:'',address:''};
			} else {
				this.model.bind('change', this.closeedit); //call to close the edit view when the model has been saved.
				this.model.bind('save', this.closeedit);
			}
			
			this.render();
		},
		
		render : function () {
			var template = _.template( $("#edit_template").html(), model = (_.isUndefined(this.model))? newContactObj : this.model.toJSON() );
			$(this.el).html(template);	
			$.colorbox({html:this.el,onComplete:function(){$("#f-firstname").focus()}, close:'Cancel'});
			return this;
		},
		
		savecontact : function () {
			// Prep contact object to be saved
			// This will be replaced with a better function to serialize the form object to json in the future
			var contactObj = {
				firstname:$("#f-firstname").val(), 
				lastname:$("#f-lastname").val(),
				email: $("#f-email").val(),
				phone: $("#f-phone").val(),
				address: $("#f-address").val()
			}
			
			//It's a new contact
			if (_.isUndefined(this.model)) {
				var contactSave = this.collection.create(contactObj); //adds new contact to collection
				if (contactSave) {this.closeedit();} //if successful it will close the edit view
			} else {
				this.model.save(contactObj); //saves changes to existing model
			}
			
			return false;
		},
		
		closeedit : function () {
			$.colorbox.close();
			this.unrender();
			return false;
		},
		
		unrender : function () {
			this.remove();
		}
	});
	
	/* VIEW - Main application view */
	var ContactsView = Backbone.View.extend({
		el:$('body'), // the app view will attach to the existing body tag in the html
		
		events : {
			'click button#addBtn' : 'addContact',
			'click a#resetBtn' : 'loadContacts'
		},
		
		collection : this.contacts = new ContactList, // instantiating the collection to be used in this view
		
		initialize : function () {
			_.bindAll(this, 'render', 'appendContact', 'addContact', 'refreshContacts', 'loadContacts'); //Binding the "this" object to be used within the methods in this view
			this.collection.bind('add', this.refreshContacts); //collection event binder to the view
			this.collection.bind('change', this.refreshContacts); //collection event binder to the view			
			this.render(); //calls the render function upon initialize	
		},
		
		render : function () {
			$(this.el).append("<h1>Contacts (beta)</h1>");
			$(this.el).append("<p>[Just a simple and functional application while learning Backbone.js - no fancy CSS yet]</p>");
			$(this.el).append("<p><a href='#' id='resetBtn'>Load Sample Contacts</a></p>");
			$(this.el).append("<form id='entry'> <button id='addBtn'>Add Contact</button></form><ul></ul>");
			this.refreshContacts();
			
		},
		
		appendContact : function (contact) {
			var eachContact = new EachContactView({
				model : contact
			});
			$('ul', this.el).append(eachContact.render().el);
		},
		
		addContact : function () {
			this.refreshContacts();
			editView = new EditView({collection : this.collection}); //instantiate the edit view 
			return false;
			
		},
		
		refreshContacts : function () {
			$('ul li').remove();//reset list
			this.collection.sort(); //force resorting the collection if name was changed
			_(this.collection.models).each(function(contact){
				this.appendContact(contact);	
			},this);
		},
		
		//Boostraping some data sample for easy debugging
		loadContacts : function () {
			this.collection.reset([{ firstname: "William", lastname: "Gates", email: "bill@microsoft.com", phone: "407-111-2222", address: "123 Somewhere, Here, IN 32792" },
					{ firstname: "Douglas", lastname: "Crockford", email: "douglas@crockford.com", phone: "407-333-4545", address: "987 Elsewhere, But Here, IN 32792" },
					{ firstname: "Jeremy", lastname: "Ashkenas", email:"jeremy@ashkenas.com", phone: "407-666-4567", address: "546 Nowhere, Else, IN 32792" }
				]); 
			this.refreshContacts();
			return false;
		}
	});
	
	var app = new ContactsView;
	
		
	/* 	TO BE CONTINUED ...
	//	implement the Router component to drive the application and allow for bookmarking application at specific states
	//	bind app to  back-end database
	
	
	var AppRouter = Backbone.Router.extend({
        
		initialize : function () {
			var app = new ContactsView;
		},
		
		routes: {
            "!/user/:name": "getUser",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        },
        getUser: function (name) {
            // Note the variable in the route definition being passed in here
            //alert( "Get post number " + id );   
			
        },
        defaultRoute: function (actions) {
            //alert( actions ); 
        }
    });
    // Instantiate the router
    var app_router = new AppRouter;
    // Start Backbone history a neccesary step for bookmarkable URL's
    Backbone.history.start();
	
	*/
	
})(jQuery);
