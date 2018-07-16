import {STATES} from '../../lib/constants';

angular
    .module('trustedheir')
    .controller('AdminEditEstatePlannerCtrl', ['$scope', '$state', '$window', '$document', '$location', '$timeout', '$stateParams', ($scope, $state, $window, $document, $location, $timeout, $stateParams) => {
        document.title = "Edit Estate Planner | TrustedHeir";
        const self = this;
        self.statesList = STATES;
        const currentUser = Session.get('currentUser');
        if (currentUser) {
            Meteor.call('getUserById', $stateParams.id, (err, user) => {
                $timeout(() => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    self.user = user;
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
                const updatedEstatePlannerEmail = estatePlanner.email.$viewValue;
                Meteor.call('updateUser', self.user._id, updatedEstatePlanner, (err, cb) => {
                    if (err) {
                        return toastr.error(err.message, 'ERROR');
                    }
                    const msg = cb.message;
                    Meteor.call('changeEmail', self.user._id, updatedEstatePlannerEmail, (err) => {
                        "use strict";
                        if (err) {
                            return toastr.error(err.message, 'ERROR');
                        }
                        toastr.success(msg, 'SUCCESS');
                        $location.path(`admin/estate-planner-center`);
                        $scope.$apply();
                    })
                });
            }
        };
    }]);
