var app = angular.module('flapperNews', ['ui.router']);

app.factory('posts', ['$http', function($http){
	var o = {
    posts: []
  };

  o.getAll = function() {
    	return $http.get('/posts').success(function(data){
      		angular.copy(data, o.posts);
    	});
 	 };

  o.create = function(post) {
  		return $http.post('/posts', post).success(function(data){
    		o.posts.push(data);
  		});
	};

	o.upvote = function(post) {
  		return $http.put('/posts/' + post._id + '/upvote').success(function(data){
      		post.upvotes += 1;
    	});
	};

	o.downvote = function(post) {
		console.log("Downvoting post");
  		return $http.put('/posts/' + post._id + '/downvote').success(function(data){
      		post.upvotes -= 1;
    	});
	};

	o.commentUpvote = function(post,comment) {
  		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote').success(function(data){
      		comment.upvotes += 1;
    	});
	};

	o.commentDownvote = function(post,comment) {
  		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote').success(function(data){
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
  		return $http.post('/posts/' + id + '/comments', comment)
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
		});

	$urlRouterProvider.otherwise('home');
}]);

app.controller('MainCtrl', ['$scope', 'posts', function($scope, posts){

	$scope.posts = posts.posts;
	
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

	$scope.incrementUpVotes = function(post){
		posts.upvote(post);
	};

	$scope.decrementUpVotes = function(post){
		posts.downvote(post);
	};
}]);

app.controller('PostsCtrl', ['$scope','posts','post',function($scope, posts, post){
	$scope.post = post;

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

	$scope.incrementCommentUpVotes = function(post,comment){
		console.log("Hit it");
		posts.commentUpvote(post,comment);
	};

	$scope.decrementCommentUpVotes = function(post,comment){
		console.log("Hit it2");
		posts.commentDownvote(post,comment);
	};
}]);

