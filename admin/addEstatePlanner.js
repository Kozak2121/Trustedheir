angular
    .module('trustedheir')
    .controller('AdminAddEstatePlannerCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        document.title = "Add Estate Planner | TrustedHeir";
        const self = this;
        self.submitForm = user => {
            if (user.$valid) {
                const newUser = {
                    username: `${user.firstName.$viewValue} ${user.lastName.$viewValue} _${Random.id()}`,
                    email: user.email.$viewValue,
                    password: Random.id(),
                    profile: {
                        firstName: user.firstName.$viewValue,
                        lastName: user.lastName.$viewValue,
                        email: user.email.$viewValue,
                        phone: user.phone.$viewValue
                    }
                };
                newUser.tempPassword = newUser.password;
                Accounts.createUser(newUser, (err) => {
                    if (err && err.reason === 'Email already exists.') {
                        return toastr.error('An account with this email address already exists. Please sign in.', 'ERROR');
                    } else if (err) {
                        return toastr.error(err.message, 'ERROR');
                    } else {
                        Meteor.call('createEstatePlannerNoAuthentication', Meteor.userId(), newUser, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            toastr.success(cb.message, 'SUCCESS');
                            $location.path('/admin/estate-planner-center');
                            $scope.$apply();
                        });
                    }
                });
            }
        };
    }]);
