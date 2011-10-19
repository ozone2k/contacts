(function($){	
	
	window.myLocalStorage = new Store("contactsTbl");
	
	var Contact = Backbone.Model.extend({
		//Validate each of the attributes if they are being defined to be set or saved
		//This is simplified but it can have many more validation rules.
		validate : function (attrs){
			var error = []; //creates an array for all the errors it encounters.
			if(!_.isUndefined(attrs.firstname) && _.isEmpty($.trim(attrs.firstname))) {
				error.push("First name must not be blank");
			}
			if(!_.isUndefined(attrs.lastname) && _.isEmpty($.trim(attrs.lastname))) {
				error.push("Last name must not be blank");
			}
			if(!_.isUndefined(attrs.email) && _.isEmpty(attrs.email)) {
				error.push("Email must not be blank");
			}
			if(!_.isUndefined(attrs.phone) && _.isEmpty(attrs.phone)) {
				error.push("Email must not be blank");
			}
			if(!_.isUndefined(attrs.address) && _.isEmpty(attrs.address)) {
				error.push("Address must not be blank");
			}
			
			return (_.any(error) ? error : false); //returns the error array if there are errors and this gets handled by the error function. Otherwise returns false and successfully add model
		},
		
		initialize : function(attrs){
			//bindings of the backbone functions to this model's functions
			this.bind('error',this.error);
			this.bind('add', this.addContact);
		},
		
		error : function(model,error){
			alert(error.join(','));
		},
		
		addContact : function(model){
			//alert(model.get('firstname') + ' added');	
		}
	});

	var ContactList = Backbone.Collection.extend({
		
		model: Contact,
		
		localStorage: window.myLocalStorage,
		//localStorage: new Store("contactsTbl"), //using localStorage instead of saving to server. The Backbone.Sync methods were overwriten to save locally in the backbone-localstorage.js file.
		
		comparator : function(model){
			return model.get("firstname");	//this ensures records are saved in alpha order by first name.
		},
		
	});
	
	var EachContactView = Backbone.View.extend({
		tagName : 'li', //each contact wil be represented as an li and appended to the main application contact list
		className : 'item',
		
		events : {
			//'click' : 'alertContact',
			'click .del' : 'remove',
			'click .edit' : 'editcontact',
			'keypress input.editThis' : 'onEnterEdit',
			'blur input.editThis' : 'onExitEdit',
			'click .contactname' : 'viewDetails'
			
		},
		
		initialize : function(){
			_.bindAll(this, 'render','alertContact', 'remove', 'unrender', 'editcontact', 'onEnterEdit', 'viewDetails', 'onExitEdit');
			this.model.bind('remove', this.unrender);	
			this.model.bind('save', this.render);
		},
		
		render : function (){
			_.templateSettings = {
				interpolate : /\{\{(.+?)\}\}/g
			};
			var template = _.template( $("#eachContact_template").html(), this.model.toJSON() );
			$(this.el).html(template);
			//$(this.el).html("<span class='contact-name'>" + this.model.get('firstname') + " " + this.model.get('lastname') + "</span> <span class='del'>[x]</span>");	
			return this;
		},
		
		alertContact : function (){
			alert('You clicked: ' +this.model.get('firstname'));	
		},
		
		remove : function(){
			this.model.destroy();
		},
		unrender : function(){
			$(this.el).remove();	
		},
		
		editcontact : function (){
			$(this.el).html("<input type='text' class='editThis' value='"+ this.model.get("firstname") +" " + this.model.get("lastname") +"'>");
			$('.editThis', this.el).focus();
			app_router.navigate("!/user/" + this.model.get("firstname"), false);	
		},
		onExitEdit : function (){
			this.render();	
		},
		
		onEnterEdit : function(e){
			var keypressed = e.keyCode;
			if (keypressed == 13){
				var fullnameArray = $('.editThis',this.el).val().split(' ');
				var firstname = fullnameArray[0];
				var lastname = fullnameArray[1];
				this.model.save({firstname:firstname, lastname:lastname});
				this.render();
			} else if (keypressed == 27){
				this.onExitEdit();
			}
		},
		
		viewDetails : function(){
				
		}
		
		
	});
	
	/* CONTINUE TO WORK ON THIS LATER
	
	var EditView = Backbone.View.extend({
		//model will be passed on view call for edit or not for new
		el : $('div.editView'),
		
		initialize : function(){
			if (_.isUndefined(this.model) ){
				this.model = {firstname:'',lastname:'',email:'',phone:'',address:''}
			}
			this.render();
		},
		
		render : function(){
			
		}
		
	});
	*/
	
	var ContactsView = Backbone.View.extend({
		el:$('body'), // the app view will attach to the existing body tag in the html
		
		events : {
			'click button#addBtn' : 'addContact'
			//'keypress #lastname' : 'addOnEnter'
		},
		
		initialize : function(){
			_.bindAll(this, 'render', 'appendContact', 'addContact', 'refreshContacts', 'addOnEnter'); //Binding the "this" object to be used within the methods in this view
			
			this.contacts = new ContactList; //instantiating the collection to be used in this view
			this.contacts.bind('add', this.refreshContacts); //collection event binder to the view
			
			/*this.contacts.create({firstname:"Michelle",lastname:"Parente"});
			this.contacts.create({firstname:"Renato",lastname:"Parente"});
			this.contacts.create({firstname:"Ricardo",lastname:"Parente"});
			this.contacts.create({firstname:"Ordely",lastname:"Parente"})*/
			
			this.render(); //calls the render function upon initialize	
		},
		
		render : function (){
			$(this.el).append("<form id='entry'>First: <input type='text' id='firstname' />  Last:<input type='text' id='lastname' /> <button id='addBtn'>Add</button> </form>");
			$(this.el).append("<ul></ul>");
			this.refreshContacts();
		},
		
		appendContact : function(contact){
			var contactView = new EachContactView({
				model : contact
			});
			$('ul', this.el).append(contactView.render().el);
		},
		
		addContact : function(){
			var contact = {firstname: $('#firstname').val(), lastname: $('#lastname').val()};
			this.contacts.create(contact);
			$(':input','#entry').not(':button').val('');
			$('#firstname').focus();
			//$('#entry').reset();
			return false;
			
		},
		
		addOnEnter : function(e){
			if(e.keyCode ==13) {
				this.addContact();
			}
		},
		
		refreshContacts : function(){
			$('ul li').remove();
			_(this.contacts.models).each(function(contact){
				this.appendContact(contact);	
			},this);
		}
		

	});
	
	//var app = new ContactsView;
	
	var AppRouter = Backbone.Router.extend({
        
		initialize : function(){
			var app = new ContactsView;
		},
		
		routes: {
            "!/user/:name": "getUser",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        },
        getUser: function( name ) {
            // Note the variable in the route definition being passed in here
            //alert( "Get post number " + id );   
			
        },
        defaultRoute: function( actions ){
            //alert( actions ); 
        }
    });
    // Instantiate the router
    var app_router = new AppRouter;
    // Start Backbone history a neccesary step for bookmarkable URL's
    Backbone.history.start();
	
})(jQuery);


	//var contacts=new ContactList;
	
	
/*
contacts.create({firstname:"Michelle",lastname:"Parente"});
contacts.create({firstname:"Renato",lastname:"Parente"});
contacts.create({firstname:"Ricardo",lastname:"Parente"});
contacts.create({firstname:"Ordely",lastname:"Parente"});*/

//alert(contacts.pluck('firstname'));
 
