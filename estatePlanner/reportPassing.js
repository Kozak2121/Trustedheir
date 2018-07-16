import {STATES} from '../../lib/constants';
import moment from 'moment';

angular
    .module('trustedheir')
    .controller('EstatePlannerReportPassingCtrl', ['$stateParams', '$scope', '$state', '$window', '$document', '$location', '$timeout', ($stateParams, $scope, $state, $window, $document, $location, $timeout) => {
        document.title = "Report Passing | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        self.isEditModeActive = false;
        self.today = moment(new Date()).format('MM/DD/YYYY');
        const currentUser = Session.get('currentUser');

        if (currentUser) {
            Meteor.call('getUserById', $stateParams.id, (err, client) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.client = client;
                    self.client.profile.dateOfDeath = moment(Date.now()).format('MM/DD/YYYY');
                });
            });
        }

        self.updateClient = (client, id) => {
            if (!self.isEditModeActive) {
                if (client.firstName.$valid &&
                    client.lastName.$valid &&
                    client.address.$valid &&
                    client.city.$valid &&
                    client.state.$valid &&
                    client.zipCode.$valid) {
                    let newClient = {
                        username: `${client.firstName.$viewValue} ${client.lastName.$viewValue} _${Random.id()}`,
                        profile: {
                            firstName: client.firstName.$viewValue,
                            lastName: client.lastName.$viewValue,
                            address: client.address.$viewValue,
                            city: client.city.$viewValue,
                            state: client.state.$viewValue,
                            zipCode: client.zipCode.$viewValue
                        }
                    };
                    Meteor.call('updateUser', id, newClient, (err, cb) => {
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        if (cb.message) {
                            cb.message = 'Client information successfully updated';
                        }
                        toastr.success(cb.message, 'SUCCESS');
                        Meteor.call('setRecentActivity', currentUser._id);
                        $scope.$apply();
                    });
                }
            }
        };

        self.submitForm = (deathInfoForm, client) => {
            if (deathInfoForm.$valid) {
                const deathInfo = {
                    dateOfDeath: deathInfoForm.dateOfDeath.$viewValue,
                    deathCertificateNumber: deathInfoForm.deathCertificateNumber.$viewValue,
                };
                Meteor.call('clientPostPassingInProgress', deathInfo, client, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    toastr.success(cb.message, 'SUCCESS');
                    Meteor.call('setRecentActivity', currentUser._id);
                    $location.path('/estate-planner/client-center');
                    $scope.$apply();
                });
            }
        };

    }]);

