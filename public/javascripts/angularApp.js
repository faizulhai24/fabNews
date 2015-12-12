var app = angular.module('flapperNews', ['ui.router']);

app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {
    	posts: []
  	};

  	o.getAll = function() {
    	return $http.get('/posts').success(function(data){
      		angular.copy(data, o.posts);
    	});
 	 };

  	o.create = function(post) {
  		return $http.post('/posts', post,  {
    	headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
    		o.posts.push(data);
  		});
	};

	o.delete = function(post) {
		console.log(auth.getToken());
  		return $http.post('/posts/' + post._id + '/delete', post,  {
    	headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
    		angular.copy(data, o.posts);
  		});
	};

	o.upvote = function(post) {
  		return $http.put('/posts/' + post._id + '/upvote', null,  {
    headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      		post.upvotes += 1;
    	});
	};

	o.downvote = function(post) {
		console.log("Downvoting post");
  		return $http.put('/posts/' + post._id + '/downvote', null,  {
    headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      		post.upvotes -= 1;
    	});
	};

	o.commentUpvote = function(post,comment) {
  		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null,  {
    headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      		comment.upvotes += 1;
    	});
	};

	o.commentDownvote = function(post,comment) {
  		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null,  {
    headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
      		comment.upvotes -= 1;
    	});
	};

    o.get = function(id) {
    	console.log("Getting a post");
		return $http.get('/posts/' + id).then(function(res){
   			return res.data;
		});
	};

	o.addComment = function(id, comment) {
  		return $http.post('/posts/' + id + '/comments', comment,  {
    headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};
  	

  	o.deleteComment = function(post,comment) {
  		console.log(auth.getToken());
  		return $http.post('/posts/' + post._id + '/comments/' + comment._id + '/delete', {'post':post, "comment":comment},  {
    	headers: {Authorization: 'Bearer '+auth.getToken()}
    	});
	};

	return o;
}])


app.config(['$stateProvider','$urlRouterProvider', function($stateProvider, $urlRouterProvider){
	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
     		controller: 'MainCtrl',
     		resolve: {
			    postPromise: ['posts', function(posts){
			      return posts.getAll();
			    }]
			  }
		})
		.state('posts', {
			  url: '/posts/{id}',
			  templateUrl: '/posts.html',
			  controller: 'PostsCtrl',
			  resolve: {
			    post: ['$stateParams', 'posts', function($stateParams, posts) {
			      	return posts.get($stateParams.id);
			    }]
			  }
		})
		.state('login', {
			  url: '/login',
			  templateUrl: '/login.html',
			  controller: 'AuthCtrl',
			  onEnter:['$state', 'auth', function($state, auth) {
			  		if(auth.isLoggedIn()){
			  			console.log('Logged In');
			  			$state.go('home');
			  		}
			  }]
			  
		})
		.state('register', {
			  url: '/register',
			  templateUrl: '/register.html',
			  controller: 'AuthCtrl',
			  onEnter:['$state', 'auth', function($state, auth) {
			  		if(auth.isLoggedIn()){
			  			console.log('Logged In');
			  			$state.go('home');
			  		}
			  }]
		});

	$urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', ['$scope', 'posts', 'auth', function($scope, posts, auth){

	$scope.posts = posts.posts;
	$scope.isLoggedIn = auth.isLoggedIn;
	
	$scope.addPost = function(){
		if (!$scope.title || $scope.title==='' ){
			return;
		}
		posts.create({title:$scope.title,
    						link: $scope.link,
    						upvotes: 0,
    						});
		$scope.title = '';
		$scope.link = '';
	};

	$scope.deletePost = function(post){
		posts.delete(post);
	};

	$scope.incrementUpVotes = function(post){
		posts.upvote(post);
	};

	$scope.decrementUpVotes = function(post){
		posts.downvote(post);
	};

	$scope.showDeletePost = function(post){
		return (auth.currentUser() === post.author);
	};

}]);

app.controller('PostsCtrl', ['$scope','posts','post','auth', function($scope, posts, post, auth){
	$scope.post = post;
	$scope.isLoggedIn = auth.isLoggedIn;

	$scope.addComment = function(){
	  if($scope.body === '') { return; }
	  posts.addComment(post._id, {
	    body: $scope.body,
	    author: 'user',
	  }).success(function(comment){
	  	$scope.post.comments.push(comment);
	  });
	  $scope.body = '';
	};

	$scope.deleteComment = function(post,comment){
		posts.deleteComment(post,comment).success(function(data){
			console.log(data);
			$scope.post = data;
		});
	};

	$scope.incrementCommentUpVotes = function(post,comment){
		posts.commentUpvote(post,comment);
	};

	$scope.decrementCommentUpVotes = function(post,comment){
		posts.commentDownvote(post,comment);
	};

	$scope.showDeleteComment = function(post,comment){
		return (auth.currentUser() === post.author || auth.currentUser() === comment.author);
	};

	
}]);

app.controller('AuthCtrl', ['$scope', '$state', 'auth', function($scope, $state, auth){
	$scope.user = {};
	$scope.isLoggedIn = auth.isLoggedIn;
	$scope.register = function(){
		auth.register($scope.user).error(function(err){
			$scope.error = err;
		}).then(function(){
			$state.go('home');
		});
	};

	$scope.logIn = function(){
		auth.logIn($scope.user).error(function(err){
			$scope.error = err;
		}).then(function(){
			console.log("Redirecting to home from login")
			$state.go('home');
		});
	};
}]);

app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	auth.saveToken = function(token){
		$window.localStorage['fap-news'] = token;
	}

	auth.getToken = function(){
		return $window.localStorage['fap-news'];
	}

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if (token){
			var payload = JSON.parse($window.atob(token.split('.')[1]))
			return payload.exp > Date.now()/1000;
		}
		else{
			return false;
		}
	}

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]))

			return payload.username;
		}
	}

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		})
	}

	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		})
	}

	auth.logOut = function(){
	  	$window.localStorage.removeItem('fap-news');
	};

	return auth;
}])
