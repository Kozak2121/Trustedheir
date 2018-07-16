import {STATUS} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('EstatePlannerAddPaymentInfo', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location) => {
        document.title = "Billing Details | TrustedHeir";
        const self = this;
        const currentUser = Session.get('currentUser');

        self.currentYear = new Date().getFullYear();

        self.submitForm = user => {
            if (user.exp_year.$viewValue < self.currentYear) {
                user.exp_year.$invalid = true;
                user.exp_year.$valid = false;
                return;
            }
            if (user.$valid) {
                const cardInfo = {
                    name: user.creditCardName.$viewValue,
                    number: user.number.$viewValue,
                    exp_month: user.exp_month.$viewValue,
                    exp_year: user.exp_year.$viewValue,
                    cvc: user.cvc.$viewValue
                };
                const newUser = {
                    email: currentUser.profile.email,
                    card: cardInfo
                };

                Meteor.call('createEstatePlannerPayment', currentUser._id, newUser, (err, cb) => {
                    if (err) {
                        return toastr.error(err.error.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', currentUser._id);
                    $location.path('/estate-planner/client-center');
                    $scope.$apply();
                    $scope.$destroy();
                });
            }
        };
    }]);
