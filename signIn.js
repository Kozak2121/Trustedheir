import {ROLE} from '../lib/constants'

angular
    .module('trustedheir')
    .controller('SignInCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        document.title = "Sign In | TrustedHeir";
        const self = this;
        const previousUrlId = Session.get('previousUrlId');

        self.submitForm = user => {
            if (user.$valid) {
                const loginUser = {
                    email: user.email.$viewValue,
                    password: user.password.$viewValue
                };
                Meteor.call('checkCurrentEmail', loginUser.email, (err, cb) => {
                    "use strict";
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (!cb.ok) {
                        return toastr.error('Incorrect email and password combination', 'ERROR');
                    } else {
                        Meteor.loginWithPassword(loginUser.email, loginUser.password, (err) => {
                            if ((err && err.reason === 'User not found') || (err && err.reason === 'Incorrect password')) {
                                return toastr.error('Incorrect email and password combination', 'ERROR');
                            }
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Session.setPersistent('currentUser', Meteor.user());
                            toastr.success('You successfully signed in', 'SUCCESS');
                            if (Meteor.user().roles[0] === ROLE.ADMIN) {
                                if (previousUrlId) {
                                    $location.path(`/admin/estate-planner-center/${previousUrlId}`);
                                    Session.clear('previousUrlId');
                                } else $location.path('/admin/estate-planner-center');
                            } else if (Meteor.user().roles[0] === ROLE.ESTATE_PLANNER) {
                                $location.path('/estate-planner/client-center');
                            } else if (Meteor.user().roles.includes(ROLE.CLIENT)) {
                                $location.path('/client/digital-assets');
                            } else if (Meteor.user().roles[0] === ROLE.TRUSTEE) {
                                $location.path('/trustee/digital-assets');
                            } else {
                                $location.path('/');
                            }
                            $scope.$apply();
                        });
                    }
                });
            }
        };
    }]);
