angular
    .module('trustedheir')
    .controller('ResetPasswordCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        document.title = "Reset Password | TrustedHeir";
        const self = this;
        self.submitForm = emailForm => {
            if (emailForm.$valid) {
                let resetEmail = emailForm.email.$viewValue;
                Meteor.call('resetUserPassword', resetEmail, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    if (!cb.ok) {
                        return toastr.warning('This email is not registered', 'WARNING');
                    }
                    Session.clear('currentUser');
                    toastr.success(cb.message, 'SUCCESS');
                    $location.path('/');
                    $scope.$apply();
                });
            }
        };
    }]);
