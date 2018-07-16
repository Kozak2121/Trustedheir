angular
    .module('trustedheir')
    .controller('EstatePlannerCreateAccountCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', $scope => {
        document.title = "Create Account | TrustedHeir";
        const self = this;
        self.user = {};
        self.isShowedInfoEmail = Session.get('isShowedInfoEmail') || false;
        const savedUser = Session.get('savedUser');

        $scope.$watchGroup(['epca.user.firstName', 'epca.user.lastName', 'epca.user.email', 'epca.user.phone'], (newValues, oldValues, scope) => {
            if ((scope.userForm && scope.userForm.firstName.$valid && newValues[0]) ||
                (scope.userForm && scope.userForm.lastName.$valid && newValues[1]) ||
                (scope.userForm && scope.userForm.email.$valid && newValues[2]) ||
                (scope.userForm && scope.userForm.phone.$valid && newValues[3])) {
                Session.setPersistent('savedUser', newValues);
            } else if (savedUser) {
                self.user.firstName = savedUser[0];
                self.user.lastName = savedUser[1];
                self.user.email = savedUser[2];
                self.user.phone = savedUser[3];
            }
        });

        self.submitForm = user => {
            if (user.$valid) {
                let newUser = {
                    username: `${user.firstName.$viewValue} ${user.lastName.$viewValue} _${Random.id()}`,
                    email: user.email.$viewValue,
                    password: user.password.$viewValue,
                    profile: {
                        firstName: user.firstName.$viewValue,
                        lastName: user.lastName.$viewValue,
                        email: user.email.$viewValue,
                        phone: user.phone.$viewValue
                    }
                };
                Accounts.createUser(newUser, (err, cb) => {
                    if (err && err.reason === 'Email already exists.') {
                        return toastr.error('An account with this email address already exists. Please sign in.', 'ERROR');
                    } else if (err) {
                        return toastr.error(err.message, 'ERROR');
                    } else {
                        Meteor.call('createEstatePlannerNoAuthentication', Meteor.userId(), newUser, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Session.clear('savedUser');
                            Meteor.call('setRecentActivity', Meteor.userId());
                            self.isShowedInfoEmail = true;
                            Session.setPersistent('isShowedInfoEmail', true);
                            $scope.$apply();
                        });
                    }
                });
            }
        };
    }]);
