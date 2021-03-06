'use strict';

/* Controllers */

angular.module('myApp.controllers', []).
  controller('MyCtrl1', [function() {

  }])
  .controller('MyCtrl2', ['$scope', '$http', function($scope, $http) {
		var data;
		var periods;
                var x;
		data = api_call($http, 'payperiod/list/', 'get');
		data.success(function(response) {
                    //    for (x in response) {
                    //        response[x].id = get_id(response[x].url);
                    //    }
			$scope.periods = response.pay_periods;
		});
		data.error(function() {
			alert('error');
		});
		
		$scope.predicate = "-id";
		
		function period(period) {
			$scope.period = period;
		}
		
  }])
  .controller('userLogin', ['$scope', '$http', function($scope, $http) {
	    $scope.is_loggedIn = is_loggedIn();

		if ($scope.is_loggedIn == true) {
			$scope.username = readCookie("username");
			$http.defaults.headers.common['AUTHENTICATE'] = readCookie('Authorization');
            var groups = api_call($http, 'user/' + readCookie('userId') + '/', 'get');
            groups.success(function(response) {
                    var group = response.groups;
                    for (x in group) {
                        if (group[x] == 4) {
                            $scope.admin = true;
                        } else if (group[x] == 3) {
                            $scope.faculty = true;
                        } else if (group[x] == 2) {
                            $scope.lab_tech= true;
                        } else if (group[x] == 1) {
                            $scope.lab_aide = true;
                        }
                    }
                });

		}
		var data = new Object;
        var login;
        var x;
		$scope.login = function() {
            data = {'username': $scope.username, 'password': $scope.password};
            //data = {"username": $scope.username, "password":$scope.password};
		    login = api_call($http, 'auth/login/', 'post', data);
		    login.success(function(data) {
                setCookie('Authorization', data.token);
			          setCookie('username', $scope.username);
                setCookie('userId', data.id);
			          $http.defaults.headers.common['AUTHENTICATE'] = data.token;
			          $scope.is_loggedIn = true;
                var userId = data.id;
                var groups = api_call($http, 'user/' + userId + '/', 'get');
                groups.success(function(response) {
                    var group = response.groups;
                    for (x in group) {
                        if (group[x] == 4) {
                            $scope.admin = true;
                        } else if (group[x] == 3) {
                            $scope.faculty = true;
                        } else if (group[x] == 2) {
                            $scope.lab_tech= true;
                        } else if (group[x] == 1) {
                            $scope.lab_aide = true;
                        }
                    }
                });
                

	    	});
		    login.error(function(data, status) {
			    if (400 === status) {
                    $scope.invalidUsernamePassword = true;
                } else {
				    alert('No Response from Django Server');
		    	}
	    	});
    	    return false;
	
	    };
	
  	$scope.logout = function() { 
  		setCookie('username', null);
  		//setCookie('groups', null);
  		setCookie('Authorization', null);
      setCookie('userId', null);
  		$http.defaults.headers.common['Authorization'] = null;
  		document.location.reload(true);
  	}
    $scope.forgot = function() {

    }

  }])
  .controller('nav', ['$scope', function($scope) {
	  var loggedin = is_loggedIn();
	  
	 // if (loggedin == true) {
		  $scope.lab_aide = true;
		  $scope.lab_tech = true;
	 	  $scope.faculty = true;
    	  	$scope.admin = true;
	  //}

    $scope.$on('user_login', function() {
        $scope.lab_aide = true;
        $scope.lab_tech = true;
        $scope.faculty = true;
        $scope.admin = true; 
    });
  }])
  .controller('periods', ['$scope', '$http', function($scope, $http) {
	  var entries;
	  var categories;
	  var periods;
    $scope.loading = true;
    var total;
    $scope.total = 0;
    $scope.on_campus = false;
	  
	  $scope.form = false;
	  //Get Categories data
		categories = api_call($http, 'category/', 'get');
		categories.success(function(response) {
      $scope.categories = response;
		  $scope.period = readCookie('period');
  	  $scope.periodName = readCookie('periodName');
  	  entries = api_call($http, 'workevent/payperiod/' + $scope.period + '/', 'get');
      entries.success(function(data) {
  		  var x;
  		  for (x in data) {
          data[x] = adjustEntry(data[x], $scope.categories);
          $scope.total += data[x].total;
  		  }
        $scope.loading = false;
  		  $scope.entries = data;
  	  });
      entries.error(function(data, status) {
        if (status == 403) {
          $scope.error = "You must be logged in to view this page";
        }
    });
    });
    
	  
	  $scope.predicate = "start_date";

    $scope.deleteEntry = function(entry_id) {
      var entry;
      var data = {};
      data.id = entry_id;
      entry = api_call($http, 'workevent/delete/' + entry_id + '/', 'post', data);
      entry.success(function() {
          entries = api_call($http, 'workevent/payperiod/' + $scope.period + '/', 'get');
          entries.success(function(data) {
            var x;
            $scope.total = 0;
            for (x in data) {
                data[x] = adjustEntry(data[x], $scope.categories);
                $scope.total += data[x].total;
            }
            $scope.entries = data;
          });
      });

    }

    $scope.formUpdate = function() {
      var data = {};
      var id = $scope.updateValue;
      data.category = $scope.category;
      //data.start_time = $scope.start_time + ":00";
      //data.end_time = $scope.end_time + ":00";
      //data.start_date = $scope.start_date;
      data.start = new Date($scope.start_date + " " + $scope.start_tme);
      data.end = new Date($scope.end_date + " " + $scope.end_time);
                  
                  if ($scope.on_campus.checked == true) {
                            data.on_campus = true;
                  } else {
                            data.on_campus = false;
                  }
      data.comments = $scope.comments;      
      api_call($http, 'workevent/update/' + id + '/', 'post', data);
      $scope.form = false;
      $scope.update = false;
                  $scope.total = 0;
                  setTimeout(function() {
                            entries = api_call($http, 'workevent/payperiod/' + $scope.period + '/', 'get');
                            entries.success(function(data) {
                                          var x;
                                          for (x in data) {
                                                data[x] = adjustEntry(data[x], $scope.categories);
                                                $scope.total += data[x].total;
                                      }
                                  $scope.entries = data;
                            });
                  }, 500);

    }
	  
	  $scope.formSubmit = function() {
		  var data = {};
		  data.category = $scope.category;
		  data.start_time = $scope.start_time + ":00";
		  data.end_time = $scope.end_time + ":00";
		  data.start_date = $scope.start_date;
                  
                  if ($scope.on_campus.checked == true) {
                            data.on_campus = true;
                  } else {
                            data.on_campus = false;
                  }
		  data.comments = $scope.comments;		  
		  api_call($http, 'workevent/add/', 'post', data);
		  $scope.form = false;
                  $scope.total = 0;
                  setTimeout(function() {
                            entries = api_call($http, 'workevent/payperiod/' + $scope.period + '/', 'get');
                            entries.success(function(data) {
                                          var x;
                                          for (x in data) {
                                                data[x] = adjustEntry(data[x], $scope.categories);
                                                $scope.total += data[x].total;
                                      }
                                  $scope.entries = data;
                            });
                  }, 500);
	  }
          
  }])
  .controller('tsadmin', ['$scope', '$http', function($scope, $http) {
	  var payperiods;
	  var x;
          payperiods = api_call($http, 'payperiod/list/', 'get');
          payperiods.success(function(periods) {
             $scope.periods = periods.pay_periods;
          });
          $scope.predicate = "-id";
          
          $scope.periodSubmit = function() {
              var data = {};
              data.name = $scope.name;
              data.start = $scope.start_date;
              data.end = $scope.end_date;
              api_call($http, 'payperiod/add/', 'post', data);
              $scope.period = false;
              setTimeout(function() {
                payperiods = api_call($http, 'payperiod/list/', 'get');
                payperiods.success(function(periods) {
                  $scope.periods = periods.pay_periods;
                });
              }, 500);
              
          }
		  
		  $scope.catSubmit = function() {
			  var data = {};
			  data.name = $scope.catName;
        if ($scope.is_project === true) {
			    data.is_project = true;
        } else {
          data.is_project = false;
        }
			  api_call($http, 'category/add/', 'post', data);
			  $scope.category = false;
		  }
  }])
  .controller('periodadmin', ['$scope', '$http', function($scope, $http) {
              var categories;
              var entries;
              var period;
              var users;
              var username;
              var x;
              var y;
              var z;
              var complete;
              var total = 0;

              categories = api_call($http, 'category/', 'get');
			  categories.success(function(response) {
              	  $scope.categories = response;
			  });

              users = api_call($http, 'user/', 'get');
              users.success(function(data) {
              		$scope.users = data;
              });
                            
              period = readCookie('period');
              $scope.period = readCookie('periodName');
              setTimeout(function() {
              	entries = api_call($http, 'report/workevent/payperiod/' + period + '/', 'get');
              	entries.success(function(entry) {
                  /*
               		for (x in entry) {
               			  //username = $.grep($scope.users, function(e) {return e.url == 'http://home.cspuredesign.com:8080' + entry[x].user});
                    
               		    //entry[x].user = username['0'].first_name + ' ' + username['0'].last_name;
               		    //entry[x].category = 'http://home.cspuredesign.com:8080' + entry[x].category;
               		    entry[x] = adjustEntry(entry[x], $scope.categories);
               		}
                  */
              		//entry = sort_reports(entry);
                  /*
              		for (z in entry) {
              			total = 0;
              			for (y in entry[z].events) {
              				if (entry[z].events[y].duration != null) {
	              				total += entry[z].events[y].duration;
	              			}
              			}
              			entry[z].total = total;

              		}
                  */
                  $scope.entries = entry;

                  });

              }, 50);

              $scope.predicate = "start_date";
              
  }])
  .controller('adminreports', ['$scope', '$http', function($scope, $http) {
  	if ($scope.report == 'category') {
  		$scope.layout = 'category';

  		data = api_call($http, 'report/timesheet/', 'get')

  	}

  }])
  .controller('inventoryhome', ['$scope', '$http', function($scope, $http) {
	    $scope.search = false;
      var computers = api_call($http, 'inventory/all/Computer/', 'get');
      var unit = api_call($http, 'inventory/all/Unit/', 'get');
      var fw = api_call($http, 'inventory/all/Firewall/', 'get');
      var switches = api_call($http, 'inventory/all/Switch/', 'get');
      var router = api_call($http, 'inventory/all/Router/', 'get');
      
      computers.success(function(data) {
          $scope.computers = data
      });
      fw.success(function(data) {
          $scope.fw = data;
      });
      switches.success(function(data) {
          $scope.switches = data;
      });
      router.success(function(data) {
          $scope.router = data;
      });
  }])
  .controller('requestform', ['$scope', '$http', function($scope, $http) {
      var users = {};
  	  var currentUser;
  	  var currentUrl;	  
  	  var users_get = api_call($http, 'user/', 'get');
      var x;
      users_get.success(function(response) {
          users = response;
      	  currentUser = $.grep(users, function(e) {return e.username == readCookie('username')});
      	  currentUrl = currentUser['0'].url;
      	  $scope.requestId = currentUser['0'].id;
		  $scope.requestName = currentUser['0'].first_name + " " + currentUser['0'].last_name;
          var lab_tech = users;
          var lab_techs = [];
          for (x in lab_tech) {
            var y;
            for (y in lab_tech[x].groups) {
                if (lab_tech[x].groups[y]==2) {
                  lab_techs.push(lab_tech[x]);
                }
            }
          }
          $scope.lab_techs = lab_techs;
      });
	  
	  $scope.formResponse = null;
  		$scope.requestSubmit = function() {
    		var data = {};
        data.labtech_Name = +$scope.lab_tech;
  			data.faculty_Name = +$scope.requestId;
  			data.subject = $scope.subject;
  			data.description = $scope.description;
  			data.due_date = $scope.due_date;
  			data.request_Type = $scope.request_type;
        data.upload = null;
        data.request_status = 'Pending';
  			var form_post = api_call($http, 'request/derp/', 'post', data);
        form_post.success(function(data) {
          $scope.formResponse = "Your request has been submitted. A Lab Aide or Lab Tech will be assigned to your request soon";
        })
        form_post.error(function(data) {
          $scope.formResponse = "There was an error submitting your request. Please contact an administrator"
        })

        
        $scope.lab_tech = null;
        $scope.faculty_name = null;
        $scope.subject = null;
        $scope.file = null;
        $scope.description = null;
        $scope.due_date = null;
        $scope.request_type = null;
  		}
  }])
  .controller('requests', ['$scope', '$http', function($scope, $http) {
    $scope.loading = true;
    $scope.predicate = 'description';
    var currentUser;
    var requests;
    var user_req;
	  var x;
	  var username;
    var users = {};
    var users_get = api_call($http, 'user/', 'get');
    users_get.success(function(response) {
      users = response;
      currentUser = $.grep(users, function(e) {return e.username == readCookie('username')});
      currentUser = currentUser['0'].id;
      //currentUser = get_id(currentUser.substring(0, currentUser.length - 1));
      requests = api_call($http, 'request/admin/', 'get');
    	requests.success(function(response) {
        response = request_adjust(response, users);
        $scope.requests = response;
    	});
      user_req = api_call($http, 'request/user/' + readCookie('userId') + '/', 'get');
      user_req.success(function(data) {
        data = user_req_adjust(data.requests, users);
        $scope.user_requests = data;
        $scope.loading = false;
      });
      user_req.error(function(data, status) {
        $scope.error = "There was an error loading requests";
      });
    });
    
      
    $scope.accept = function(id) {
      var data = {};
      data.id = id;
      data.labtech_Name = currentUser;
      data.request_status = "Approved";
      api_call($http, 'request/update/', 'post', data);
      setTimeout(function() {
        requests = api_call($http, 'request/admin/', 'get');
        requests.success(function(response) {
          response = request_adjust(response, users);
          $scope.requests = response;
        });
        user_req = api_call($http, 'request/user/' + readCookie('userId') + '/', 'get');
        user_req.success(function(data) {
        data = user_req_adjust(data.requests, users);
        $scope.user_requests = data;
      });
      }, 200); 
    }

    $scope.complete = function(id) {
      var data = {}
      data.id = id;
      data.labtech_Name = currentUser;
      data.request_status = "Completed";
      api_call($http, 'request/update/', 'post', data);
      setTimeout(function() {
        requests = api_call($http, 'request/admin/', 'get');
        requests.success(function(response) {
          response = request_adjust(response, users);
          $scope.requests = response;
        });
        user_req = api_call($http, 'request/user/' + readCookie('userId') + '/', 'get');
        user_req.success(function(data) {
        data = user_req_adjust(data.requests, users);
        $scope.user_requests = data;
      });
      }, 200);
    }

}])
.controller('rst_password', ['$scope', '$http', function($scope, $http) {
  $scope.formSubmit = function() {
    var reset;
    var data = {}
    data.username = $scope.user;
    reset = api_call($http, 'password/request_link/', 'post', data);
    reset.success(function() {
      $scope.hide = true;
      $scope.message = "A link has been sent to your email address to reset your password";
    });
    reset.error(function(data, status) {
      $scope.message = "There was an error sending your request";
    })
  }
}])
.controller('password', ['$scope', '$http', '$routeParams', function($scope, $http, $routeParams) {
  $scope.message = null;
    
    $scope.formSubmit = function() {
      if ($scope.password == $scope.check) {
        var data = {};
        data.password = $scope.password;
        data.link = $routeParams.link;
        var chgPwrd = api_call($http, 'password/reset/', 'post', data);
        chgPwrd.success(function() {
          $scope.hide = true;
          $scope.message = "Your password has been updated. You can log in now";
        });
        chgPwrd.error(function(data, status) {
          $scope.message = "There was an error with changing your password. Please try again.";
        })
      } else {
        $scope.message = "Password Verification does not match.";
      }
    }
}]);  
