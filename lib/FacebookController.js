/**
 * Authorization and registration functions for Facebook
 *
 * @class FacebookController
 * @constructor
 */
function FacebookController($parent) {
  var validator         = require('validator'),
    extend            = require('node.extend'),
    request           = require('request');

  var $scope = new $parent.controller();
  $scope.loginFacebook = function(req, res, next) {
    var resp = res.resp;

    var fbtoken = req.params.accessToken;
    if(!fbtoken) {
      return resp.handleError(res, 400, new Error('Invalid facebook token'));
    }

    // Check if the Facebook token is valid or not,
    // then create account if so.

    request.get('https://graph.facebook.com/me?access_token=' + fbtoken, function(fberr, fbres, fbbody) {
      if(fberr || fbres.statusCode !== 200) {
        console.log(fberr, fbres);
        return resp.handleError(res, 500, new Error('Problem accessing Facebook'));
      }
      // get the email (and other info) from here.
      var details = JSON.parse(fbbody);
      if(typeof details.email === 'undefined') {
        resp.setCode(400);
        return resp.handleError(res, 404, new Error('Missing email access credentials, ensure your app has it enabled'));
      }

      // Check if the facebook user already has an account with us
      new $parent.models.UserModel().query({email: details.email}, function(err, rows) {
        if(rows.length <= 0) {
          // If there are no users with the facebook id,
          // Create a new user
          $parent.controllers.auth.createUser({
            email: details.email,
            username: details.email,
            facbook_access_token: fbtoken,
            facebook_id: details.id,
            active: true,
            display_name: details.name,
            avatar_url: '//graph.facebook.com/' + details.id + '/picture?type=large',
            biography: details.bio,
            occupation: details.work.length ? details.work[0].position.name : null,
            occupation_company: details.work.length ? details.work[0].employer.name : null,
            registrationCode: $parent.controllers.auth.createRegistrationCode(),
            role: 'user'
          }, function(err, newUser) {
            if(err) {
              return resp.handleError(res, 400, err);
            }
            resp.data(newUser.account());
            resp.send();
          });
          return;
        }

        // User exists in the database.
        var user = rows[0];
        $parent.controllers.auth.loginUser(user, function(err, user) {
          if(err) {
            return resp.handleError(res, 400, err);
          }
          resp.data(user.account());
          resp.send();
        });
      });
    });
  }
  $scope.addRoute({
    method: 'post',
    path: '/auth/facebook',
    controller: $scope.loginFacebook
  });
  return $scope;
}
module.exports = FacebookController;