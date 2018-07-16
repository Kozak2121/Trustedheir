import {ROLE} from '../lib/constants';

angular
    .module('trustedheir')
    .controller('ResetAccountCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Reset Password | TrustedHeir";
        const self = this;
        const token = $stateParams.token;

        Meteor.call('getUserByToken', token, (err, user) => {
            if (err) {
                return toastr.error(err.message, 'ERROR');
            }
            toastr.success('Please, set your password', 'SUCCESS');
        });

        self.submitForm = passwords => {
            if (passwords.$valid) {
                const newPassword = passwords.password.$viewValue;
                Accounts.resetPassword(token, newPassword, (err) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    Session.setPersistent('currentUser', Meteor.user());
                    toastr.success('You successfully changed you password', 'SUCCESS');
                    Meteor.call('setRecentActivity', Meteor.userId());
                    if (Meteor.user().roles[0] === ROLE.ADMIN) {
                        $location.path('/admin/estate-planner-center');
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
        }
    }]);
