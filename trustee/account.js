import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('TrusteeAccountCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', $scope => {
        document.title = "Your Account | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        self.trustee = Session.get('currentUser');
        self.submitForm = trustee => {
            if (trustee.$valid) {
                const updatedTrustee = {
                    username: `${trustee.firstName.$viewValue} ${trustee.lastName.$viewValue} _${Random.id()}`,
                    profile: {
                        firstName: trustee.firstName.$viewValue,
                        lastName: trustee.lastName.$viewValue
                    }
                };
                Meteor.call('updateUser', self.trustee._id, updatedTrustee, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Session.setPersistent('currentUser', cb.user);
                    $scope.$broadcast('currentUserChanged');
                    Meteor.call('setRecentActivity', self.trustee._id);
                });
            }
        };
    }]);
