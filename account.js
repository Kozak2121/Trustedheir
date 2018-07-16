import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('AdminAccountCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', $scope => {
        document.title = "Your Account | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        self.admin = Session.get('currentUser');
        self.submitForm = admin => {
            if (admin.$valid) {
                const updatedAdmin = {
                    username: `${admin.firstName.$viewValue} ${admin.lastName.$viewValue} _${Random.id()}`,
                    profile: {
                        firstName: admin.firstName.$viewValue,
                        lastName: admin.lastName.$viewValue,
                    }
                };
                const updatedAdminEmail = admin.email.$viewValue;
                Meteor.call('updateUser', self.admin._id, updatedAdmin, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    const msg = cb.message;
                    const user = cb.user;
                    Meteor.call('changeEmail', self.admin._id, updatedAdminEmail, (err, cb) => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        toastr.success(msg, 'SUCCESS');
                        Session.setPersistent('currentUser', user);
                        $scope.$broadcast('currentUserChanged');
                    })
                });
            }
        };
    }]);
