import {STATES, STATUS} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('EstatePlannerAccountCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', ($scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Your Account | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        self.estatePlanner = Session.get('currentUser');
        self.estatePlannerCard = {};
        self.currentYear = new Date().getFullYear();
        self.status = STATUS.numeric;
        if (self.estatePlanner) {
            Meteor.call('getCustomerCardInfoById', self.estatePlanner._id, (err, cb) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.estatePlannerCardCreditCardName = cb.sources.data[0].name;
                    self.estatePlannerCardNumber = `***************${cb.sources.data[0].last4}`;
                    self.estatePlannerCardExp_month = cb.sources.data[0].exp_month;
                    self.estatePlannerCardExp_year = cb.sources.data[0].exp_year;
                    self.estatePlannerCardCvc = '****';
                });
            });
        }

        self.submitForm = estatePlanner => {
            if (estatePlanner.$valid) {
                const updatedEstatePlanner = {
                    username: `${estatePlanner.firstName.$viewValue} ${estatePlanner.lastName.$viewValue} _${Random.id()}`,
                    profile: {
                        firstName: estatePlanner.firstName.$viewValue,
                        lastName: estatePlanner.lastName.$viewValue,
                        phone: estatePlanner.phone.$viewValue
                    }
                };
                Meteor.call('updateUser', self.estatePlanner._id, updatedEstatePlanner, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Session.setPersistent('currentUser', cb.user);
                    self.estatePlanner = Session.get('currentUser');
                    $scope.$broadcast('currentUserChanged');
                    Meteor.call('setRecentActivity', self.estatePlanner._id);
                });
            }
        };

        self.cancelAccount = () => {
            bootbox.confirm({
                title: 'Are you sure you want to close your account?',
                message: `Please confirm that you would like to close your TrustedHeir account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, close my account',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep my account',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('cancelAccountByEstatePlanner', self.estatePlanner, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Session.setPersistent('currentUser', cb.user);
                            $scope.$broadcast('currentUserChanged');
                            Meteor.call('setRecentActivity', self.estatePlanner._id);
                            self.estatePlanner = Session.get('currentUser');
                            $scope.$apply();
                            toastr.warning(cb.message, 'WARNING');
                        });
                    }
                }
            });

        };
        self.reActivateAccount = () => {
            bootbox.confirm({
                title: 'Are you sure you want to reactivate your account?',
                message: `Please confirm that you would like to reactivate your TrustedHeir account.`,
                buttons: {
                    confirm: {
                        label: 'Yes, reactivate my account',
                        className: 'btn-danger'
                    },
                    cancel: {
                        label: 'No, keep my account closed',
                        className: 'btn-success'
                    }
                },
                callback: result => {
                    if (result) {
                        Meteor.call('reactivateAccountByEstatePlanner', self.estatePlanner, (err, cb) => {
                            if (err) {
                                return toastr.error(err.message, 'ERROR');
                            }
                            Session.setPersistent('currentUser', cb.user);
                            $scope.$broadcast('currentUserChanged');
                            Meteor.call('setRecentActivity', self.estatePlanner._id);
                            self.estatePlanner = Session.get('currentUser');
                            $scope.$apply();
                            toastr.warning(cb.message, 'SUCCESS');
                        });
                    }
                }
            });

        };

        self.updatePaymentInfo = estatePlannerCardForm => {
            if (estatePlannerCardForm.exp_year.$viewValue < self.currentYear) {
                estatePlannerCardForm.exp_year.$invalid = true;
                estatePlannerCardForm.exp_year.$valid = false;
                return;
            }
            if (estatePlannerCardForm.$valid) {
                let cardInfo = {
                    name: estatePlannerCardForm.creditCardName.$viewValue,
                    number: estatePlannerCardForm.number.$viewValue,
                    exp_month: estatePlannerCardForm.exp_month.$viewValue,
                    exp_year: estatePlannerCardForm.exp_year.$viewValue,
                    cvc: estatePlannerCardForm.cvc.$viewValue,
                    object: 'card'
                };

                Meteor.call('updateEstatePlannerCard', self.estatePlanner._id, cardInfo, (err, cb) => {
                    if (err) {
                        return toastr.error(err.error.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', self.estatePlanner._id);
                    $location.path('/estate-planner/client-center');
                    $scope.$apply();
                });
            }
        };
    }]);
