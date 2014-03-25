module.exports = function($vern) {
  $vern.controllers.FacebookController = require('./FacebookController');
  $vern.models.UserModel = require('./UserModel')($vern);
  return $vern;
}